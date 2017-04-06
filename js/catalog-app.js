/*
 * App for interfacing with CSW services to browse and seach records
 * 
 *
 *
 *
 */


// Site Module- instatiated above
var nrlCatalog = angular.module('nrlCatalog', [ ]);
//var app = angular.module('store', [ ]);

/*
 * main controller
 * injects $scope and $http ( for post requests )
 */
nrlCatalog.controller('mainController', ['$scope', '$http', function($scope, $http) {
    //if true, app knows to rebuild $scope.pages object
    var newRequest = true;

    //after post request, records objects are created and pushed here
    $scope.curRecords= [];

    $scope.defaultExtent = [-180, -90, 180, 90];

    $scope.pages = {
        curPage: 1,
        pages: [],
        totalRecords: 0,
        recordsPerPage: 10,
        totalPages: null,
        pageLimits: []

    }


    //set to either "basic" or "advanced"
    var curSearch = "basic";

    //Create our search objects
    $scope.basicSearch = new csw.search();
    


    /**
     * Sets curSearch value and calls method to retrieve the first set of pages
     * 
     * @param {string} either "basic" or "advanced". if param is ommited, "basic" is used
     */
    $scope.submitSearch = function(search){
        if (search ==  null){
            curSearch == "basic";
        }
        else{
            curSearch = search;
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
     * Checks curSearch and calls createRequest on appropriate search object
     * There are only 2 possible search objects, "basic" and "advanced"
     *
     * @return{String} getRecordRequest - xml string required for csw record request
     */
    function getRecordRequest(){
        if (curSearch == "basic"){
            return $scope.basicSearch.createRequest($scope.pages);
        }
        else{
            return $scope.advancedSearch.createRequest($scope.pages);
        }
    }

    /**
     * Checks curSearch and calls createRequest on appropriate search object
     * There are only 2 possible search objects, "basic" and "advanced"
     *
     * @return{String} getRecordRequest - xml string required for csw record request
     */
    $scope.getFirstPage = function(){
        $scope.pages.curPage = 1;
        $scope.pages.pageLimits = [0, 10];
        newRequest = true;
        var recordRequest = getRecordRequest();
        $scope.requestRecords(recordRequest);
    };

    /**
     * increments $scope.pages.curPage
     * creates and submits and new records request
     */
    $scope.getNextPage = function(){
        setCurPage($scope.pages.curPage + 1);
        var recordRequest = getRecordRequest();
        $scope.requestRecords(recordRequest);
    };

    /**
     * decrements $scope.pages.curPage
     * creates and submits and new records request
     */
    $scope.getPrevPage = function(){
        setCurPage($scope.pages.curPage - 1);
        var recordRequest = getRecordRequest();
        $scope.requestRecords(recordRequest);
    };

    /**
     * Loads records for a arbitrary page #
     * creates and submits and new records request
     * @param{int} page - page #
     */
    $scope.goToPage = function(page){
        setCurPage(page);
        var recordRequest = getRecordRequest();
        $scope.requestRecords(recordRequest);
    };

    /**
     * Converts coordinates from corner formatted strings "20, 30" to extent array
     * @param{String} lowerCorner
     * @param{String} upperCorner
     * @return{[]} getExtentFromCorners
     */
    function getExtentFromCorners(lowerCorner, upperCorner){
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
    $scope.requestRecords = function(recordRequest){
        $http({
            url: "https://nrlgeoint.cs.uno.edu/pycsw?service=CSW&version=2.0.2",
            method: "POST",
            data: recordRequest,
            headers: {
                'Accept': 'application/xml'
            }
        })
        .then(function(response){
            //success
            $scope.curRecords = [];                            
            var xml = $.parseXML(response.data);
            console.log(xml);
            var i = 1;

            if (newRequest == true){
                $scope.pages.totalRecords = $(xml).find("SearchResults").attr('numberOfRecordsMatched');
                $scope.setPages();
                newRequest = false;
            }
            $(xml).find("Record").each(function(i,record){
                var item = {};
                item.title = $(record).find("title").html();
                item.keywords = [];
                $(record).find("subject").each(function(e, subject){
                    item.keywords.push($(subject).html());
                });
                item.abstract = $(record).find("abstract").html();
                item.type = $(record).find("type").html();
                item.lowerCorner = $(record).find("LowerCorner").html();
                item.upperCorner = $(record).find("UpperCorner").html();
                item.extent = getExtentFromCorners($(record).find("LowerCorner").html(), $(record).find("UpperCorner").html());
                item.mapID = "map"+i;
                $scope.curRecords.push(item);
                i++;

            });
            setTimeout(createPreviews, 100);
        },
        function(response){console.log(response)});
    };

    


    /* ===========================================================================================
     * open layers map
     */

    var feature = new ol.Feature({
        geometry: new ol.geom.Polygon.fromExtent([0,0,90,90])
    })

    var layer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [feature]
        })
    });

    //
    var vectorSource = new ol.source.Vector({
        url: 'https://openlayers.org/en/v4.0.1/examples/data/geojson/countries.geojson',
        format: new ol.format.GeoJSON()
      });

    var layers = [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          }),
          new ol.layer.Vector({
            //source: feature
            source: vectorSource
          }),
          layer
        ];

    var previewView = new ol.View({
          center: [0, 0],
          projection: 'EPSG:4326',
          zoom: 1,
          minZoom: 1,
        });

    // Open Street Maps layer
    var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    //Country Outlines layer
    var countriesLayer = new ol.layer.Vector({
        source: vectorSource
    });

    // Extent preview maps Array: 1 for every item in $scope.curRecords
    // deleted and repopulated on each page load
    var previewMaps = [];

    /**
     * Flips the long/lat values in an extent array 
     * for use in building an OL polygon
     * @param {float Array(4)} extent
     * @return {float Array(4)} flipExtent
     */
    function flipExtent(extent){
        console.log(extent);
        return [extent[1], extent[0], extent[3], extent[2]];
    }


    // Styles for extent preview maps
    var mapStroke = new ol.style.Stroke({
        color: '#f44336',
        width: 2
    });
    var mapStyle = new ol.style.Style({ stroke: mapStroke });


    /**
     * iterates through $scope.curRecords, creating a new OL map for each
     * with each record's extent displayed in red
     */
    function createPreviews(){
        for (var i = 0; i < $scope.curRecords.length; i++) {
            
            var feature = new ol.Feature({
                geometry: new ol.geom.Polygon.fromExtent(flipExtent($scope.curRecords[i].extent))
            });

            feature.setStyle(mapStyle);

            var extentLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [feature]
                })
            });

            previewMaps[i] = new ol.Map({
                size: [250,125],
                layers: [osmLayer, extentLayer],
                target: $scope.curRecords[i].mapID,
                view: new ol.View({
                  center: [0, 0],
                  projection: 'EPSG:4326',
                  zoom: 0,
                }),
                controls: []
              });

            previewMaps[i].getView().fit([-90, -180, 90, 180]);
        }
    }


    

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
    return{
        restrict: 'E',
        templateUrl:   'templates/searchBasic.html',
    }
});

nrlCatalog.directive('advancedSearch', function() {
    return{
        restrict: 'E',
        templateUrl:   'templates/searchAdvanced.html',
        controller: function($scope){

            $scope.advancedSearch = new csw.search();


           
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
                $scope.advancedSearch.setExtent( advSearchExtent.getExtent() );
                $scope.$apply();
            });


             /**
             * updates extent when user manually changes coordinate input in view
             */
            $scope.updateExtent = function(){
                advSearchExtent.setExtent($scope.advancedSearch.getExtent());
            };


            /**
             * resets extent to default (in OL map and search object)
             */
            $scope.clearExtent = function(){
                extent.setExtent(null);
                $scope.advancedSearch.extent.extent = $scope.defaultExtent;
            };




		},
        controllerAs: 'advSearch'
    }
});


