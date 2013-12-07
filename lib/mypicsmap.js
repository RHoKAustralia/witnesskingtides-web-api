/*
    copyright (c) 2008 MyPicsMap Team - All rights reserved
*/

//------------------------------------------------------------//
//             Photos processor for username mode             //
//------------------------------------------------------------//
function PhotoLayerCallback(json, photoLayer) {
	// Hide loading
	hide_loading();

	this.photoLayer = photoLayer;

	// If loadMore has been clicked or in explore mod load the corresponding loader function
	if(photoLayer.enabled || photoLayer.clickMorePhotos)
	{
		this.morePhotos(json, photoLayer);
		photoLayer.clickMorePhotos = false;
		return;
	}

	// Get photos
	var photos = getPhotos(json);
	if (!photos) return;

	// Hold the photos according to each zoom level
	var batch = [];

	// Intialize batch for all supported zooms
	for (var zoom = 3; zoom <= 19; zoom++)
	{
		batch[zoom]=[];
		photoLayer.ids[zoom] = [];
	}

	var displayed = 0;

	// Iterate through photos
	// AS we iterate only once on all photos, we can't process twice the same that's why don't test for this usecase
	// Max photos for IE = 1000

	var max = photos.length;
	if (photoLayer.is_ie && max > 1000) max = 1000;

	for (var i = 0; i < max; i++)
	{
		var photo = photos[i];

		// Defaults
		var size = 40;
		var fixedAmount = -1;

		for (var zoom = 3; zoom <= 19; zoom++)
		{
			// Ok this photo id has been processed at this zoom level
			// Useful to not load this suer photos when clicking more photos
			photoLayer.ids[zoom][photo.id] = 'exists';

			// Compute precision and size according to the zoom level
			var precision = calc_precision(zoom);
			var fixedAmount = precision[0];
			var size = precision[1];

			var max_photos_zoom = zoom >= 11 ? 100 : 30;

			// Create the marker
			var marker = this.createMarker(photo, photoLayer.markerIcon, size);

			// Store a unique key representing the lat/long of the photo and an accuracy according to the zoom level
			// catch because IE dislike fixedAmout = -1
			if ( typeof toFixed == 'function' )
			{
				var latlngHash = (marker.latlng.lat().toFixed(fixedAmount) + "" + marker.latlng.lng().toFixed(fixedAmount));
			}
			else
			{
				var latlngHash = (toFixedIe(marker.latlng.lat(),fixedAmount) + "" + toFixedIe(marker.latlng.lng(),fixedAmount));
			}

			latlngHash = latlngHash.replace(".","").replace(".", "").replace("-","");

			// Initialize if this is the first time for this latlng
			if ( ! photoLayer.seenLatLngs[latlngHash])
				photoLayer.seenLatLngs[latlngHash] = [];

			// Have we already seen this latlng in this zoom? If the marker is not displayed, jsut added to the array of the photos of the same latlng
			// If not, the marker is displayed on the map
			if (!photoLayer.seenLatLngs[latlngHash][zoom])
			{
				displayed++;
				photoLayer.seenLatLngs[latlngHash][zoom] = [];
				photoLayer.seenLatLngs[latlngHash][zoom].push(photo);
				batch[zoom].push(marker);
			}
			else {
				// 30 max photos on the same latlng of the zoom
			    if (photoLayer.seenLatLngs[latlngHash][zoom].length < max_photos_zoom) photoLayer.seenLatLngs[latlngHash][zoom].push(photo);
			}
		}
	}

	// Now add the markers to the map. each marker is vivible only at one level
	for (var zoom = 3; zoom <= 19; zoom++)
	{
		photoLayer.mgr.addMarkers(batch[zoom], zoom, zoom);
	}

	// Refresh to mirror the changes
	photoLayer.mgr.refresh();
}

//------------------------------------------------------------//
//  Photos processor for explore mode and morephotos toolbar  //
//------------------------------------------------------------//
PhotoLayerCallback.prototype.morePhotos = function(json, photoLayer) {
	// Hide loading
	hide_loading();

	this.photoLayer = photoLayer;

	var zoom = photoLayer.map.getZoom();
	// max photos displayed at this zoom level
	var max =  zoom >= 12 ? 25 : 15;
	var i = displayed = 0;

	var photos = getPhotos(json);
	if (!photos) return;

	// Hold the photos according to each zoom level
	var batch = [];

	// We display 10 photos at each zoom
	var displayedz = [];

	// Intialize
	for (var zoom_ = zoom; zoom_ <= 19; zoom_++)
	{
		batch[zoom_]=[];
		displayedz[zoom_]= 0;
	}

	//while(displayed < max && photos[i])
	// Once there are max displayed photos at this level or when photos array is over we stop
	// We also load the photos at all deeper zoom levels
	while(displayedz[zoom] < max && photos[i])
	{
		var photo = photos[i];

		// Did we already seen this photo at this zoom? If so this means that the photo is also deeper
		if (photoLayer.ids[zoom] && photoLayer.ids[zoom][photo.id])
		{
			i++;
			continue;
		}

		// iterate from this zoom level to deeper
		for (var zoom_ = zoom; zoom_ <= 19; zoom_++)
		{
			// If we already displayed max photos at this zoom, then pass to the next zoom;
    		if(displayedz[zoom_] >= max) continue;

			// Hold the ids of the photo already processed at this zoom level
			// Initialize ids array
    		if ( ! photoLayer.ids[zoom_])
    			photoLayer.ids[zoom_] = [];

    		// Okay, if we are here, we set that this photo has been processed so that it's not processed again
            photoLayer.ids[zoom_][photo.id] = 'exists';

            // COmpute precision  and size for this zoom
    		var precision = calc_precision(zoom_);
    		var fixedAmount = precision[0];

    		// In explore mode, we displayed 40x40 photos, others are displayed 20x20
    		var size = photoLayer.enabled ? 40 : 20;

    		// Create the marker
    		var marker = this.createMarker(photo, photoLayer.markerIcon, size);

    		// Store a unique key representing the lat/long of the photo and an accuracy according to the zoom level
    		if ( typeof toFixed == 'function')
    		{
    			var latlngHash = (marker.latlng.lat().toFixed(fixedAmount) + "" + marker.latlng.lng().toFixed(fixedAmount));
    		}
    		else
    		{
    			var latlngHash = (toFixedIe(marker.latlng.lat(),fixedAmount) + "" + toFixedIe(marker.latlng.lng(),fixedAmount));
            }

            latlngHash = latlngHash.replace(".","").replace(".", "").replace("-","");

            // Initialize if this is first time for this latlng
            if ( ! photoLayer.seenLatLngs[latlngHash])
            	photoLayer.seenLatLngs[latlngHash] = [];

			// Have we already seen this latlng in this zoom? If the marker is not displayed, jsut added to the array of the photos of the same latlng
			// If not, the marker is displayed on the map
            if (!photoLayer.seenLatLngs[latlngHash][zoom_])
            {
            	photoLayer.seenLatLngs[latlngHash][zoom_] = [];
            	photoLayer.seenLatLngs[latlngHash][zoom_].push(photo);
            	// We directly add it to the map because with addMarkers method there is a kind of 'lagging'
            	photoLayer.mgr.addMarker(marker, zoom_, zoom_);
            	// Ok one more photo displayed for this zoom
            	displayedz[zoom_]++;

            	//batch[zoom_].push(marker);
            	//if(zoom_ == zoom) displayed++;
            }
            else {
            	// 30 max photos on the same latlng of the zoom
                if (photoLayer.seenLatLngs[latlngHash][zoom_].length < 30) photoLayer.seenLatLngs[latlngHash][zoom_].push(photo);
            }
        }

        i++;
	}

	// Intialize
	// for (var zoom_ = zoom; zoom_ <= 19; zoom_++)
	// {
	// 	photoLayer.mgr.addMarkers(batch[zoom_], zoom_, zoom_);
	// }
	//photoLayer.mgr.refresh();
}

//------------------------------------------------------------//
//                        Useful methodes                     //
//------------------------------------------------------------//

function show_loading()
{
	//document.getElementById('black_overlay').style.display = 'block';
	document.getElementById('mainloading').style.display = 'block';
}

function hide_loading()
{
	//document.getElementById('black_overlay').style.display = 'none';
	document.getElementById('mainloading').style.display = 'none';
}

// FIX for IE when precision is negative
function toFixedIe (nbr, precision)
{
    var power = Math.pow(10, precision || 0);
    return String(Math.round(nbr * power)/power);
}

function getPhotos (json) {
	return (json.photos && json.photos.photo) || json;
}

function getLink (photo) {
	return ("http://www.flickr.com/photos/" + photo.owner + "/" + photo.id);
}

// handy functions to build the url of an image according to its size
function getImageUrl (photo, format) {
	return "http://farm" + photo.farm + ".static.flickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + format + ".jpg";
}

// handy function to retrieve the original photo if available
function getOriginalImageUrl (photo) {
	return "http://farm" + photo.farm + ".static.flickr.com/" + photo.server + "/" + photo.id + "_" + photo.originalsecret + "_" + "o."+photo.originalformat;
}

// get the image url according to its best size
// If one of the side is greater than 1280 then a large (_b) version is created
function getBestImageUrl(photo) {
    if(photo.o_width)
    {
        if (photo.o_width > 1280 || photo.o_height > 1280)
        	return getImageUrl(photo, '_b');
        return getOriginalImageUrl(photo);
    }
    return getImageUrl(photo, '');
}

// Compute precision and size according to the zoom level
function calc_precision (zoom) {
	var fixedAmount = -1;
	var size = 40;

	if (zoom > 4)
		fixedAmount = 0;

	if (zoom >= 8) {
		fixedAmount = 1;
	}

	if (zoom >= 10) {
		fixedAmount = 2;
	}

	if (zoom >= 11) {
		fixedAmount = 8;
	}

	return [fixedAmount, size];
}


PhotoLayerCallback.prototype.getLatLng = function(photo) {
	var lat = parseFloat(photo.latitude);
	var lng = parseFloat(photo.longitude);
	return new GLatLng(lat, lng);
}

//------------------------------------------------------------//
//                     Marker creation                        //
//------------------------------------------------------------//
// Create the marker with the good size
// Implement the logic behind the click on a marker
// Implement the tooltip
PhotoLayerCallback.prototype.createMarker = function(photo, baseIcon, size) {
	var me = this;

	// This is related to the marker (photo) clicked
	var title = photo.title;
	var author = photo.author;
	var link = getLink(photo);
	var thumbnailUrl = getImageUrl(photo,'_s');
	var ownername = photo.ownername;
	var bestImageUrl = getBestImageUrl(photo);
	var imageUrl = getImageUrl(photo,'');
	var ownername = photo.ownername;
	var owner = photo.ownername;

	// Create the Markerlight
	var markerIcon = new GIcon(baseIcon);
	markerIcon.image = thumbnailUrl;
	var marker = new MarkerLight(this.getLatLng(photo),
		{image: thumbnailUrl,
			title: title,
			width: size,
			height: size
		});

	//marker.photo = photo;

	// if (title > 33) {
	// 	title = title.substring(0, 33) + "&#8230;";
	// }

	// Take care of the mouseover to display tooltip.
	// We only create the tooltip overlay once, because FF freezed when they were created all at initialization
	GEvent.addListener(marker,'mouseover', function() {
		if( ! marker.tooltip) {
			marker.tooltip = new Tooltip(marker,"<img border='0' src='" + thumbnailUrl + "' height='75'/>",4);
			map.addOverlay(marker.tooltip);
		}
		marker.tooltip.show();
	});

	// Take care of the mouseout to hide the tooltip.
	GEvent.addListener(marker,'mouseout', function() {
		marker.tooltip.hide();
	});

	// take care of a click on a marker
	GEvent.addListener(marker, "click", function() {
	    // Highlight border logic
		if (me.photoLayer.lastMarker) {
			me.photoLayer.lastMarker.resetBorder();
	    }
	    marker.highlightBorder();
	    me.photoLayer.lastMarker = marker;

	    // Hide tooltip when clicked of course
	    marker.tooltip.hide();

	    var zoom = me.photoLayer.map.getZoom();

	    // Hold the HTML code that will be inserted on a hidden div to be parsed by clearbox
	    var photos = '';

	    // precision
		var precision = calc_precision(zoom);
		var fixedAmount = precision[0];

		// Mandatory to do so because if you click a marker CB_Gallery array will be created according to the resolution
		// If you click it again, clearbox will detect that this same array is already created so it won't refresh it
		// This will result in: photo url passed != first photo url
		// That's why we force it to null to regenerate it
		CB_Gallery = null;

		// DAmned IE
		if (typeof toFixed == 'function')
		{
			var latlngHash = (marker.latlng.lat().toFixed(fixedAmount) + "" + marker.latlng.lng().toFixed(fixedAmount));
		}
		else
		{
			var latlngHash = (toFixedIe(marker.latlng.lat(),fixedAmount) + "" + toFixedIe(marker.latlng.lng(),fixedAmount));
		}
	    latlngHash = latlngHash.replace(".","").replace(".", "").replace("-","");

	    // OK, do we have an array for this latlng. Not sure this test is useful
	    //if(me.photoLayer.seenLatLngs[latlngHash][zoom])
	    //{

	    	// What is the current resolution wanted
	    	// Better to do this here instead of in the loop ;)
			//var hd = document.getElementById('hd').checked;
			var hd = true;

			// If we have only one photo build the correct clearbox
	    	if(me.photoLayer.seenLatLngs[latlngHash][zoom].length == 1)
	    	{
	        	var photo = me.photoLayer.seenLatLngs[latlngHash][zoom][0];
	        	// Generate the correct URL according to the resolutuion
	        	var imageurl_ =  hd ? getBestImageUrl(photo) : getImageUrl(photo,'');
	        	// add the author oof the photo only if it's not mine
	        	var title_ = nsid == photo.owner ? photo.title : photo.title+" (by "+photo.ownername+")";
	            photos += "<a rel='clearbox' href='"+imageurl_+"' title='"+title_+"'>" +
	             "<img border='0' src='" + getImageUrl(photo,'_s') + "'/><\/a>";

	            // add the HTML code in a hidden div
	            document.getElementById('hidden').innerHTML = photos;

	            // Trigger clearbox.
	            // It needs that the url passed exists in the HTML generated above.
	            var imageurl_ = hd ? bestImageUrl : imageUrl;
	            var title_ = nsid == owner ? title : title+" (by "+ownername+")";
	            //CB_ClickIMG('clearbox+\\+'+imageurl_+'+\\+'+title_);
	            CB_Open('gallery=clearbox,,href='+imageurl_+',,title='+title_+',,dlhrf='+getLink(photo));
	    	}
	    	else
	    	{
	    		// Several photos at this exact latlng, iterate through
		        for (var i = 0; i < me.photoLayer.seenLatLngs[latlngHash][zoom].length; i++)
		        {
		        	var photo = me.photoLayer.seenLatLngs[latlngHash][zoom][i];
		        	var imageurl_ = hd ? getBestImageUrl(photo) : getImageUrl(photo,'');
		        	var title_ = nsid == photo.owner ? photo.title : photo.title+" (by "+photo.ownername+")";
		            //photos += "<a rel='clearbox[gallery=_"+latlngHash+"_]' href='"+imageurl_+"' title='"+title_+"'>" +
		            photos += '<a rel="clearbox[gallery=Album '+latlngHash+',,dlhrf='+getLink(photo)+']" href="'+imageurl_+'" title="'+title_+'">"' +  '<img border="0" src="' + getImageUrl(photo,'_s') + '"/><\/a>';
		        }

		        // add the HTML code in a hidden div
				document.getElementById('hidden').innerHTML = photos;

				var imageurl_ = hd ? bestImageUrl : imageUrl;
				var title_ = nsid == owner ? title : title+" (by "+ownername+")";
				//CB_ClickIMG('_'+latlngHash+'_+\\+'+imageurl_+'+\\+'+title_);
				CB_Open('gallery=Album '+latlngHash+',,href='+imageurl_);
		    }
	    //}
	});

	return marker;
}

//------------------------------------------------------------//
//                            The class                       //
//------------------------------------------------------------//
// PhotoLayer class
function PhotoLayer(map, opt_opts) {

	// Defaults to HD!
	//document.getElementById('hd').checked = true;
	var me = this;
	var opts = opt_opts || {};
	me.map = map;
	me.ids = {}; // ids to not process twice a same photo
	me.seenLatLngs = {}; // hold the latlng of the photos according to the zoom (precision)
	me.oldCenter = map.getBounds().toSpan(); // To check if we drag more that X%
	me.oldZoom = map.getZoom(); // To bypass the check if we drag more that X %
	me.mgr = new MarkerManager(map, {maxZoom: 19}); // The magic MarkerManager
	me.clickMorePhotos = false; // This way the good callback will be called

	if(!+"\v1") me.is_ie = true
	else me.is_ie = false;


	// Default icon
	var icon = new GIcon();
	//icon.image = "";
	icon.infoWindowAnchor = new GPoint(9, 0);
	me.markerIcon = icon;

	// toggle the explore mode (load photos when drag, zoom)
	me.enabled = false;

	// if in explore mode, asks for photos
	GEvent.addListener(map, "moveend", function() {
		me.maybeLoadPhotos();
		//me.mgr.refresh();
	});

	// if in explore mode, asks for photos
	GEvent.addListener(map, "zoomend", function() {
		me.maybeLoadPhotos();
		//me.mgr.refresh();
	});

}

PhotoLayer.prototype.enable = function() {
	this.enabled = true;
	this.maybeLoadPhotos(true);
}

// Used in 'username' mode
PhotoLayer.prototype.bootstrap = function() {
	var me = this;
	me.load(me);
}

// Embed mode
PhotoLayer.prototype.embed = function() {
	var me = this;
	me.load_embed(me);
}

// Photoset mode
PhotoLayer.prototype.photoset = function() {
	var me = this;
	me.load_photoset(me);
}

PhotoLayer.prototype.disable = function() {
	this.enabled = false;
	this.mgr.clearMarkers();
	this.ids = {};
	this.seenLatLngs = {};
}

PhotoLayer.prototype.getEnabled = function() {
	return this.enabled;
}

//------------------------------------------------------------//
//          Loding function in 'username' mode                //
//------------------------------------------------------------//

// This will load the photos of a custom user
// It calls the server an the result is cached one day
PhotoLayer.prototype.load = function(photoLayer) {
	// Display loading
	show_loading();

	// build URL
	var url = baseurl + "geo_photos/"+nsid;
	var callbackName = "geo_photos_callback";
	eval(callbackName + " = function(json) { var pa = new PhotoLayerCallback(json, photoLayer);}");

	// Add the script (dynamic script loading technic)
	var script = document.createElement('script');
	script.setAttribute('src', url);
	script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(script);
}

//------------------------------------------------------------//
//          Loding function in photoset mode                //
//------------------------------------------------------------//

// This will load the photos of a custom user
// It calls the server an the result is cached one day
PhotoLayer.prototype.load_photoset = function(photoLayer) {
	// Display loading
	show_loading();

	// build URL
	var url = baseurl + "geo_photoset/"+photosetid;

	var callbackName = "geo_photoset_callback";
	eval(callbackName + " = function(json) { var pa = new PhotoLayerCallback(json, photoLayer);}");

	// Add the script (dynamic script loading technic)
	var script = document.createElement('script');
	script.setAttribute('src', url);
	script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(script);

}

//------------------------------------------------------------//
//          Loding function in 'embed' mode                //
//------------------------------------------------------------//

// This will load the photos of a custom user
// It calls the server an the result is cached one day
PhotoLayer.prototype.load_embed = function(photoLayer) {
	// Display loading
	show_loading();

	// build URL
	var url = baseurl + 'geo_photos_bbox/'+nsid+'/'+northeastlat+'/'+southwestlat+'/'+northeastlng+'/'+southwestlng;
	var callbackName = 'geo_photos_bbox_callback';
	eval(callbackName + ' = function(json) { var pa = new PhotoLayerCallback(json, photoLayer);}');

	// Add the script (dynamic script loading technic)
	var script = document.createElement('script');
	script.setAttribute('src', url);
	script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(script);

}

//------------------------------------------------------------//
//           Loding function in 'explore' mode                //
//------------------------------------------------------------//

// If explore mode enabled and last drag was at least 30% on a same zoom level then ask for photos
PhotoLayer.prototype.maybeLoadPhotos = function(force) {

	var me = this;
	if (me.enabled) {
		var center = me.map.getCenter();
		var bounds = me.map.getBounds();
		var southWest = bounds.getSouthWest();
		var northEast = bounds.getNorthEast();
		var span = bounds.toSpan();
		var zoom = me.map.getZoom();
		var spanDiff = center.distanceFrom(me.oldCenter);
		var mapSpan = (northEast.distanceFrom(southWest))
		var percent = (spanDiff/mapSpan)*100;
		if (percent > 30 || (zoom != me.oldZoom) || force) {
			me.loadMorePhotos(me, {west: southWest.lng(), south: southWest.lat(), east: northEast.lng(), north: northEast.lat()});
			me.oldCenter = center;
			me.oldZoom = zoom;
		}
	}
}

// This will load the photos of the corresponding bounding box (the map displayed)
// Photos are loaded from Flickr interestigness ones
// No caching because bbox is random (float)
// Accuracy = 1 otherweise Flickr miss lots of photos (why?)
PhotoLayer.prototype.loadMorePhotos = function(photoLayer, options) {
	var photolayer = this;

	// Display loading
	show_loading();

	var uniqueID = "";

	for (optionName in options) {
		if (options.hasOwnProperty(optionName)) {
		  var optionVal = "" + options[optionName] + "";
		  url += optionName + "=" + optionVal + "&";
		  uniqueID += optionVal.replace(/[^\w]+/g,"");
		}
	}

    if(options.west > options.east) { if(Math.abs(options.west) > Math.abs(options.east)) options.west = -180; else options.east = 180; }
    if(options.south > options.north) { if(Math.abs(options.south) > Math.abs(options.north)) options.south = -90; else options.north = 90; }
	//if a tag is precised, load it.
	var tag = photoLayer.clickMorePhotos ? document.getElementById("tag").value : '';

	if(tag != '') var url = baseurl + 'load_more/'+ options.west + '/' + options.south + '/' + options.east + '/' + options.north + '/' + uniqueID + '/' + escape(tag);
	else var url = baseurl + 'load_more/'+ options.west + '/' + options.south + '/' + options.east + '/' + options.north + '/' + uniqueID;
	// a unique
	var callbackName = "PhotoLayerCallback.loader" + uniqueID;
	eval(callbackName + " = function(json) { var pa = new PhotoLayerCallback(json, photoLayer);}");

	// Add the script (dynamic script loading technic)
	var script = document.createElement('script');
	script.setAttribute('src', url);
	script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(script);
}

//------------------------------------------------------------//
//            Custom controls: morephotos toolbar             //
//------------------------------------------------------------//

// We define the function first
function MorePhotos(photoLayer) {
	var me = this;
	me.photoLayer = photoLayer;
}

// To "subclass" the GControl, we set the prototype object to
// an instance of the GControl object
MorePhotos.prototype = new GControl();

// Creates a one DIV for each of the buttons and places them in a container
// DIV which is returned as our control element. We add the control to
// to the map container and return the element for the map class to
// position properly.
MorePhotos.prototype.initialize = function(map) {
	var me = this;
	var container = document.createElement("div");
	container.style.border = "1px solid black";
	container.style.backgroundColor = "white";
	container.style.textAlign = "center";
  	container.style.cursor = "pointer";
  	container.style.height = "1.5em";

	var input = document.createElement("input");
	input.id = 'tag';
	input.style.cssFloat = "left";
	if(me.photoLayer.is_ie) input.style.height = "1.4em";
	else input.style.height = "1.5em";
	input.style.width = "15em";
	input.style.paddingTop = "0.1em";
	input.style.borderWidth = "1px";
	input.style.borderStyle = "solid";
	input.style.borderColor = "white rgb(176, 176, 176) rgb(176, 176, 176) white";
	input.style.fontWeight = "bold";
	input.style.fontSize = "0.8em";

	var photodiv = document.createElement("div");
	photodiv.style.cssFloat = "left";
	photodiv.style.padding = "0 0.5em";
	photodiv.style.display = "inline";
	photodiv.style.borderWidth = "1px";
	photodiv.style.borderStyle = "solid";
	photodiv.style.borderColor = "white rgb(176, 176, 176) rgb(176, 176, 176) white";
	photodiv.style.fontWeight = "bold";
	photodiv.style.fontSize = "12px";

	container.appendChild(input);
	container.appendChild(photodiv);
	photodiv.appendChild(document.createTextNode("More photos"));

	GEvent.addDomListener(photodiv, "click", function() {
		var center = map.getCenter();
		var bounds = map.getBounds();
		var southWest = bounds.getSouthWest();
		var northEast = bounds.getNorthEast();
		var span = bounds.toSpan();
		var zoom = map.getZoom();
		me.photoLayer.clickMorePhotos = true;
		me.photoLayer.loadMorePhotos(me.photoLayer, {north: northEast.lat(), south: southWest.lat(), east: northEast.lng(), west: southWest.lng()});
	});

	map.getContainer().appendChild(container);
	return container;
}

// Place the control
MorePhotos.prototype.getDefaultPosition = function() {
  return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(100, 7));
}

//------------------------------------------------------------//
//            Custom controls: link toolbar             //
//------------------------------------------------------------//

// We define the function first
function Link(photoLayer) {
	var me = this;
	me.photoLayer = photoLayer;
}

// To "subclass" the GControl, we set the prototype object to
// an instance of the GControl object
Link.prototype = new GControl();

// Creates a one DIV for each of the buttons and places them in a container
// DIV which is returned as our control element. We add the control to
// to the map container and return the element for the map class to
// position properly.
Link.prototype.initialize = function(map) {
	var me = this;
	var container = document.createElement("div");
	container.style.border = "1px solid black";
	container.style.backgroundColor = "white";
	container.style.textAlign = "center";
  	container.style.cursor = "pointer";
  	container.style.height = "1.5em";

	var linkdiv = document.createElement("div");
	linkdiv.style.cssFloat = "left";
	linkdiv.style.padding = "0 0.5em";
	linkdiv.style.borderWidth = "1px";
	linkdiv.style.borderStyle = "solid";
	linkdiv.style.borderColor = "white rgb(176, 176, 176) rgb(176, 176, 176) white";
	linkdiv.style.fontWeight = "bold";
	linkdiv.style.fontSize = "12px";

	container.appendChild(linkdiv);
	linkdiv.appendChild(document.createTextNode("Link"));

	GEvent.addDomListener(linkdiv, "click", function() {
		var center = map.getCenter();
		var bounds = map.getBounds();
		var southWest = bounds.getSouthWest();
		var northEast = bounds.getNorthEast();
		var span = bounds.toSpan();
		var zoom = map.getZoom();
		var center = map.getCenter();

		var maptype = map.getCurrentMapType().getName();
		show_embed(northEast.lat()+","+southWest.lat()+","+northEast.lng()+","+southWest.lng()+","+center.lat()+","+center.lng(), zoom, maptype);
	});

	map.getContainer().appendChild(container);
	return container;
}

// Place the control
Link.prototype.getDefaultPosition = function() {
  return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(390, 7));
}

//------------------------------------------------------------//
//                Custom controls: HD checkbox                //
//------------------------------------------------------------//

function Hd() {
	var me = this;
}

Hd.prototype = new GControl();

Hd.prototype.initialize = function(map) {
	var me = this;
	var container = document.createElement("div");
	container.style.border = "1px solid black";
	container.style.backgroundColor = "white";
	container.style.textAlign = "center";
  	container.style.cursor = "pointer";
  	container.style.height = "1.5em";

	var input = document.createElement("input");
	input.type = 'checkbox';
	input.id = 'hd';
	input.style.cssFloat = "left";
	//input.style.marginTop = "2px";
	if(me.is_ie) input.style.height = "1.5em";
	input.style.borderWidth = "1px";
	input.style.borderStyle = "solid";
	input.style.borderColor = "white rgb(176, 176, 176) rgb(176, 176, 176) white";

	var photodiv = document.createElement("div");
	photodiv.style.cssFloat = "left";
	photodiv.style.padding = "0 0.5em";
	photodiv.style.borderWidth = "1px";
	photodiv.style.display = "inline";
	photodiv.style.borderStyle = "solid";
	photodiv.style.borderColor = "white rgb(176, 176, 176) rgb(176, 176, 176) white";
	photodiv.style.fontWeight = "bold";
	photodiv.style.fontSize = "12px";

	container.appendChild(input);
	container.appendChild(photodiv);
	photodiv.appendChild(document.createTextNode("HD"));

	map.getContainer().appendChild(container);
	return container;
}

Hd.prototype.getDefaultPosition = function() {
  return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(330, 7));
}