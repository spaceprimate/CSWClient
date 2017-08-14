# CSW Client

Search and browse OGC CSW endpoints.

### Getting Started

The repo is ready to deploy- you only need to add the CSW endpoint of your choice.
- in js/catalog-app.js set `var cswUrl` to the url of your CSW
- the sidebar <b>Refine Search</b> section is populated via a csw:GetDomain request, called from the getDomain method. The type 'type' is used in this example, but any meta-data type supported by the CSW is allowed.

### Developer info
  - CSW server must have [CORS enabled](https://www.w3.org/wiki/CORS_Enabled) and support AJAX POST requests. Before that's implemented some servers may require a browser-plugin that enables cross-origin resource sharing.

### Contact
  -dtmurph1@uno.edu