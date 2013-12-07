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
