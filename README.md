# CSW Client

Search and browse OGC CSW endpoints.

### Getting Started

The repo is ready to deploy- you only need to add the CSW endpoint of your choice.
- in js/catalog-app.js set `var cswUrl` to the url of your CSW server

### Developer info
  - CSW server must have [CORS enabled](https://www.w3.org/wiki/CORS_Enabled) and support AJAX POST requests. Before that's implemented some servers may require a browser-plugin that enables cross-origin resource sharing.