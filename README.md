Witness King Tides Web API
==========================

.NET Web API for uploading photos into the Witness King Tides application from native and web clients.

The API expects the payload in the following JSON format:

	{
	  "Email": "pwcberry@gmail.com",
	  "FirstName": "Peter",
	  "LastName": "Berry",
	  "Description": null,
	  "Latitude": -35.0,
	  "Longitude": 136.0,
	  "CreationTime": "0001-01-01T00:00:00",
	  "FileName": "name.jpg",
	  "Photo": "BASE64"
	}


Witness King Tides Web Frontend
===============================

This repository includes the HTML5 web frontend (previously under: https://github.com/rhok-melbourne/witnesskingtides-web). It is built using the following libraries and frameworks:

 * OpenLayers 2.13.1 (http://www.openlayers.org)
 * Twitter Bootstrap 3.0.3 (http://getbootstrap.com)
 * Backbone 1.1.0 (http://backbonejs.org/)
 * jQuery 1.10.2 (http://jquery.com/
 * Underscore 1.5.2 (http://underscorejs.org/)
 * bootstrap-datetimepicker (http://www.malot.fr/bootstrap-datetimepicker)
 * moment.js 2.4.0 (http://momentjs.com/)
 * validate.js 1.3 (http://rickharrison.github.com/validate.js)

Demo
====

View the current development snapshot of this app and Web API at: http://witnesskingtides.azurewebsites.net/
