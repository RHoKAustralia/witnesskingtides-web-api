var debugMessage = function(msg) {
	$("#debug").html(msg);
}

Modernizr.addTest('formdata', 'FormData' in window);
Modernizr.addTest('xhr2', 'FormData' in window && 'ProgressEvent' in window);

//The EventAggregator lets our views notify each other without having to reference each other directly
var EventAggregator = _.extend({}, Backbone.Events);
var SERVICE_URL = "http://kingtides-api-env-fubbpjhd29.elasticbeanstalk.com";

var PROJ_LL84        = new OpenLayers.Projection("EPSG:4326");
var PROJ_WEBMERCATOR = new OpenLayers.Projection("EPSG:900913");

var LAYER_USER_POSITION = "User Position";
var LAYER_TIDES = "Tides";
var LAYER_PHOTOS = "Flickr Photos";

var BLUEIMP_GALLERY_OPTIONS = {
    stretchImages: true,
    useBootstrapModal: false
};

function IsPhoneDisplay() {
    return $("#responsiveMarker").is(":visible");
}

function IsMapOffCanvas() {
    return $("div.row-offcanvas-right").hasClass("offcanvas-shift");
}

function InvokeSidebarToggler() {
    var btn = $("#sidebarTogglerButton");
    if (btn.is(":visible"))
        btn[0].click();
}

function RollupNavbar() {
    var btn = $("button.navbar-toggle");
    if (btn.is(":visible"))
        btn[0].click();
}

//var FLICKR_USER_ID = '69841693@N07'; //witnesskingtides
//var FLICKR_API_KEY = '3e35f603d86b21583ad77509dd9fd597';

//Test account settings
var FLICKR_USER_ID = '110846737@N06';
var FLICKR_API_KEY = 'affd35180d0689ad7ca999c1619d0e6d';

var LAYER_GOOG_PHYS = "goog-phys";
var LAYER_GOOG_STREET = "goog-street";
var LAYER_GOOG_HYBRID = "goog-hybrid";
var LAYER_GOOG_SATELLITE = "goog-satellite";
var LAYER_OSM = "osm";

var MAX_INTERACTION_SCALE = 60000;

/**
 * An in-memory cache of flickr photo data, from which the layer markers are rendered
 * and a thumbnail gallery is created from
 */
var FlickrPhotoCache = OpenLayers.Class({
    photosPerPage: 50,
    page: -1,
    pages: 0,
    total: 0,
    _dataByPage: [],
    _map: null,
    initialize: function (options) {
        this._map = options.map;
        if (_.has(options, "photosPerPage"))
            this.photosPerPage = options.photosPerPage;
        EventAggregator.on("getPhotoPageBounds", _.bind(this.onGetPhotoPageBounds, this));
        EventAggregator.on("resetPhotoFilter", _.bind(this.onResetPhotoFilter, this));
        EventAggregator.on("applyPhotoFilter", _.bind(this.onApplyPhotoFilter, this));
    },
    getMapBounds: function() {
        var bounds = this._map.getExtent();
        bounds.transform(this._map.getProjectionObject(), PROJ_LL84);
        return [
            bounds.left,
            bounds.bottom,
            bounds.right,
            bounds.top
        ];
    },
    getCurrentPageData: function() {
        return this._dataByPage[this.page];
    },
    getPageData: function (pageIndex) {
        return this._dataByPage[pageIndex];
    },
    fetchPage: function (pageIndex) {
        this.page = pageIndex;
        EventAggregator.trigger("flickrPageLoading");
        var that = this;
        var promise = $.getJSON(
            "http://api.flickr.com/services/rest?jsoncallback=?",
            this.getRequestParams()
        );
        promise.done(function (data) {
            if (data.photos.page == that._dataByPage.length)
                that._dataByPage.push(data.photos);
            else
                that._dataByPage[data.photos.page - 1] = data.photos;
            that.page = data.photos.page - 1;
            that.pages = data.photos.pages;
            that.total = parseInt(data.photos.total, 10);
            EventAggregator.trigger("flickrPageLoaded", { cache: that, firstLoad: true });
        }).fail(function () {
            debugger;
        });
    },
    loadCurrentPage: function() {
        if (typeof (this._dataByPage[this.page]) == 'undefined') {
            this.fetchPage(this.page);
        } else { //Already fetched, just raise the necessary events
            EventAggregator.trigger("flickrPageLoading");
            EventAggregator.trigger("flickrPageLoaded", { cache: this, firstLoad: false });
        }
    },
    loadNextPage: function() {
        if (this.page < this.pages) {
            this.page++;
            if (typeof(this._dataByPage[this.page]) == 'undefined') {
                this.fetchPage(this.page);
            } else { //Already fetched, just raise the necessary events
                EventAggregator.trigger("flickrPageLoading");
                EventAggregator.trigger("flickrPageLoaded", { cache: this, firstLoad: false });
            }
        }
    },
    loadPrevPage: function() {
        if (this.page > 0) {
            this.page--;
            if (typeof (this._dataByPage[this.page]) == 'undefined') { //Shouldn't happen, but just in case
                this.fetchPage(this.page);
            } else { //Already fetched, just raise the necessary events
                EventAggregator.trigger("flickrPageLoading");
                EventAggregator.trigger("flickrPageLoaded", { cache: this, firstLoad: false });
            }
        }
    },
    onGetPhotoPageBounds: function (e) {
        if (typeof (this._dataByPage[this.page]) == 'undefined') {
            e.callback(null);
        } else {
            var bounds = new OpenLayers.Bounds();
            var photoset = this._dataByPage[this.page];
            for (var i = 0; i < photoset.photo.length; i++) {
                var photo = photoset.photo[i];
                bounds.extendXY(photo.longitude, photo.latitude);
            }
            e.callback(bounds);
        }
    },
    onResetPhotoFilter: function() {
        this.args = null;
        this.reset();
    },
    onApplyPhotoFilter: function(args) {
        this.args = args;
        this.reset();
    },
    getRequestParams: function() {
        var params = {
            api_key: FLICKR_API_KEY,
            format: 'json',
            user_id: FLICKR_USER_ID,
            method: 'flickr.photos.search',
            extras: 'geo,url_s,url_c,url_o,date_taken,date_upload,owner_name,original_format,o_dims,views',
            per_page: this.photosPerPage,
            page: (this.page + 1)/*,
            bbox: this.getMapBounds()
            */
        };

        if (this.args && this.args.year) {
            console.log("Filtering by year: " + this.args.year);
            var dtStart = moment.utc([this.args.year, 0, 1]);
            var dtEnd = moment.utc([this.args.year, 11, 31]);
            console.log("Flickr date range: " + dtStart.unix() + " to " + dtEnd.unix());
            params.min_taken_date = dtStart.unix();
            params.max_taken_date = dtEnd.unix();
        } 
        return params;
    },
    /**
     * Clears the cache and re-requests the first "page" of photos from flickr using the
     * new extents
     */
    updateExtents: function() {
        this.reset();
    },
    reset: function () {
        this._dataByPage = [];
        this.page = -1,
        this.pages = 0;
        this.total = 0;
        EventAggregator.trigger("flickrCacheReset");
        this.fetchPage(0);
    }
});

/**
 * A specific format for parsing Flickr API JSON responses.
 */
OpenLayers.Format.Flickr = OpenLayers.Class(OpenLayers.Format, {
    read: function(obj) {
        if(obj.stat === 'fail') {
            throw new Error(
                ['Flickr failure response (',
                 obj.code,
                 '): ',
                 obj.message].join(''));
        }
        if(!obj || !obj.photos ||
           !OpenLayers.Util.isArray(obj.photos.photo)) {
            throw new Error(
                'Unexpected Flickr response');
        }
        var photos = obj.photos.photo, photo,
            x, y, point,
            feature, features = [];
        for(var i=0,l=photos.length; i<l; i++) {
            photo = photos[i];
            x = photo.longitude;
            y = photo.latitude;
            point = new OpenLayers.Geometry.Point(x, y);
            feature = new OpenLayers.Feature.Vector(point, {
                title: photo.title,
                img_url: photo.url_s
            });
            features.push(feature);
        }
        return features;
    }
});

/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control/Panel.js
 */

/**
 * Class: OpenLayers.Control.TextButtonPanel
 * The TextButtonPanel is a panel designed primarily to hold TextButton
 * controls.  By default it has a displayClass of olControlTextButtonPanel,
 * which hooks it to a set of text-appropriate styles in the default stylesheet.
 *
 * Inherits from:
 *  - <OpenLayers.Control.Panel>
 */
OpenLayers.Control.TextButtonPanel = OpenLayers.Class(OpenLayers.Control.Panel, {

    /**
    * APIProperty: vertical
    * {Boolean} Whether the button strip should appear vertically on the map.
    */
    vertical: false,

    /**
    * APIProperty: additionalClass
    * {String} An additional class to be applied in addition to
    * .olControlTextButtonPanel to allow for non-default positioning.
    */
    additionalClass: null,

    /**
    * Constructor: OpenLayers.Control.TextButtonPanel
    * Create a panel for holding text-based button controls
    *
    * Parameters:
    * options - {Object}
    */

    /**
    * Method: draw
    * Overrides the draw method in <OpenLayers.Control.Panel> by applying
    * up to two additional CSS classes
    * Returns:
    * {DOMElement}
    */
    draw: function () {
        OpenLayers.Control.Panel.prototype.draw.apply(this, arguments);
        this.setOrientationClass();
        this.setAdditionalClass();
        return this.div;
    },

    /**
    * Method: redraw
    * Overrides the redraw method in <OpenLayers.Control.Panel> by setting
    * the orientation class.
    */
    redraw: function () {
        OpenLayers.Control.Panel.prototype.redraw.apply(this, arguments);
        this.setOrientationClass();
    },

    /**
    * Method: setOrientationClass
    * Adds the "vertical" class if this TextButtonPanel should have a vertical,
    * rather than horizontal, layout.
    */
    setOrientationClass: function () {
        if (this.vertical) {
            OpenLayers.Element.addClass(this.div, "vertical");
        }
        else {
            OpenLayers.Element.removeClass(this.div, "vertical");
        }
    },

    /**
    * APIMethod: setAdditionalClass
    * Sets an additional CSS class for this TextButtonPanel
    * (for example, to override the default placement).  This
    * allows more than one TextButtonPanel to exist on the map
    * at once.
    */
    setAdditionalClass: function () {
        if (!!this.additionalClass) {
            OpenLayers.Element.addClass(this.div, this.additionalClass);
        }
    },

    CLASS_NAME: "OpenLayers.Control.TextButtonPanel"
});

var MapView = Backbone.View.extend({
    map: null,
    userLayers: [],
    tideEvents: [],
    activeModal: null,
    tideModalTemplate: null,
    photoModalTemplate: null,
    selectControl: null,
    bManualLocationRecording: false,
	initialize: function(options) {
        this.tideModalTemplate = _.template($("#tideModal").html());
        this.photoModalTemplate = _.template($("#photoModal").html());
        this.lightboxTemplate = _.template($("#lightbox").html());
        EventAggregator.on("mapZoomToBounds", _.bind(this.onMapZoomToBounds, this));
        EventAggregator.on("requestLegendUpdate", _.bind(this.onRequestLegendUpdate, this));

        var that = this;
        $(document).on("change", "#layer-toggle-tides input[type='checkbox']", function (e) {
            for (var i = 0; i < that.userLayers.length; i++) {
                if (that.userLayers[i].name == LAYER_TIDES) {
                    that.userLayers[i].setVisibility($(e.target).is(":checked"));
                }
            }
        });
        $(document).on("change", "#layer-toggle-photos input[type='checkbox']", function (e) {
            for (var i = 0; i < that.userLayers.length; i++) {
                if (that.userLayers[i].name == LAYER_PHOTOS) {
                    that.userLayers[i].setVisibility($(e.target).is(":checked"));
                }
            }
        });
        $(document).on("change", "#layer-toggle-gps input[type='checkbox']", function (e) {
            for (var i = 0; i < that.userLayers.length; i++) {
                if (that.userLayers[i].name == LAYER_USER_POSITION) {
                    that.userLayers[i].setVisibility($(e.target).is(":checked"));
                }
            }
        });
	},
	render: function() {
        this.layers = {};
        this.layers[LAYER_GOOG_PHYS] = new OpenLayers.Layer.Google(
            "Google Physical",
            {type: google.maps.MapTypeId.TERRAIN}
        );
        this.layers[LAYER_GOOG_STREET] = new OpenLayers.Layer.Google(
            "Google Streets", // the default
            {numZoomLevels: 20}
        );
        this.layers[LAYER_GOOG_HYBRID] = new OpenLayers.Layer.Google(
            "Google Hybrid",
            {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20}
        );
        this.layers[LAYER_GOOG_SATELLITE] = new OpenLayers.Layer.Google(
            "Google Satellite",
            {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
        );
        this.layers[LAYER_OSM] = new OpenLayers.Layer.OSM("OpenStreetMap");
        //TODO: Cap extent to Australia only?
		this.map = new OpenLayers.Map("map", {
            projection: "EPSG:3857",
            layers: [
                this.layers[LAYER_GOOG_PHYS],
                this.layers[LAYER_GOOG_STREET],
                this.layers[LAYER_GOOG_HYBRID],
                this.layers[LAYER_GOOG_SATELLITE],
                this.layers[LAYER_OSM]
            ]
		});
		this.cache = new FlickrPhotoCache({ map: this.map, photosPerPage: 100 });

		var that = this;

		EventAggregator.on("loadCurrentFlickrPage", function () {
		    that.cache.loadCurrentPage();
		});
		EventAggregator.on("loadNextFlickrPage", function () {
		    that.cache.loadNextPage();
		});
		EventAggregator.on("loadPrevFlickrPage", function () {
		    that.cache.loadPrevPage();
		});
		EventAggregator.on("showPhotos", _.bind(this.onShowPhotos, this));
		EventAggregator.on("showModal", _.bind(function (e) {
		    this.showModal(e.template);
		}, this));

        this.map.addControl(new OpenLayers.Control.Scale());
        this.map.addControl(new OpenLayers.Control.MousePosition({ displayProjection: "EPSG:4326" }));

        var panel = new OpenLayers.Control.TextButtonPanel({
            vertical: true,
            additionalClass: "vpanel"
        });

        panel.addControls([
            new OpenLayers.Control.Button({
                trigger: function () {
                    window.location.hash = "#home";
                },
                displayClass: 'wkt-btn-about'
            }),
            new OpenLayers.Control.Button({
                trigger: function () {
                    window.location.hash = "#upload";
                },
                displayClass: 'wkt-btn-upload'
            }),
            new OpenLayers.Control.Button({
                trigger: function () {
                    window.location.hash = "#photos";
                },
                displayClass: 'wkt-btn-photos'
            }),
            new OpenLayers.Control.Button({
                trigger: function() {
                    that.zoomToMylocation();
                },
                displayClass: 'wkt-btn-locate'
            }),
            new OpenLayers.Control.Button({
                trigger: function() {
                    that.initialView();
                },
                displayClass: 'wkt-btn-initialzoom'
            })
        ]);

        this.map.addControl(panel);

        //HACK: Have to insert this content at runtime
        $("div.wkt-btn-aboutItemInactive").html("<i class='fa fa-home'></i>");
        $("div.wkt-btn-uploadItemInactive").html("<i class='fa fa-camera'></i>");
        $("div.wkt-btn-photosItemInactive").html("<i class='fa fa-picture-o'></i>");
        $("div.wkt-btn-locateItemInactive").html("<i class='fa fa-location-arrow'></i>");
        $("div.wkt-btn-initialzoomItemInactive").html("<i class='fa fa-arrows-alt'></i>");

        this.map.updateSize();

        $.getJSON(SERVICE_URL + "/tides", _.bind(function (tides) {
            this.tideEvents = tides;
            this.createTideLayer();
            this.createPositionLayer();
            this.createFlickrPhotoLayer();
            this.map.events.register("moveend", this, this.onMoveEnd);
            this.map.events.register("changebaselayer", this, this.onBaseLayerChange);
            this.setActiveBaseLayer($("a.base-layer-item[data-layer-name='goog-phys']"));
            //Initial view is Australia
            this.initialView();
            EventAggregator.on("addNewPhotoMarker", _.bind(this.onAddNewPhotoMarker, this));
            EventAggregator.on("showPositionOnMap", _.bind(this.onShowPositionOnMap, this));
            EventAggregator.on("toggleManualLocationRecording", _.bind(this.onToggleManualLocationRecording, this));
            EventAggregator.trigger("requestLegendUpdate");
        }, this));

		
	},
	initialView: function() {
	    var bounds = new OpenLayers.Bounds(10470115.700925, -5508791.4417243, 19060414.686531, -812500.42453675);
	    this.map.zoomToExtent(bounds, false);
	    this.cache.updateExtents(bounds);
    },
    zoomToMylocation: function() {
        if (typeof(navigator.geolocation) != 'undefined') {
            navigator.geolocation.getCurrentPosition(_.bind(function(pos) { //Success
                this.zoomLonLat(pos.coords.longitude, pos.coords.latitude, 14);
            }, this), _.bind(function(pos) { //Failure
                alert("Could not get your location");
            }, this), { //Options
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 7000
            });
        } else {
            alert("Your browser does not support geolocation");
        }
    },
    zoomLonLat: function(lon, lat, level) {
        var point = new OpenLayers.Geometry.Point(lon, lat);
        point.transform(PROJ_LL84, PROJ_WEBMERCATOR);
        this.map.moveTo(new OpenLayers.LonLat(point.x, point.y), level);
    },
    onMapZoomToBounds: function(bounds) {
        if (bounds != null) {
            this.map.zoomToExtent(bounds);
        }
    },
    onRequestLegendUpdate: function() {
        EventAggregator.trigger("updateLegend", { layers: this.userLayers });
    },
    onShowPositionOnMap: function(e) {
        if (this.positionLayer) {
            this.positionLayer.removeAllFeatures();

            var point = new OpenLayers.Geometry.Point(e.lon, e.lat);
            point.transform(PROJ_LL84, PROJ_WEBMERCATOR);
            var feat = new OpenLayers.Feature.Vector(point);

            this.positionLayer.addFeatures([ feat ]);

            var zoomLevel = 14;
            this.zoomLonLat(e.lon, e.lat, zoomLevel);
        }
    },
    onToggleManualLocationRecording: function() {
        if (this.bManualLocationRecording === true) {
            this.endManualRecordingMode();
        } else {
            this.beginManualRecordingMode();
        }
    },
    beginManualRecordingMode: function() {
        this.bManualLocationRecording = true;
        alert("You are now manually recording your location. A marker has been placed on the centre of the map. Pan/Zoom to your correct location");
        this.positionLayer.removeAllFeatures();
        var cent = this.map.getExtent().getCenterLonLat();
        this.positionLayer.addFeatures([
            new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(cent.lon, cent.lat))
        ]);
    },
    endManualRecordingMode: function() {
        this.bManualLocationRecording = false;
        alert("You have stopped manual recording of your location. Your photo location field has been updated");
        var center = this.map.getExtent().getCenterLonLat();
        center.transform(PROJ_WEBMERCATOR, PROJ_LL84);
        EventAggregator.trigger("updatePhotoLocationField", { lon: center.lon, lat: center.lat });
    },
    setActiveBaseLayer: function(el) {
        if (this.map != null) {
            var layerName = el.attr("data-layer-name");
            if (_.has(this.layers, layerName)) {
                //Clear active state first
                $("#map-layer-switcher").find("li.active").removeClass("active");

                this.map.setBaseLayer(this.layers[layerName]);
                el.parent().addClass("active");

                //Twiddle the text color so that scale/coordinates are more legible against these backdrops
                var mouseEl = $(".olControlMousePosition");
                var scaleEl = $(".olControlScale").find("div");
                if (layerName == LAYER_GOOG_HYBRID || layerName == LAYER_GOOG_SATELLITE) {
                    mouseEl.addClass("goog-sat-text");
                    scaleEl.addClass("goog-sat-text");
                } else {
                    mouseEl.removeClass("goog-sat-text");
                    scaleEl.removeClass("goog-sat-text");
                }
            }
        }
    },
    showModal: function(html) {
        if (this.activeModal) {
            this.activeModal.remove();
            //You'd think boostrap modal would've removed this for you?
            $(".modal-backdrop").remove();
        }
        this.activeModal = $(html);
        $("body").append(this.activeModal);
        this.activeModal.modal('show').on("hidden.bs.modal", function(e) {
            //You'd think boostrap modal would've removed this for you?
            $(".modal-backdrop").remove();
        });
    },
    onBaseLayerChange: function(e) {

    },
	onMoveEnd: function(e) {
		//logger.logi(this.map.getExtent());
        if (this.bManualLocationRecording === true) {
            this.positionLayer.removeAllFeatures();
            var cent = this.map.getExtent().getCenterLonLat();
            this.positionLayer.addFeatures([
                new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(cent.lon, cent.lat))
            ]);
        }
	},
    createPositionLayer: function() {
        var style = new OpenLayers.Style({
            fillColor: "#ffcc66",
            fillOpacity: 0.8,
            strokeColor: "#cc6633",
            externalGraphic: "images/marker.png",
            graphicWidth: 16,
            graphicHeight: 16
        });
        this.positionLayer = new OpenLayers.Layer.Vector(LAYER_USER_POSITION, {
            projection: "EPSG:3857",
            styleMap: new OpenLayers.StyleMap({
                "default": style,
                "select": {
                    fillColor: "#8aeeef",
                    strokeColor: "#32a8a9"
                }
            })
        });
        this.addUserLayer(this.positionLayer);
    },
    addUserLayer: function(layer) {
        this.map.addLayer(layer);
        this.userLayers.push(layer);
    },
	createUserUploadedPhotoLayer: function() {

	},
    createTideLayer: function() {
        var style = new OpenLayers.Style({
            fillColor: "#ffcc66",
            fillOpacity: 0.8,
            strokeColor: "#cc6633",
            externalGraphic: "images/water.png",
            graphicWidth: 16,
            graphicHeight: 16
        });

        this.tidesLayer = new OpenLayers.Layer.Vector(LAYER_TIDES, {
            projection: "EPSG:3857",
            styleMap: new OpenLayers.StyleMap({
                "default": style,
                "select": {
                    fillColor: "#8aeeef",
                    strokeColor: "#32a8a9"
                }
            })
        });

        //Populate layer. Need to manually re-project to spherical mercator
        var srcProj = PROJ_LL84;
        var dstProj = PROJ_WEBMERCATOR;
        var features = [];
        for (var i = 0; i < this.tideEvents.length; i++) {
            var tideEvent = this.tideEvents[i];
            var pt = new OpenLayers.Geometry.Point(tideEvent.event.longitude, tideEvent.event.latitude);
            pt.transform(srcProj, dstProj);
            var feat = new OpenLayers.Feature.Vector(pt, tideEvent);
            features.push(feat);
        }
        this.tidesLayer.addFeatures(features);

        this.addUserLayer(this.tidesLayer);
        this.updateSelectControl();
        this.tidesLayer.events.on({"featureselected": _.bind(this.onTideSelected, this)});
    },
    /**
     * Updates the SelectFeature control based on the available selectable layers
     */
    updateSelectControl: function() {
        var layers = [];
        if (this.photosLayer)
            layers.push(this.photosLayer);
        if (this.tidesLayer)
            layers.push(this.tidesLayer);

        if (!this.selectControl) {
            this.selectControl = new OpenLayers.Control.SelectFeature(layers, {hover: false});
            this.map.addControl(this.selectControl);
        } else {
            this.selectControl.setLayer(layers);
        }
        this.selectControl.activate();
    },
    onAddNewPhotoMarker: function (data) {
        var pt = new OpenLayers.Geometry.Point(data.lon, data.lat);
        pt.transform(PROJ_LL84, PROJ_WEBMERCATOR);
        this.photosLayer.addFeatures([
            new OpenLayers.Feature.Vector(
                pt, { flickrId: data.flickrId })
        ]);
        this.photosLayer.redraw();
    },
	createFlickrPhotoLayer: function() {
		var style = new OpenLayers.Style({
            pointRadius: "${radius}",
            fillColor: "#ffcc66",
            fillOpacity: 0.8,
            strokeColor: "#cc6633",
            //externalGraphic: "${thumbnail}",
            //graphicWidth: 80,
            //graphicHeight: 80,
            //externalGraphic: "images/camera.png",
            //graphicWidth: 16,
            //graphicHeight: 16,
            labelXOffset: 16,
            strokeWidth: 2,
            strokeOpacity: 0.8,
            label: "${label}",
            labelOutlineColor: "white",
            labelOutlineWidth: 3
        }, {
            context: {
                radius: function(feature) {
                    return Math.min(feature.attributes.count, 7) + 10;
                },
                label: function(feature) {
                	return feature.cluster.length;
                		1
                },
                thumbnail: function(feature) {
                	if (feature.cluster.length <= 1) {
                		return feature.cluster[0].attributes.img_url;
                	}
                	return "";
                }
            }
        });

		this.flickrCluster = new OpenLayers.Strategy.Cluster();
		this.photosLayer = new OpenLayers.Layer.Vector(LAYER_PHOTOS, {
            projection: "EPSG:900913",
            strategies: [
                this.flickrCluster
            ],
            styleMap: new OpenLayers.StyleMap({
                "default": style,
                "select": {
                    fillColor: "#8aeeef",
                    strokeColor: "#32a8a9"
                }
            })
        });

		this.addUserLayer(this.photosLayer);
		this.updateSelectControl();
		this.photosLayer.events.on({ "featureselected": _.bind(this.onPhotoFeatureSelected, this) });

		EventAggregator.on("flickrCacheReset", _.bind(this.onFlickrCacheReset, this));
		EventAggregator.on("flickrPageLoaded", _.bind(this.onFlickrPageLoaded, this));
	},
	onFlickrCacheReset: function() {
	    this.photosLayer.removeAllFeatures();
	},
	onFlickrPageLoaded: function(e) {
	    var cache = e.cache;
	    var data = cache.getCurrentPageData();
	    var features = [];

	    for (var i = 0; i < data.photo.length; i++) {
	        var photo = data.photo[i];
	        var geom = new OpenLayers.Geometry.Point(photo.longitude, photo.latitude);
	        geom.transform(PROJ_LL84, this.map.getProjectionObject());
	        features.push(
                new OpenLayers.Feature.Vector(
                    geom,
                    photo
                )
            );
	    }

	    this.photosLayer.addFeatures(features);

        //Force re-clustering
	    this.flickrCluster.clusters = null;
	    this.flickrCluster.cluster();
	},
	onShowPhotos: function (e) {
	    var getPhotoUrlFunc = function (photo) {
            //Where our requested "medium" sized photo doesn't exist, fallback to thumbnail
	        return photo.attributes.url_c || photo.attributes.url_s;
	    };
	    var getThumbnailFunc = function (photo) {
	        return photo.attributes.url_s;
	    };
	    this.showLightbox({
	        photos: e.photos,
	        getPhotoUrl: getPhotoUrlFunc,
	        getThumbnailUrl: getThumbnailFunc
	    });
	},
	showLightbox: function (args) {
	    if (this.activeModal) {
	        this.activeModal.remove();
	        //You'd think boostrap modal would've removed this for you?
	        $(".modal-backdrop").remove();
	    }
	    this.activeModal = $(this.lightboxTemplate(args));
	    $("body").append(this.activeModal);
	    this.activeModal.toggleClass('blueimp-gallery-controls', true);
	    var links = [];
	    for (var i = 0; i < args.photos.length; i++) {
	        links.push({
	            title: args.photos[i].attributes.title,
	            href: args.getPhotoUrl(args.photos[i]),
	            thumbnail: args.getThumbnailUrl(args.photos[i])
	        });
	    }
	    blueimp.Gallery(links, BLUEIMP_GALLERY_OPTIONS);
	},
	onPhotoFeatureSelected: function(event) {
	    this.selectControl.unselect(event.feature);
	    
        if (event.feature.cluster.length == 1) {
            this.onShowPhotos({ photos: event.feature.cluster });
        } else {
            if (this.map.getScale() < MAX_INTERACTION_SCALE) {
                this.onShowPhotos({ photos: event.feature.cluster });
            } else {
                if (event.feature.cluster.length > 1) {
                    var bounds = new OpenLayers.Bounds();
                    for (var i = 0; i < event.feature.cluster.length; i++) {
                        bounds.extend(event.feature.cluster[i].geometry.getBounds());
                    }
                    this.map.zoomToExtent(bounds);
                } else {
                    this.onShowPhotos({ photos: event.feature.cluster });
                }
            }
        }
    },
	onTideSelected: function (event) {
	    this.selectControl.unselect(event.feature);
	    var tideEvent = event.feature.attributes.event;
        this.showModal(this.tideModalTemplate({
            location: tideEvent.location,
            startDate: moment(tideEvent.eventStart).format("Do MMM H:mm A"),
            range: function () {
                var start = moment(tideEvent.eventStart);
                var end = moment(tideEvent.eventEnd);
                return start.format("Do MMM") + " to " + end.format("Do MMM");
            }
        }));
    }
});

var HomeSidebarView = Backbone.View.extend({
	template: null,
	el: $("#sidebar"),
    title: "Home",
    icon: "fa fa-home",
	initialize: function(options) {
	    this.template = _.template($("#homeSidebar").html());
	    this.updateLegendHandler = _.bind(this.onUpdateLegend, this);
	    EventAggregator.on("updateLegend", this.updateLegendHandler);
	},
	render: function() {
	    $(this.el).html(this.template({ title: this.title, icon: this.icon }));
	    EventAggregator.trigger("requestLegendUpdate");
	},
	onUpdateLegend: function(e) {
	    for (var i = 0; i < e.layers.length; i++) {
	        var layer = e.layers[i];
	        switch (layer.name) {
	            case LAYER_PHOTOS:
	                $("#layer-toggle-photos input[type='checkbox']").prop('checked', layer.getVisibility());
	                break;
	            case LAYER_TIDES:
	                $("#layer-toggle-tides input[type='checkbox']").prop('checked', layer.getVisibility());
	                break;
	            case LAYER_USER_POSITION:
	                $("#layer-toggle-gps input[type='checkbox']").prop('checked', layer.getVisibility());
	                break;
	        }
	    }
	},
	teardown: function() {
	    EventAggregator.off("updateLegend", this.updateLegendHandler);
	}
});

var PhotosView = Backbone.View.extend({
    template: null,
    pagerTemplate: null,
    el: $("#sidebar"),
    title: "Photos",
    icon: "fa fa-picture-o",
    initialize: function(options) {
        this.template = _.template($("#photosSidebar").html());
        this.pagerTemplate = _.template($("#albumPager").html());
    },
    render: function () {
        $(this.el).html(this.template({ title: this.title, icon: this.icon }));
        EventAggregator.on("flickrCacheReset", _.bind(this.onFlickrCacheReset, this));
        EventAggregator.on("flickrPageLoading", _.bind(this.onFlickrPageLoading, this));
        EventAggregator.on("flickrPageLoaded", _.bind(this.onFlickrPageLoaded, this));

        EventAggregator.trigger("loadCurrentFlickrPage");
    },
    teardown: function () {

    },
    onFlickrCacheReset: function () {
        $("div.album-pager").empty();
        $(".flickr-thumbnail-grid", this.el).empty();
    },
    onFlickrPageLoading: function () {
        $("div.album-pager").empty();
        $(".flickr-thumbnail-grid", this.el).html("<div class='well'><i class='fa fa-spinner fa-spin'></i>&nbsp;Loading Page</div>");
    },
    onFlickrPageLoaded: function (e) {
        $(".flickr-thumbnail-grid", this.el).empty();
        var cache = e.cache;
        var data = cache.getCurrentPageData();
        this.loadData(data, cache);
    },
    loadData: function (data, cache) {
        var pageNo = (cache.page + 1);
        var pages = cache.pages;
        var total = cache.total;
        var html = "";
        var escape = function (str) {
            return str.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
        };
        for (var i = 0; i < data.photo.length; i++) {
            var photo = data.photo[i];
            var escapedTitle = escape(photo.title);
            html += "<a href='javascript:void(0)' class='photo-link' data-photo-page-index='" + (pageNo - 1) + "' data-photo-id='" + photo.id + "'><img class='thumbnail flickr-thumbnail' title='" + escapedTitle + "' alt='" + escapedTitle + "' width='64' height='64' src='" + photo.url_s + "' /></a>";
        }
        $("div.album-pager").html(this.pagerTemplate({ pageNo: pageNo, pages: pages }));
        $("a.next-album-page").on("click", _.bind(this.onNextAlbumPage, this));
        $("a.prev-album-page").on("click", _.bind(this.onPrevAlbumPage, this));
        $("a.zoom-photo-page-bounds").on("click", _.bind(this.onZoomPhotoPageBounds, this));
        $("a.filter-photostream").on("click", _.bind(this.onFilterPhotoStream, this));
        $(".flickr-thumbnail-grid", this.el).append(html);
        $("a.photo-link").on("click", _.bind(function (e) {
            var lnk = $(e.delegateTarget);
            var pageIndex = lnk.attr("data-photo-page-index");
            var id = lnk.attr("data-photo-id");
            var data = cache.getPageData(pageIndex);
            for (var j = 0; j < data.photo.length; j++) {
                if (data.photo[j].id == id) {
                    EventAggregator.trigger("showPhotos", {
                        photos: [
                            { attributes: data.photo[j] }
                        ]
                    })
                    break;
                }
            }
        }, this));
        $("#photoStreamInfo").html("(" + total + " photos)");
    },
    onNextAlbumPage: function (e) {
        EventAggregator.trigger("loadNextFlickrPage");
    },
    onPrevAlbumPage: function (e) {
        EventAggregator.trigger("loadPrevFlickrPage");
    },
    onZoomPhotoPageBounds: function (e) {
        EventAggregator.trigger("getPhotoPageBounds", {
            callback: function (bounds) {
                //Map is in web mercator so our ll bounds must be transformed to it
                if (bounds != null)
                    bounds.transform(PROJ_LL84, PROJ_WEBMERCATOR);
                EventAggregator.trigger("mapZoomToBounds", bounds);
            }
        });
    },
    onFilterPhotoStream: function (e) {
        var templ = _.template($("#filterDialog").html());
        //You'd think boostrap modal would've removed this for you?
        $(".modal-backdrop").remove();
        var dt = new Date();
        var filterModal = $(templ({ year: this.filterYear || dt.getFullYear(), fromYear: 2011, toYear: dt.getFullYear() }));
        $("body").append(filterModal);
        filterModal.modal('show').on("hidden.bs.modal", function (e) {
            filterModal.remove();
            //You'd think boostrap modal would've removed this for you?
            $(".modal-backdrop").remove();
        });
        filterModal.find("a.apply-filter").on("click", _.bind(function (e) {
            EventAggregator.trigger("applyPhotoFilter", { year: $("#filterYear").val() });
            filterModal.modal("hide");
        }, this));
        filterModal.find("a.reset-filter").on("click", _.bind(function (e) {
            EventAggregator.trigger("resetPhotoFilter");
            filterModal.modal("hide");
        }, this));
        filterModal.find("a.cancel-btn").on("click", _.bind(function (e) {
            filterModal.modal("hide");
        }, this));
    }
});

var UploadPhotoView = Backbone.View.extend({
	template: null,
	el: $("#sidebar"),
    title: "Upload Photo",
    icon: "fa fa-camera",
	initialize: function(options) {
		this.template = _.template($("#uploadSidebar").html());
	},
	render: function() {
		$(this.el).html(this.template({ title: this.title, icon: this.icon }));
        $("#dtDate").val(moment().format("YYYY-MM-DD hh:mm"))
                    .datetimepicker();
        $("#photoLocationButton").click(_.bind(this.onPhotoLocationClick, this));
        $("#photoFile").change(_.bind(this.onPhotoFileChanged, this));
        $("#manualLocationToggle").click(_.bind(this.onManualRecordToggle, this));
        if (typeof(navigator.geolocation) != 'undefined') {
            navigator.geolocation.getCurrentPosition(_.bind(function(pos) { //Success
                $("#photoLocation").val(pos.coords.longitude + " " + pos.coords.latitude);
            }, this), _.bind(function(pos) { //Failure
                $("#photoLocation")
                    .val("")
                    .attr("placeholder", "Could not get your location");
            }, this), { //Options
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 7000
            });
        }
        $("#uploadTarget").on("load", _.bind(this.onUploadCompleted, this));
        $("#errorSummary").hide();
        $("#formStatus").html("");
        $("#btnSubmitUpload").on("click", _.bind(this.onFormSubmit, this));
        $("#chkAcceptTerms").change(_.bind(this.onAgreementChanged, this));
        $("#chkAcceptCC").change(_.bind(this.onAgreementChanged, this));
        $("a[data-wkt-role='terms']").on("click", _.bind(this.onShowTerms, this));

        $("#uploadForm").validate({
            rules: {
                "Email": {
                    required: true,
                    email: true
                },
                "FirstName": {
                    required: true
                },
                "PhotoFile": {
                    required: true
                }
            },
            messages: {
                "Email": {
                    required: "Email is required",
                    email: "Email is an invalid email address"
                },
                "FirstName": {
                    required: "First Name is required"
                },
                "PhotoFile": {
                    required: "Please attach a photo"
                }
            },
            focusInvalid: true,
            showErrors: function (errorMap, errorList) {
                $("div.control-group").removeClass("has-error")
                                      .removeClass("has-warning");
                var errors = errorList;
                if (errorList.length > 0) {
                    var errorString = '<strong><i class="fa fa-exclamation-triangle"></i>The following validation errors were found</strong><br/><ul>';
                    for (var i = 0, errorLength = errors.length; i < errorLength; i++) {
                        var el = $(errors[i].element);
                        if (el.hasClass("fileButton"))
                            el.parent().addClass("btn-danger");
                        else
                            el.parent().addClass("has-error");

                        errorString += "<li>" + errors[i].message + '</li>';
                    }
                    errorString += "</ul>";
                    $("#errorSummary").html(errorString).show();
                } else {
                    $("#errorSummary").hide();
                }
            }
        });
        EventAggregator.on("updatePhotoLocationField", _.bind(this.onUpdatePhotoLocationField, this));
	},
	showLightbox: function(args) {
	    if (this.activeModal) {
	        this.activeModal.remove();
	        //You'd think boostrap modal would've removed this for you?
	        $(".modal-backdrop").remove();
	    }
	    this.activeModal = $(this.lightboxTemplate(args));
	    $("body").append(this.activeModal);
	    this.activeModal.toggleClass('blueimp-gallery-controls', true);
	    var links = [];
	    for (var i = 0; i < args.photos.length; i++) {
	        links.push({
	            title: args.photos[i].attributes.title,
	            href: args.getPhotoUrl(args.photos[i]),
	            thumbnail: args.getPhotoUrl(args.photos[i])
	        });
	    }
	    blueimp.Gallery(links, BLUEIMP_GALLERY_OPTIONS);
	},
	showModal: function (html) {
	    if (this.activeModal) {
	        this.activeModal.remove();
	        //You'd think boostrap modal would've removed this for you?
	        $(".modal-backdrop").remove();
	    }
	    this.activeModal = $(html);
	    $("body").append(this.activeModal);
	    this.activeModal.modal('show').on("hidden.bs.modal", function (e) {
	        //You'd think boostrap modal would've removed this for you?
	        $(".modal-backdrop").remove();
	    });
	},
	onShowTerms: function(e) {
	    var tpl = _.template($("#termsModal").html());
	    EventAggregator.trigger("showModal", { template: tpl() });
	},
	onAgreementChanged: function(e) {
	    if ($("#chkAcceptTerms").is(":checked") && $("#chkAcceptCC").is(":checked"))
	        $("#btnSubmitUpload").removeClass("disabled");
	    else
	        $("#btnSubmitUpload").addClass("disabled");
	},
    onUploadCompleted: function(e) {
        alert("Upload complete");
    },
    insertPhotoMarker: function(lon, lat, flickrId) {
        EventAggregator.trigger("addNewPhotoMarker", { lon: lon, lat: lat, flickrId: flickrId });
    },
    validateForm: function(callback) {
        callback($("#uploadForm").valid());
    },
    xhr2upload: function (url, formData, fnProgress) {
        return $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            xhr: function () {
                myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload && fnProgress) {
                    myXhr.upload.addEventListener('progress', function (prog) {
                        var value = ~~((prog.loaded / prog.total) * 100);

                        // if we passed a progress function
                        if (fnProgress && typeof fnProgress == "function") {
                            fnProgress(prog, value);

                            // if we passed a progress element
                        } else if (fnProgress) {
                            $(fnProgress).val(value);
                        }
                    }, false);
                }
                return myXhr;
            },
            cache: false,
            contentType: false,
            processData: false
        });
    },
    onFormSubmit: function (e) {

        var btnUp = $("#btnSubmitUpload");
        var btnCancel = $("#btnCancelUpload");

        btnUp.addClass("disabled");
        btnCancel.addClass("disabled");

        this.validateForm(_.bind(function (bResult) {
            if (bResult) {
                var formData = new FormData();
                formData.append("Email", $("#txtEmail").val());
                formData.append("FirstName", $("#txtFirstName").val());
                formData.append("LastName", $("#txtSurname").val());
                formData.append("PhotoLocation", $("#photoLocation").val());
                formData.append("CreationDate", $("#dtDate").val());
                formData.append("Photofile", $("#photoFile")[0].files[0]);
                formData.append("Description", $("#txtDescription").val());
                e.preventDefault();

                var promise = null;
                var progressModal = _.template($("#progressModal").html());
                this.showModal(progressModal({}));
                if (Modernizr.xhr2) {
                    promise = this.xhr2upload(SERVICE_URL + "/upload", formData, function (prog, value) {
                        //console.log("Progress: " + prog + ", Value: " + value);
                        $("#progress").val(value);
                        if (value == 100) {
                            $("#progressMessage").text("Awaiting server response");
                            //debugger;
                        }
                    });
                } else {
                    promise = $.ajax({
                        url: SERVICE_URL + "/upload",
                        type: 'POST',
                        data: formData,
                        cache: false,
                        contentType: false,
                        processData: false
                    });
                }

                promise.success(_.bind(function (data) {
                    alert("Photo has been uploaded");
                    if (this.activeModal) {
                        this.activeModal.remove();
                        //You'd think boostrap modal would've removed this for you?
                        $(".modal-backdrop").remove();
                        EventAggregator.trigger("resetPhotoFilter");
                    }
                    this.insertPhotoMarker(data.Longitude, data.Latitude, data.FlickrId);
                    //Go home on completion
                    window.location.hash = "#home";
                }, this)).fail(_.bind(function (jqXHR, textStatus, errorThrown) {
                    alert("Failed to upload photo. Error: " + (errorThrown || "unknown") + ", status: " + textStatus);
                    if (this.activeModal) {
                        this.activeModal.remove();
                        //You'd think boostrap modal would've removed this for you?
                        $(".modal-backdrop").remove();
                    }
                    //console.error("Ajax failed");
                    btnUp.removeClass("disabled");
                    btnCancel.removeClass("disabled");
                }, this));
            } else {
                btnUp.removeClass("disabled");
                btnCancel.removeClass("disabled");
            }
        }, this));
    },
    onUpdatePhotoLocationField: function(e) {
        $("#photoLocation").val(e.lon + " " + e.lat);
    },
    onManualRecordToggle: function(e) {
        EventAggregator.trigger("toggleManualLocationRecording");
        var el = $("#manualLocationToggle");
        var text = el.html();
        if (text == "(Manually change)") {
            el.html("(Update field)");
        } else {
            el.html("(Manually change)");
        }
    },
    onPhotoFileChanged: function(e) {
        $("#photoFileButton").removeClass("btn-danger").addClass("btn-success");
        $("#photoFileButtonText").html("Photo Selected");
    },
    onPhotoLocationClick: function(e) {
        var value = $("#photoLocation").val();
        if (value != "") {
            var coords = value.split(" ");
            EventAggregator.trigger("showPositionOnMap", { lon: parseFloat(coords[0]), lat: parseFloat(coords[1]) });
        }
    },
	teardown: function() {

	}
});

var logger = {
	logi: function(msg) {
		if (typeof(console) != 'undefined')
			console.log(msg);
	},
	logw: function(msg) {
		if (typeof(console) != 'undefined')
			console.warn(msg);
	},
	loge: function(msg) {
		if (typeof(console) != 'undefined')
			console.error(msg);
	}
}

var AppRouter = Backbone.Router.extend({
	mapView: null,
	sidebarView: null,
	routes: {
		"home": "home",
		"upload": "upload",
        "photos": "photos",
		"*path": "defaultRoute"
	},
	setMapView: function() {
		if (this.mapView == null) {
			this.mapView = new MapView();
			this.mapView.render();
		}
	},
	setSidebar: function(view) {
		if (this.sidebarView != null)
			this.sidebarView.teardown();
		this.sidebarView = view;
		this.sidebarView.render();
		$("#sidebarTogglerButton").html("<i class='" + view.icon + "'></i>&nbsp;" + view.title + "&nbsp;<i class='fa fa-angle-double-right'></i>");

	    //If we can see our responsive marker it means we're in phone view,
	    //so we should default the view to the sidebar
		if (IsPhoneDisplay())
		    $('.row-offcanvas').addClass('offcanvas-shift');

	    //Be sure to toggle the map view.
		$('[data-toggle=offcanvas]').off("click");
		$('[data-toggle=offcanvas]').on("click", function () {
		    $('.row-offcanvas').toggleClass('offcanvas-shift');
		});
	},
	home: function() {
		logger.logi("route: home");
        $("li.navbar-link").removeClass("active");
        $("li.home-link").addClass("active");
        $("li.photos-link").removeClass("active");
		this.setMapView();
		this.setSidebar(new HomeSidebarView());
	},
	upload: function() {
		logger.logi("route: upload");
        $("li.navbar-link").removeClass("active");
        $("li.upload-link").addClass("active");
        $("li.photos-link").removeClass("active");
		this.setMapView();
		this.setSidebar(new UploadPhotoView());
	},
	photos: function() {
	    logger.logi("route: photos");
	    $("li.navbar-link").removeClass("active");
	    $("li.upload-link").removeClass("active");
	    $("li.photos-link").addClass("active");
	    this.setMapView();
	    this.setSidebar(new PhotosView());
	},
	defaultRoute: function() {
		logger.logi("unknown route. Going home");
		this.home();
	}
});

var app = {
    initialize: function () {
		$('[data-toggle=offcanvas]').click(function() {
		    $('.row-offcanvas').toggleClass('active');
		});
		this.router = new AppRouter();
        $("a.base-layer-item").click(_.bind(function(e) {
            this.router.setMapView();
            this.router.mapView.setActiveBaseLayer($(e.target));
        }, this));
        $(document).on("click", "ul.navbar-nav a", function (e) {
            var el = $(e.target);
            if (el.closest("li.active").length == 1 && !el.hasClass("base-layer-item") && IsPhoneDisplay() && !IsMapOffCanvas()) {
                InvokeSidebarToggler();
                RollupNavbar();
            } else if (el.hasClass("base-layer-item") && IsMapOffCanvas()) {
                InvokeSidebarToggler();
                RollupNavbar();
            } else if (!el.hasClass("dropdown-toggle")) {
                RollupNavbar();
            }
        });
        $(document).on("click", "a.refresh-album", function (e) {
            EventAggregator.trigger("resetPhotoFilter");
        });
		Backbone.history.start();
	}
};

$(document).ready(function() {
	app.initialize();
});