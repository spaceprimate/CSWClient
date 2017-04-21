/*
 * App for interfacing with CSW services to browse and seach records
 * 
 * - note: This app uses POST XML to request CSW records, requiring the CSW to allow CORS for the client domain
 *
 *
 */


// Site Module- instatiated above
var nrlCatalog = angular.module('nrlCatalog', [ ]);
//var app = angular.module('store', [ ]);

nrlCatalog.config(function($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
});

/*
 * main controller
 * injects $scope and $http ( for post requests )
 */
nrlCatalog.controller('mainController', ['$scope', '$http', function($scope, $http) {

    //location of the CSW server
     var cswUrl = "https://nrlgeoint.cs.uno.edu/pycsw?service=CSW&version=2.0.2";
    // var cswUrl = "https://data.noaa.gov/csw?version=2.0.2";
    // var cswUrl = "http://demo.pycsw.org/cite/csw?service=CSW&version=2.0.2";

    //if true, app knows to rebuild $scope.pages object, called during http request
    var newRequest = true;

    //after post request, records objects are created and pushed here
    $scope.curRecords= [];

    $scope.defaultExtent = [-180, -90, 180, 90];

    $scope.hideSidebar = true;

    $scope.pages = {
        curPage: 1,
        pages: [],
        totalRecords: 0,
        recordsPerPage: 10,
        totalPages: null,
        pageLimits: []

    }

    
    $scope.searches = {
        //Create our search objects
        basicSearch:  new csw.search(),
        advancedSearch:  new csw.search()
    };

    $scope.noRecordsFound = false;
    


    //set to either "basicSearch" or "advancedSearch"
    $scope.curSearch = "basicSearch";

    //$scope.advancedSearch = new csw.search();

    //Create our search objects
    //$scope.basicSearch = new csw.search();

    //create options for sort dropdown
    $scope.sortOptions = [
        {id: "dc:title", order: "ASC", label: "Title - Ascending"},
        {id: "dc:title", order: "DESC", label: "Title - Descending"}
    ];
    $scope.sortOption = $scope.sortOptions[0];
    


    /**
     * Sets $scope.curSearch value and calls method to retrieve the first set of pages
     * 
     * @param {string} either "basicSearch" or "advancedSearch". if param is ommited, "basicSearch" is used
     */
    $scope.submitSearch = function(search){
        if (search ==  undefined){
            $scope.curSearch = "basicSearch";
        }
        else{
            $scope.curSearch = search;
        }
        if(search == "advancedSearch"){
            $scope.minimizeAdvanced = true;
        }
        $scope.getFirstPage();
    };

    /**
     * based on settings in pages object, this calculates how many pages are required
     * to accomodate the number of returned records, based on the number of records per page (set by user)
     */
    $scope.setPages = function(){
        $scope.pages.totalPages = Math.ceil($scope.pages.totalRecords / $scope.pages.recordsPerPage);
        $scope.pages.pages = [];
        for (var i = 0; i < $scope.pages.totalPages; i++) {
            $scope.pages.pages.push(i+1);
        }
    };

    /**
     * Calls methods to recalculate # of pages and, load first page in series
     * Triggered when user changes $scope.pages.recordsPerPage in view
     */
    $scope.updatePages = function(){
        $scope.setPages();
        $scope.goToPage(1);
    };

    /**
     * Sets Current page, and updates what records should be visile on that page
     * @param{int}
     */
    function setCurPage(curPage){
        $scope.pages.curPage = curPage;
        $scope.pages.pageLimits[1] = Math.ceil(curPage / 10) * 10;
        $scope.pages.pageLimits[0] = $scope.pages.pageLimits[1] - 10;
    }



    /**
     * Checks $scope.curSearch and calls createRequest on appropriate search object
     * There are only 2 possible search objects, "basic" and "advanced"
     *
     * @return{String} getRecordRequest - xml string required for csw record request
     */
    $scope.getFirstPage = function(){
        $scope.pages.curPage = 1;
        $scope.pages.pageLimits = [0, 10];
        newRequest = true;
        var recordRequest = $scope.searches[$scope.curSearch].createRequest($scope.pages);
        $scope.requestRecords(recordRequest);
    };

    /**
     * increments $scope.pages.curPage
     * creates and submits and new records request
     */
    $scope.getNextPage = function(){
        setCurPage($scope.pages.curPage + 1);
        var recordRequest = $scope.searches[$scope.curSearch].createRequest($scope.pages);
        $scope.requestRecords(recordRequest);
    };

    /**
     * decrements $scope.pages.curPage
     * creates and submits and new records request
     */
    $scope.getPrevPage = function(){
        setCurPage($scope.pages.curPage - 1);
        var recordRequest = $scope.searches[$scope.curSearch].createRequest($scope.pages);
        $scope.requestRecords(recordRequest);
    };

    /**
     * Loads records for a arbitrary page #
     * creates and submits and new records request
     * @param{int} page - page #
     */
    $scope.goToPage = function(page){
        setCurPage(page);
        var recordRequest = $scope.searches[$scope.curSearch].createRequest($scope.pages);
        $scope.requestRecords(recordRequest);
    };

    /**
     * Converts coordinates from corner formatted strings "20, 30" to extent array
     * @param{String} lowerCorner
     * @param{String} upperCorner
     * @return{[]} getExtentFromCorners
     */
    function getExtentFromCorners(lowerCorner, upperCorner){
        console.log("lowerCorner: " + lowerCorner + " , upperCorner: " + upperCorner);
        if (lowerCorner == undefined || upperCorner == undefined){
            return [null, null, null, null];
        }
        lc = lowerCorner.split(" ");
        uc = upperCorner.split(" ");
        return lc.concat(uc);
    }

    /**
     * Makes angular http POST request to CSW Server
     * iterates through results, creating and pushing record objects to $scope.curRecords
     *
     * @param {String} recordRequest - string containing xml for request
     */

    // check here: http://stackoverflow.com/questions/21455045/angularjs-http-cors-and-http-authentication
    $scope.requestRecords = function(recordRequest){
        console.log("record request: ");
        console.log(recordRequest);
        $http({
            url: cswUrl,
            method: "POST",
            data: recordRequest,
            headers: {
                'Accept': 'application/xml',
            }
        })
        .then(function(response){
            // Request successful!

            $scope.curRecords = [];   

            // X2JS converts returned xml data into JSON
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);

            console.log(jsonData);

            var i = 1;

            var totalRecords = getSafe(() => jsonData.GetRecordsResponse.SearchResults._numberOfRecordsMatched );

            if (newRequest == true && totalRecords >= 0){
                $scope.pages.totalRecords = totalRecords;
                $scope.setPages();
                newRequest = false;
            }

            if(totalRecords == 0 || totalRecords == undefined ){
                $scope.noRecordsFound = true;
                console.log("no records found");
            }
            
            else{
                // If there's only 1 record, it won't be in an array. 
                if ( !Array.isArray(jsonData.GetRecordsResponse.SearchResults.Record) ){
                    var tmp = jsonData.GetRecordsResponse.SearchResults.Record;
                    jsonData.GetRecordsResponse.SearchResults.Record = [tmp];
                    console.log("not an array, one item loaded);")
                }

                jsonData.GetRecordsResponse.SearchResults.Record.forEach(function(e, i) {
                    var item = {};
                    item.title = getSafe(() => e.title.toString() );
                    item.keywords = [];
                    if ( Array.isArray(e.subject) ){
                        e.subject.forEach(function(el){
                            item.keywords.push(el.toString());
                        });
                    }
                    item.abstract = getSafe( () => e.abstract.toString() );
                    if (item.abstract ==  "[object Object]"){item.abstract = "";}
                    item.type = getSafe( () => e.type.toString() );
                    item.lowerCorner = getSafe(() => e.BoundingBox.LowerCorner.toString() );
                    item.upperCorner = getSafe(() => e.BoundingBox.UpperCorner.toString() );
                    item.extent = getExtentFromCorners(item.lowerCorner, item.upperCorner);
                    item.mapID = "map"+i;
                    $scope.curRecords.push(item);
                    //console.log(item);
                    i++;
                });
            }
            // if OL maps aren't loading properly, using setTimeout is a quickfix, but not a solution long term
            //setTimeout(createPreviews, 100);
        },
        function(response){
            //error
            console.log("Request Error, response follows: ");
            console.log(response);
        });
    };


    /* ===========================================================================================
     * open layers Elements
     */


    /**
     * Flips the long/lat values in an extent array 
     * for use in building an OL polygon
     * @param {float Array(4)} extent
     * @return {float Array(4)} flipExtent
     */
    $scope.flipExtent = function(extent){
        return [extent[1], extent[0], extent[3], extent[2]];
    }

    // Styles for extent preview maps
    var mapStroke = new ol.style.Stroke({
        color: '#f44336',
        width: 2
    });
    $scope.mapStyle = new ol.style.Style({ stroke: mapStroke });


    //init
    //$scope.getFirstPage();

}]);


nrlCatalog.directive('headerTemplate', function() {
    return{
        restrict: 'E',
        templateUrl:   'templates/header.html',
    }
});

nrlCatalog.directive('sidebarTemplate', function() {
    return{
        restrict: 'E',
        templateUrl:   'templates/sidebar.html',
    }
});

nrlCatalog.directive('basicSearch', function() {
    //    basicSearch:  new csw.search();
    return{
        restrict: 'E',
        templateUrl:   'templates/searchBasic.html',
    }
});


nrlCatalog.directive('recordTemplate', function() {
    return{
        restrict: 'A',
        templateUrl:   'templates/record.html',

        controller: function($scope){

            var osmLayer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });

            var feature = new ol.Feature({
                //geometry: new ol.geom.Polygon.fromExtent(flipExtent($scope.curRecords[i].extent))
                geometry: new ol.geom.Polygon.fromExtent($scope.flipExtent($scope.record.extent))
            });

            feature.setStyle($scope.mapStyle);

            var extentLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [feature]
                })
            });

            setTimeout(addMap, 200);
            function addMap(){
                var previewMap = new ol.Map({
                size: [250,125],
                layers: [osmLayer, extentLayer],
                target: $scope.record.mapID,
                view: new ol.View({
                  center: [0, 0],
                  projection: 'EPSG:4326',
                  zoom: 0,
                }),
                controls: []
              });
            }
        }
    }
});

nrlCatalog.directive('advancedSearch', function() {
    return{
        restrict: 'E',
        templateUrl:   'templates/searchAdvanced.html',
        controller: function($scope){

            //$scope.advancedSearch = new csw.search();

            var vectorSource = new ol.source.Vector({
                url: 'https://openlayers.org/en/v4.0.1/examples/data/geojson/countries.geojson',
                format: new ol.format.GeoJSON()
            });
            
            // Open Street Maps layer
            var osmLayer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });
            //Country Outlines layer
            var countriesLayer = new ol.layer.Vector({
                source: vectorSource
            });

            /**
             * Map used for drawing extent in Advanced Search
             */
            var advSearchMap = new ol.Map({
                layers: [osmLayer, countriesLayer],
                target: 'adv-search-map',
                view: new ol.View({
                    center: [0, 0],
                    projection: 'EPSG:4326',
                    zoom: 1,
                    minZoom: 1,
                })
            });

            //OL extent for advanced search
            var advSearchExtent = new ol.interaction.Extent({
                condition: ol.events.condition.platformModifierKeyOnly
            });
            advSearchMap.addInteraction(advSearchExtent);
            advSearchExtent.setActive(false);

            //Enable interaction by holding shift
            document.addEventListener('keydown', function(event) {
                if (event.keyCode == 16) {
                    advSearchExtent.setActive(true);
                }
            });

            //stop extent interaction when the shift key releases
            /** this is being called constantly and causes warnings, should only be called when interaction with the map **/
            document.addEventListener('keyup', function(event) {
                if (event.keyCode == 16) {
                    advSearchExtent.setActive(false);
                }
                $scope.searches.advancedSearch.setExtent( advSearchExtent.getExtent() );
                $scope.$apply();
            });

             /**
             * updates extent when user manually changes coordinate input in view
             */
            $scope.updateExtent = function(){
                advSearchExtent.setExtent($scope.searches.advancedSearch.getExtent());
            };

            /**
             * resets extent to default (in OL map and search object)
             */
            $scope.clearExtent = function(){
                extent.setExtent(null);
                $scope.searches.advancedSearch.extent.extent = $scope.defaultExtent;
            };
		},
        controllerAs: 'advSearch'
    }
});



function getSafe(fn) {
    try {
        return fn();
    } catch (e) {
        return undefined;
    }
}

