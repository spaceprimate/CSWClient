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
 * $routeProvider allows us to add page specific controllers if needed in the future
 */
nrlCatalog.controller('mainController', ['$scope', '$http', function($scope, $http) {

    //$scope.curPage = 1;
    //$scope.pages = [];
    //$scope.pages.totalRecords = 0;
    //$scope.pages.recordsPerPage = 10;
    //$scope.pages.totalPages;
    //$scope.pages.pageLimits = [];

    var newRequest = true;
    $scope.curRecords= [];
    
    
    
    $scope.defaultExtent = [-180, -90, 180, 90];

    $scope.useAdvancedSearch = false;

    $scope.pages = {
        curPage: 1,
        pages: [],
        totalRecords: 0,
        recordsPerPage: 10,
        totalPages: null,
        pageLimits: []

    }



/* FILTERS =========================================================
 */

    var curSearch = "basic";

    /*
    $scope.filterTypes = [
        {id: "title", label: "Title"},
        {id: "extent", label: "Bounding"}
    ];
    $scope.filterConstraints = [
        "contains", "begins with", "exactly matches", "does not contain"
    ];
    */

    $scope.basicSearch = new csw.search();

    console.log("basic search is: ");
    console.log($scope.basicSearch);

    /*
    $scope.basicSearch = [{
        id : "main",
        type : {id: "title", label: "Title"},
        term: "",
        bbox: []
    }];
    */

    $scope.advancedSearch = new csw.search();

    //$scope.setHasExtent


    /*
    $scope.advancedSearch = {
        filters: [],
        extent: {
            type: "contains",
            extent: $scope.defaultExtent
        }
    };
    */


    //filter from main search box
    /*
    $scope.advancedSearch.filters.push({
        id : "main",
        type : $scope.filterTypes[0],
        constraint : $scope.filterConstraints[0],
        term: ""
    });
    */
    //none, basic, advanced
    //$scope.filtersStatus = "none";

    function clearFilters(){
        for (var i = $scope.filters.length - 1; i >= 0; i--) {
            $scope.filters.pop();
            //$scope.filtersStatus = "none";
        }
    }

    $scope.addAdvancedFilter = function(){
        var filter = {};
        //filter.id = id;
        filter.type = $scope.filterTypes[0];
        filter.constraint = $scope.filterConstraints[0];
        filter.term = "";
        $scope.advancedSearch.filters.push(filter);
    };
    


    $scope.submitSearch = function(search){
        if (search ==  null){
            curSearch == "basic";
        }
        else{
            curSearch = search;
        }

        //curFilter = "basic";
        //$scope.filtersStatus = true;
        $scope.getFirstPage();
    };
    /*
    $scope.testSearch = function(search){
        if (search ==  null){
            curSearch == "basic";
        }
        else{
            curSearch = search;
        }

        //curFilter = "basic";
        //$scope.filtersStatus = true;
        $scope.getFirstPage();
    }
    */

    $scope.submitAdvancedSearch = function(){
        curFilter = "advanced";
        //$scope.filtersStatus = true;
        $scope.getFirstPage();
    };

    
    

    $scope.testApp = function(){
        console.log("main filter type and term: ");
        console.log($scope.mainFilter.type);
        console.log($scope.mainFilter.term);
    };

    $scope.setPages = function(){
        $scope.pages.totalPages = Math.ceil($scope.pages.totalRecords / $scope.pages.recordsPerPage);
        $scope.pages.pages = [];
        for (var i = 0; i < $scope.pages.totalPages; i++) {
            $scope.pages.pages.push(i+1);
        }
    };

    $scope.updatePages = function(){
        //$scope.pages.curPage = 1;
        $scope.setPages();
        $scope.goToPage(1);
        //setCurPage(1);
    };

    function setCurPage(curPage){
        $scope.pages.curPage = curPage;
        $scope.pages.pageLimits[1] = Math.ceil(curPage / 10) * 10;
        $scope.pages.pageLimits[0] = $scope.pages.pageLimits[1] - 10;
    }
    /*
    function hasFilter(){
        for (var f in $scope.filters){
            if (f.active == true){
                return true;
            }
        }
        return false;
    }
    */
    $scope.goToPage = function(page){
        setCurPage(page);
        var recordRequest = createRequest($scope.pages.curPage);   
        $scope.requestRecords(recordRequest);
    };

    

    function createRequest(page){
        var recordNumber = (page - 1) * $scope.pages.recordsPerPage + 1;
        var request =   '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" service="CSW" version="2.0.2" resultType="results" startPosition="' + recordNumber + '" maxRecords="' + $scope.pages.recordsPerPage + '" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:gml="http://www.opengis.net/gml">' +
                          '<csw:Query typeNames="csw:Record">' +
                            '<csw:ElementSetName>full</csw:ElementSetName>';

            if (curFilter == "none"){
                request +=  '<csw:Constraint version="1.1.0">' +
                                '<ogc:Filter>' + 
                                    '<ogc:PropertyIsNotEqualTo>' +
                                        '<ogc:PropertyName>dc:type</ogc:PropertyName>' +
                                        '<ogc:Literal>service</ogc:Literal>' +
                                    '</ogc:PropertyIsNotEqualTo>' + 
                                '</ogc:Filter>' +
                            '</csw:Constraint>';
            }
            else if (curFilter == "basic") {
                request +=  '<csw:Constraint version="1.1.0">' +
                                '<ogc:Filter>' + 
                                    '<ogc:And>' +
                                        '<ogc:PropertyIsNotEqualTo>' +
                                            '<ogc:PropertyName>dc:type</ogc:PropertyName>' +
                                            '<ogc:Literal>service</ogc:Literal>' +
                                        '</ogc:PropertyIsNotEqualTo>';

                if ($scope.basicSearch.filters[0].type.id == 'title'){
                    request += '<ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">' +
                                    '<ogc:PropertyName>dc:' + $scope.basicSearch.filters[0].type.id + '</ogc:PropertyName>' +
                                    '<ogc:Literal>%' + $scope.basicSearch.filters[0].term + '%</ogc:Literal>' +
                                '</ogc:PropertyIsLike>';
                }

                else if ($scope.basicSearch.filters[0].type.id == 'extent'){
                    request += '<ogc:BBOX>' + 
                                      '<ogc:PropertyName>ows:extent</ogc:PropertyName>' + 
                                      '<gml:Envelope>' + 
                                        '<gml:lowerCorner>' + $scope.basicSearch.filters[0].bbox[0] + ' ' + $scope.basicSearch.filters[0].bbox[1] + '</gml:lowerCorner>' + 
                                        '<gml:upperCorner>' + $scope.basicSearch.filters[0].bbox[0] + ' ' + $scope.basicSearch.filters[0].bbox[1] + '</gml:upperCorner>' + 
                                      '</gml:Envelope>' + 
                                    '</ogc:BBOX>';
                }

                                        
                                        
                request +=          '</ogc:And>' + 
                                '</ogc:Filter>' +
                            '</csw:Constraint>';

            }

            else if (curFilter == "basicdf") {
                request +=  '<csw:Constraint version="1.1.0">' +
                                '<ogc:Filter>' + 
                                
                                    '<ogc:BBOX>' + 
                                      '<ogc:PropertyName>ows:extent</ogc:PropertyName>' + 
                                      '<gml:Envelope>' + 
                                        '<gml:lowerCorner>47 -5</gml:lowerCorner>' + 
                                        '<gml:upperCorner>55 20</gml:upperCorner>' + 
                                      '</gml:Envelope>' + 
                                    '</ogc:BBOX>' + 
                                    
                                '</ogc:Filter>' +
                            '</csw:Constraint>';

            }
            

        request +=      '</csw:Query>' +
                    '</csw:GetRecords>';
        return request;
    }

    function createRequestTest(page){
        var recordNumber = (page - 1) * $scope.pages.recordsPerPage + 1;
        var request =   '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" service="CSW" version="2.0.2" resultType="results" startPosition="' + recordNumber + '" maxRecords="' + $scope.pages.recordsPerPage + '" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:gml="http://www.opengis.net/gml">' +
                          '<csw:Query typeNames="csw:Record">' +
                            '<csw:ElementSetName>full</csw:ElementSetName>';

           

            
            

        request +=      '</csw:Query>' +
                    '</csw:GetRecords>';
        return request;
    }


/*


'<ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">' +
                                            '<ogc:PropertyName>dc:' + $scope.basicSearch.filters[0].type.id + '</ogc:PropertyName>' +
                                            '<ogc:Literal>%marble%</ogc:Literal>' +
                                        '</ogc:PropertyIsLike>' +



                                        '<ogc:BBOX>' + 
                                            '<ogc:PropertyName>extent</ogc:PropertyName>' + 
                                            '<gml:Envelope>' + 
                                                '<gml:lowerCorner>47 -5</gml:lowerCorner>' + 
                                                '<gml:upperCorner>55 20</gml:upperCorner>' + 
                                            '</gml:Envelope>' + 
                                        '</ogc:BBOX>' + 
                                        */
        
    function getRecordRequest(){
        if (curSearch == "basic"){
            return $scope.basicSearch.createRequest($scope.pages);
        }
        else{
            return $scope.advancedSearch.createRequest($scope.pages);
        }
    }
    $scope.getFirstPage = function(){
        curPage = 1;
        $scope.pages.pageLimits = [0, 10];
        newRequest = true;
        var recordRequest = getRecordRequest();
        console.log("actually called?");
        //var recordRequest = createRequest(curPage, curSearch, ...)
        $scope.requestRecords(recordRequest);
    };

    $scope.getNextPage = function(){

        setCurPage($scope.pages.curPage + 1);
        //curPage ++;
        var recordRequest = createRequest($scope.pages.curPage);
        $scope.requestRecords(recordRequest);
    };

    $scope.getPrevPage = function(){
        setCurPage($scope.pages.curPage - 1);
        //curPage --;
        var recordRequest = createRequest($scope.pages.curPage);
        $scope.requestRecords(recordRequest);
    };

    function getExtentFromCorners(lowerCorner, upperCorner){
        lc = lowerCorner.split(" ");
        uc = upperCorner.split(" ");
        
        return lc.concat(uc);
    }

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
                            //alert("it works");
                            
                            var xml = $.parseXML(response.data);
                            console.log(xml);
                            var i = 1;

                            if (newRequest == true){
                                $scope.pages.totalRecords = $(xml).find("SearchResults").attr('numberOfRecordsMatched');
                                $scope.setPages();
                                newRequest = false;
                            }
                            
                            


                            $(xml).find("Record").each(function(i,record){

                                
                                //console.log($(record).find("title").html());
                                var item = {};
                                item.title = $(record).find("title").html();
                                item.type = $(record).find("type").html();
                                item.lowerCorner = $(record).find("LowerCorner").html();
                                item.upperCorner = $(record).find("UpperCorner").html();
                                item.extent = getExtentFromCorners($(record).find("LowerCorner").html(), $(record).find("UpperCorner").html());
                                item.mapID = "map"+i;
                                $scope.curRecords.push(item);
                                //$("#records").append("<tr><td>" + i + "</td><td>" + $(record).find("title").html() + "</td>");
                                i++;

                                //console.log(item.extent);
                              
                            });

                            setTimeout(createPreviews, 100);
                            //createPreviews();



                            //console.log($scope.curRecords);


        },
            function(response){console.log(response)});
        
    };


    //old request using jquery and manual scope update
    /*
    $scope.requestRecordsOld = function(recordRequest){
        $.ajax({ type: "POST",
                        url: "https://nrlgeoint.cs.uno.edu/pycsw?service=CSW&version=2.0.2",
                        data: recordRequest,
                        contentType: "text/xml",
                        dataType: "xml",
                        cache: false,
                        error: function() { alert("No data found."); },
                        success: function(xml) {
                            $scope.curRecords = [];
                            //alert("it works");
                            console.log(xml);
                            var i = 1;

                            if (newRequest == true){
                                $scope.pages.totalRecords = $(xml).find("SearchResults").attr('numberOfRecordsMatched');
                                $scope.setPages();
                                newRequest = false;
                            }
                            
                            


                            $(xml).find("BriefRecord").each(function(i,record){

                                
                                //console.log($(record).find("title").html());
                                var item = {};
                                item.title = $(record).find("title").html();
                                item.type = $(record).find("type").html();
                                item.lowerCorner = $(record).find("LowerCorner").html();
                                item.upperCorner = $(record).find("UpperCorner").html();
                                $scope.curRecords.push(item);
                                //$("#records").append("<tr><td>" + i + "</td><td>" + $(record).find("title").html() + "</td>");
                                i++;
                              
                            });
                            $scope.$apply(function() {
                              //$scope.msgs = newMsgs;
                              console.log("updated scope");
                            });
                            console.log("curRecords: ");
                            console.log($scope.curRecords);

                            //alert($(xml).find("project")[0].attr("id"));
                        }
        });
    };
    */

    $scope.updateExtent = function(){
        extent.setExtent($scope.advancedSearch.getExtent());
    };



    $scope.clearExtent = function(){
        extent.setExtent(null);
        $scope.advancedSearch.extent.extent = $scope.defaultExtent;
    };

    $scope.mapTest = function(){
        console.log(extent);
        //extent.setActive(true);
        extent.setExtent([0,0,90,90]);
        //extent.setActive(false);

        extent.changed();
    };

    /* ===========================================================================================
     * open layers map
     */


     var polyCoords = [];
        var coords = "95.61,38.60 95.22,37.98 95.60,37.66 94.97,37.65".split(' ');

        for (var i in coords) {
          var c = coords[i].split(',');
          polyCoords.push(ol.proj.transform([parseFloat(c[0]), parseFloat(c[1])], 'EPSG:4326', 'EPSG:3857'));
        }

        var testCoords = [
            [0,0],
            [0,90],
            [90,90],
            [90,0],
            [0,0]
        ]

        var feature = new ol.Feature({
            geometry: new ol.geom.Polygon.fromExtent([0,0,90,90])
        })

        var layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [feature]
            })
        });






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

    var osmLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
          });
    var countriesLayer = new ol.layer.Vector({
            //source: feature
            source: vectorSource
          });

    var maps = [];

    function flipExtent(extent){
        return [extent[1], extent[0], extent[3], extent[2]];
    }

    function createPreviews(){
        for (var i = 0; i < $scope.curRecords.length; i++) {
            //console.log("this is a test: " + $scope.curRecords[i].extent);

            var feature = new ol.Feature({
            geometry: new ol.geom.Polygon.fromExtent(flipExtent($scope.curRecords[i].extent))
            });

            var selected_polygon_style = {
                strokeWidth: 5,
                strokeColor: '#f44336'
                // add more styling key/value pairs as your need
            };

             var stroke = new ol.style.Stroke({
               color: '#f44336',
               width: 2
             });

             var style = new ol.style.Style({
                stroke: stroke
             });
            //feature.style = selected_polygon_style;
            feature.setStyle(style);
            //console.log("feature: ");
            //console.log(feature);

            var layer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [feature]
                })
            });


            

            maps[i] = new ol.Map({
                size: [250,125],
                layers: [osmLayer, layer],
                target: $scope.curRecords[i].mapID,
                view: new ol.View({
                  center: [0, 0],
                  projection: 'EPSG:4326',
                  zoom: 0,


                }),
                controls: []
              });

            maps[i].getView().fit([-90, -180, 90, 180]);

            //console.log(maps[i].getSize());


        
        }
    }



      var map = new ol.Map({
        layers: [osmLayer, countriesLayer],
        target: 'adv-search-map',
        view: new ol.View({
          center: [0, 0],
          projection: 'EPSG:4326',
          zoom: 1,
          minZoom: 1,
        })
      });

      var extent = new ol.interaction.Extent({
        condition: ol.events.condition.platformModifierKeyOnly
      });
      map.addInteraction(extent);
      extent.setActive(false);

      //Enable interaction by holding shift
      document.addEventListener('keydown', function(event) {
        if (event.keyCode == 16) {
          extent.setActive(true);
        }
      });
      document.addEventListener('keyup', function(event) {
        if (event.keyCode == 16) {
          extent.setActive(false);
        }
        //$scope.advancedSearch.extent.extent = [0,0,0,0];
        $scope.advancedSearch.setExtent( extent.getExtent() );
        //console.log(extent.extent_);
        $scope.$apply();
      });

      //setTimeout( function() { map.setTarget('adv-search-map'); console.log("target called"); map.updateSize}, 9000);


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

/*
<form class="form-inline">
            <div class="form-group"> 
              <select class="form-control" ng-model="filters[0].type" ng-options="f.label for f in filterTypes track by f.id">
                
              </select>  
              <input class="form-control" id="exampleInputName2" placeholder="Search" ng-model="filters[0].term">  
            </div>
            <p><button type="submit" class="btn btn-default" ng-click="submitSearch()">Search</button> </p>
          </form>
          */















