


// Site Module- instatiated above
var nrlCatalog = angular.module('nrlCatalog', [ ]);
//var app = angular.module('store', [ ]);

/*
 * main controller
 * $routeProvider allows us to add page specific controllers if needed in the future
 */
nrlCatalog.controller('mainController', ['$scope', '$http', function($scope, $http) {

    //$scope.test = "wotcha, harry";
    $scope.curPage = 1;
    var newRequest = true;
    $scope.curRecords= [];
    $scope.pages = [];
    $scope.totalRecords = 0;
    $scope.recordsPerPage = 10;
    $scope.totalPages;
    $scope.pageLimits = [];

    $scope.useAdvancedSearch = false;

    var curFilter = "none";

    
    $scope.filterTypes = [
        {id: "title", label: "Title"},
        {id: "boundingbox", label: "Bounding Box"}
    ];
    $scope.filterConstraints = [
        "contains", "begins with", "exactly matches", "does not contain"
    ];
    $scope.basicSearch = [{
        id : "main",
        type : {id: "title", label: "Title"},
        term: "",
        bbox: []
    }];

    $scope.advancedSearch = [];

    //filter from main search box
    $scope.advancedSearch.push({
        id : "main",
        type : $scope.filterTypes[0],
        constraint : $scope.filterConstraints[0],
        term: "",
        active: false
    });
    //none, basic, advanced
    //$scope.filtersStatus = "none";

    function clearFilters(){
        for (var i = $scope.filters.length - 1; i >= 0; i--) {
            $scope.filters.pop();
            //$scope.filtersStatus = "none";
        }
    }

    $scope.submitSearch = function(){
        curFilter = "basic";
        //$scope.filtersStatus = true;
        $scope.getFirstPage();
    }

    $scope.submitAdvancedSearch = function(){
        curFilter = "advanced";
        //$scope.filtersStatus = true;
        $scope.getFirstPage();
    }

    
    $scope.addAdvancedFilter = function(){
        var filter = {};
        //filter.id = id;
        filter.type = $scope.filterTypes[0];
        filter.constraint = $scope.filterConstraints[0];
        filter.term = "";
        $scope.advancedSearch.push(filter);
    }
    

    $scope.testApp = function(){
        console.log("main filter type and term: ");
        console.log($scope.mainFilter.type);
        console.log($scope.mainFilter.term);
    }

    $scope.setPages = function(){
        $scope.totalPages = Math.ceil($scope.totalRecords / $scope.recordsPerPage);
        $scope.pages = [];
        for (var i = 0; i < $scope.totalPages; i++) {
            $scope.pages.push(i+1);
        }
    }

    $scope.updatePages = function(){
        //$scope.curPage = 1;
        $scope.setPages();
        $scope.goToPage(1);
        //setCurPage(1);
    }

    function setCurPage(curPage){
        $scope.curPage = curPage;
        $scope.pageLimits[1] = Math.ceil(curPage / 10) * 10;
        $scope.pageLimits[0] = $scope.pageLimits[1] - 10;
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
        var recordRequest = createRequest($scope.curPage);   
        $scope.requestRecords(recordRequest);
    }
    function createRequest(page){
        var recordNumber = (page - 1) * $scope.recordsPerPage + 1;
        var request =   '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" service="CSW" version="2.0.2" resultType="results" startPosition="' + recordNumber + '" maxRecords="' + $scope.recordsPerPage + '" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:gml="http://www.opengis.net/gml">' +
                          '<csw:Query typeNames="csw:Record">' +
                            '<csw:ElementSetName>brief</csw:ElementSetName>';

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

                if ($scope.basicSearch[0].type.id == 'title'){
                    request += '<ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">' +
                                    '<ogc:PropertyName>dc:' + $scope.basicSearch[0].type.id + '</ogc:PropertyName>' +
                                    '<ogc:Literal>%' + $scope.basicSearch[0].term + '%</ogc:Literal>' +
                                '</ogc:PropertyIsLike>';
                }

                else if ($scope.basicSearch[0].type.id == 'boundingbox'){
                    request += '<ogc:BBOX>' + 
                                      '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
                                      '<gml:Envelope>' + 
                                        '<gml:lowerCorner>' + $scope.basicSearch[0].bbox[0] + ' ' + $scope.basicSearch[0].bbox[1] + '</gml:lowerCorner>' + 
                                        '<gml:upperCorner>' + $scope.basicSearch[0].bbox[0] + ' ' + $scope.basicSearch[0].bbox[1] + '</gml:upperCorner>' + 
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
                                      '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
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


/*


'<ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">' +
                                            '<ogc:PropertyName>dc:' + $scope.basicSearch[0].type.id + '</ogc:PropertyName>' +
                                            '<ogc:Literal>%marble%</ogc:Literal>' +
                                        '</ogc:PropertyIsLike>' +



                                        '<ogc:BBOX>' + 
                                            '<ogc:PropertyName>BoundingBox</ogc:PropertyName>' + 
                                            '<gml:Envelope>' + 
                                                '<gml:lowerCorner>47 -5</gml:lowerCorner>' + 
                                                '<gml:upperCorner>55 20</gml:upperCorner>' + 
                                            '</gml:Envelope>' + 
                                        '</ogc:BBOX>' + 
                                        */
        

    $scope.getFirstPage = function(){
        curPage = 1;
        $scope.pageLimits = [0, 10];
        newRequest = true;
        var recordRequest = createRequest(curPage);   
        $scope.requestRecords(recordRequest);
    };

    $scope.getNextPage = function(){

        setCurPage($scope.curPage + 1);
        //curPage ++;
        var recordRequest = createRequest($scope.curPage);
        $scope.requestRecords(recordRequest);
    };

    $scope.getPrevPage = function(){
        setCurPage($scope.curPage - 1);
        //curPage --;
        var recordRequest = createRequest($scope.curPage);
        $scope.requestRecords(recordRequest);
    };

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
                            var i = 1;

                            if (newRequest == true){
                                $scope.totalRecords = $(xml).find("SearchResults").attr('numberOfRecordsMatched');
                                $scope.setPages();
                                newRequest = false;
                            }
                            
                            


                            $(xml).find("BriefRecord").each(function(i,record){

                                
                                console.log($(record).find("title").html());
                                var item = {};
                                item.title = $(record).find("title").html();
                                item.type = $(record).find("type").html();
                                item.lowerCorner = $(record).find("LowerCorner").html();
                                item.upperCorner = $(record).find("UpperCorner").html();
                                $scope.curRecords.push(item);
                                //$("#records").append("<tr><td>" + i + "</td><td>" + $(record).find("title").html() + "</td>");
                                i++;
                              
                            });

                            console.log($scope.curRecords);


        },
            function(response){console.log(response)});
        
    };


    //old request using jquery and manual scope update
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
                                $scope.totalRecords = $(xml).find("SearchResults").attr('numberOfRecordsMatched');
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

    //init
    $scope.getFirstPage();
    




}]);






nrlCatalog.directive('advancedSearch', function() {
    return{
        restrict: 'E',
        template:   'wotcha, harry!',
    }
    
});

nrlCatalog.directive('headerTemplate', function() {
    return{
        restrict: 'E',
        templateUrl:   'templates/header.html',
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















