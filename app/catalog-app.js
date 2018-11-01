/*
 * App for interfacing with CSW services to browse and seach records
 * - note: This app uses POST XML to request CSW records, requiring the CSW to allow CORS for the client domain
 */

// Site Module
var nrlCatalog = angular.module('nrlCatalog', [ 'ngAnimate' ]);

// init extenty- handles extent thumbnails
var extentThumbnail = new extenty();

nrlCatalog.config(function($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
});

/*
 * main controller
 * injects $scope and $http ( for post requests )
 */
nrlCatalog.controller('mainController', ['$scope', '$http', function($scope, $http) {

    //CSW Endpoint
    // var cswUrl = "https://data.noaa.gov/csw?service=CSW&version=2.0.2";
    // var cswUrl = "https://www.sciencebase.gov/catalog/item/4f554236e4b018de15819c85/csw?service=CSW&version=2.0.2";
    
    var cswUrl = "https://nrlgeoint.cs.uno.edu/pycsw?service=CSW&version=2.0.2";

    //if true, app knows to rebuild $scope.pages object, called during http request
    $scope.newRequest = true;

    //after post request, records objects are created and pushed here
    $scope.curRecords= [];

    $scope.curUrl = cswUrl;

    $scope.showSearch = false;

    //optional- can hold arrays of all existing entries for specific CSW properties (eg. 'subject')
    $scope.domain = {};

    // Welcome screen, displayed until initial request is submitted
    $scope.startScreen = true;

    //used in view to display loading icon
    $scope.loadingData = false;

    // True if results are returned. False if no results or error
    $scope.hasData = false; 

    // If records request returns an error
    $scope.hasError = false;
    $scope.errorMessage = '';

    $scope.search = new csw.search();


    //create options for sort dropdown
    $scope.sortOptions = [
        {id: "dc:title", order: "ASC", label: "Title - Ascending"},
        {id: "dc:title", order: "DESC", label: "Title - Descending"}
    ];
    $scope.sortOption = $scope.sortOptions[0];

    $scope.displaySearch = function(){
        $scope.showSearch = true;
        // $location.hash('body');
        // $anchorScroll(); //scroll to top
    };

    $scope.hideSearch = function(){
        $scope.showSearch = false;

    };

    /**
     * Toggles the advanced search view
     * Does nothing if it's already showing or, if it's displaying basic search mode. 
     */
    $scope.searchBarToggle = function(){
        if(!$scope.showSearch){
            $scope.displaySearch();
        }
        else{
            $scope.hideSearch();
        }
    }

    $scope.loadWelcome = function(){
        $scope.startScreen = true;
        $scope.hasError = false;
        $scope.hasData = false;
    }

    $scope.welcomeScreenInput = "";

    $scope.welcomeScreenSearchSubmit = function(){
        $scope.search.clearAll();
        $scope.addFilter('AnyText', $scope.welcomeScreenInput);
        $scope.submitSearch();
    }
    
    /**
     * Sets $scope.curSearch value and calls method to retrieve the first set of pages
     * 
     * @param {string}  either"basicSearch" or "advancedSearch". if param is ommited, "basicSearch" is used
     */
    $scope.submitSearch = function(){
        $scope.showSearch = false;
        if ($scope.search.filters.length >= 1){
            $scope.getFirstPage();
        }
        else{
            console.log("please add a filter");
            $scope.addFilter('title', '');
            $scope.getFirstPage();
        }
        
    };

    /**
     * Calls an empty search in order to display all available records
     */
    $scope.viewAllRecords = function(){
        $scope.search.filters[0].term = "";
        $scope.submitSearch();
    }

    /**
     * Converts coordinates from corner formatted strings "20, 30" to extent array
     * @param{String} lowerCorner
     * @param{String} upperCorner
     * @return{[]} getExtentFromCorners
     */
    function getExtentFromCorners(lowerCorner, upperCorner){
        if (lowerCorner == undefined || upperCorner == undefined){
            return [null, null, null, null];
        }
        lc = lowerCorner.split(" ");
        uc = upperCorner.split(" ");
        return lc.concat(uc);
    }

    /**
     * Get possible values for meta-data fields, Dublin core formatted
     * makes an ajax POST GetDomain request to CSW server
     * @param {string} - name of property
     * @param {method} - optional method to further process values (remove dupes or extraneous data)
     *                      needed to handle idiosycrasies bewteen CSWs and metadata format and volume
     */
    function requestDomain(property, filter){
        var query =   '<csw:GetDomain xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" version="2.0.2" service="CSW">' +
                                '<csw:PropertyName>dc:' + property + '</csw:PropertyName>' +                            
                            '</csw:GetDomain>';
        $http({
            url: cswUrl,
            method: "POST",
            data: query,
            headers: {
                'Accept': 'application/xml',
            }
        })
        .then(function(response){
            $scope.curRecords = [];   

            // X2JS converts returned xml data into JSON
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);

            
            if(jsonData.ExceptionReport){ // If server returns an exception
                $scope.hasError = true;
                $scope.errorMessage = "The CSW server returned an error: " + jsonData.ExceptionReport.Exception.ExceptionText.toString();
                console.log("Error: ");
                console.log(jsonData.ExceptionReport);
            }
            else  { // success!
                if(filter){
                    updateDomain(property, jsonData.GetDomainResponse.DomainValues.ListOfValues.Value, filter);
                }
                else{
                    updateDomain(property, jsonData.GetDomainResponse.DomainValues.ListOfValues.Value);
                }
            }
        },
        function(response){ // error
            $scope.hasData = false;
            $scope.loadingData = false;
            $scope.hasError = true;
            $scope.errorMessage = "The CSW server returned an error."
            console.log("Request Error, response follows: ");
            console.log(response);
        });
    }

    /**
     * Adds a new type to the $scope.domain, and populates it with all possible values in the catalog
     * called once a AJAX GetDomain request has completed.
     * @param {string} - type id
     * @param {[]} - array of 
     * @param {method} - optional method to further process values (remove dupes or extraneous data)
     */
    updateDomain = function(type, values, filter){
        $scope.domain[type] = {};
        $scope.domain[type].values = [];
        values.forEach(function(v){
            if ( !domainHasProperty(type, v.toString()) ){
                $scope.domain[type].values.push( 
                    {
                        id: v.toString(),
                        active: false
                    }
                    
                );
            }
        });
        
        if (filter){
            filter();
        }
    }

    domainHasProperty = function(type, property){
        var found = false;
        for(var i = 0; i < $scope.domain[type].values.length; i++) {
            if ($scope.domain[type].values[i].id == type) {
                found = true;
                break;
            }
        }
        return found;
    };

    /**
     * Adds a filter of to $scope.searches.advancedSearch
     * @param {string} - type to filter for
     * @param {string}
     * @param {string} - optional
     */
    addFilter = function(id, term, constraint){
        var filter = {
            id: id,
            term: term
        }
        if (constraint){
            filter.constraint = constraint;
        }
        $scope.search.addFilter(filter);
    };

    $scope.addFilter = addFilter;




    /**
     * updates search filter with new constraint 
     * based on domain meta-data
     * set's current value for meta-data type via $scope.domain
     * @param {string} - type: type to filter for
     * @param {string} - term: term 
     * @param {string} - multiSelect: optional, if true, other filters of this type will not be cleared
     *                 - this allows for the selection of multiple keywords of the same type ('subject')
     * @param {string} - constraint: optional. This isn't used, not sure why it's included. 
     */
    $scope.refineSearch = function(type, term, multiSelect, constraint){
        if (!multiSelect){
            $scope.clearFilterType(type);
        }
        if ($scope.domain[type].values.find(function(e){return e.id == term}).active){
            $scope.domain[type].values.find(function(e){return e.id == term}).active = false;
            $scope.search.removeFilterTypeId(type, term);
            $scope.submitSearch(); 
        }
        else{
            addFilter(type,term,constraint);
            $scope.domain[type].values.find(function(e){return e.id == term}).active = true;
            $scope.submitSearch(); 
        }
    }


    $scope.toggleExtentFilter = function(){
        $scope.displaySearch();
        addFilter('extent','');
        $scope.extentStatus($scope.search.filters[$scope.search.filters.length - 1]);
    }

    /**
     * removes all filters of a given type from the current search
     */
    $scope.clearFilterType = function(type){
        $scope.search.removeFilterType(type);
        //$scope.submitSearch($scope.curSearch);
        $scope.domain[type].values.forEach(function(e) {
            e.active = false;
        });
    };

    /**
     * checks to see if filter type exists for current search
     */

     $scope.hasFilterType = function(type){
         return $scope.search.hasFilterType(type);
     }

    /**
     * opens the advanced search section. If current search is basic, values are copies over
     */
    $scope.refineSearchToggle = function(){
        $scope.displaySearch();
    };


    function keywordFilter(){
        var keywords = {};
        $scope.domain.subject.values.forEach(function(v){
            var vArr = v.id.toString().split(',');
            vArr.forEach(function(keyword){
                if (keyword.indexOf("CLASSIFICATION//RELEASABILITY = UNCLASSIFIED") == 0 ){
                    keyword = "UNCLASSIFIED";
                }
                if (keywords[keyword]){
                    keywords[keyword].count++;
                }
                else{
                    if ( keyword.indexOf("Layer Update Time") != 0 &&  keyword.indexOf("[object Object]") != 0 ){
                        keywords[keyword] = {
                            id: keyword,
                            count: 1,
                            active: false
                        }
                    }
                }
            });
        });

        $scope.domain.subject.values = Object.values(keywords);

    } 

    /**
     * Makes angular http POST request to CSW Server
     * iterates through results, creating and pushing record objects to $scope.curRecords
     *
     * @param {String} recordRequest - string containing xml for request
     */
    // check here: http://stackoverflow.com/questions/21455045/angularjs-http-cors-and-http-authentication
    $scope.requestRecords = function(recordRequest){
        $scope.hasError = false;
        $scope.startScreen = false;
        $scope.hasData = false;
        $scope.loadingData = true;

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
            //var totalRecords = getSafe(() => jsonData.GetRecordsResponse.SearchResults._numberOfRecordsMatched );
            var totalRecords = getSafe(function(){return jsonData.GetRecordsResponse.SearchResults._numberOfRecordsMatched });

            //If server returns an exception
            if(jsonData.ExceptionReport){
                $scope.loadingData = false;
                $scope.hasError = true;
                $scope.errorMessage = "The CSW server returned an error: " + jsonData.ExceptionReport.Exception.ExceptionText.toString();
                console.log("Error: ");
                console.log(jsonData.ExceptionReport);
            }

            // 0 records returned
            else if(totalRecords == 0 || totalRecords == undefined ){
                $scope.loadingData = false;
                console.log("no records found");
            }

            // 1 or more records returned
            else  {
                addRecords(jsonData.GetRecordsResponse.SearchResults);
            }

        },
        function(response){
            $scope.hasData = false;
            $scope.loadingData = false;
            $scope.hasError = true;
            $scope.errorMessage = "The CSW server returned an error."
            //error
            console.log("Request Error, response follows: ");
            console.log(response);
        });
    };

    /**
     * takes JSONified record data returned from CSW server request and 
     * pushes records to $scope.curRecords array
     * @param {JSON} records 
     */
    function addRecords(records){

        var i = 1;
        var totalRecords = getSafe(function(){ return records._numberOfRecordsMatched } );

        //if this is a new requeset, update pagination
        if ($scope.newRequest == true && totalRecords >= 0){
            $scope.pages.totalRecords = totalRecords;
            $scope.setPages();
            $scope.newRequest = false;
        }

        // If there's only 1 record, it won't be in an array, so
        //replace Record object with an array so the following forEach will work
        if ( !Array.isArray(records.Record) ){
        // if ( totalRecords == 1 ){
            var tmp = records.Record;
            records.Record = [tmp];
        }

        records.Record.forEach(function(e, i) {
            var item = {};
            item.title = getSafe(function(){ return  e.title.toString() });
            item.keywords = [];
            if ( Array.isArray(e.subject) ){
                e.subject.forEach(function(el){
                    item.keywords.push(el.toString());
                });
            }
            item.abstract = getSafe( function(){ return e.abstract.toString() });
            if (item.abstract ==  "[object Object]"){item.abstract = "";}
            item.type = getSafe( function(){ return  e.type.toString() });
            item.lowerCorner = getSafe( function(){ return  e.BoundingBox.LowerCorner.toString() });
            item.upperCorner = getSafe( function(){ return e.BoundingBox.UpperCorner.toString() });
            item.extent = getExtentFromCorners(item.lowerCorner, item.upperCorner);

            item.info = [];
            if ( getSafe( function(){ return e.date.toString()        }) != undefined ){ item.info.push(["Date", e.date.toString()]);}
            if ( getSafe( function(){ return e.modified.toString()    }) != undefined ){ item.info.push(["Modified", e.modified.toString()]);}
            if ( getSafe( function(){ return e.source.toString()      }) != undefined ){ item.info.push(["Source", e.source.toString()]);}
            if ( getSafe( function(){ return e.references.toString()  }) != undefined ){ item.info.push(["References", e.references.toString()]);}
            if ( getSafe( function(){ return e.type.toString()        }) != undefined ){ item.info.push(["Type", e.type.toString()]);}
            if ( getSafe( function(){ return e.language.toString()    }) != undefined ){ item.info.push(["Language", e.language.toString()]);}
            if ( getSafe( function(){ return e.rights.toString()      }) != undefined ){ item.info.push(["Rights", e.rights.toString()]);}
            if ( getSafe( function(){ return e.format.toString()      }) != undefined ){ item.info.push(["Format", e.format.toString()]);}

            item.mapID = "map"+i;
            $scope.curRecords.push(item);
            i++;
        });
        $scope.hasData = true;
        $scope.loadingData = false;
    }

/* 
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


    // init - functions to call once on page load
    requestDomain('type');
    requestDomain('subject', keywordFilter);

}]); // end main directive

// Angular Directives --
nrlCatalog.directive('headerTemplate', function() {
    return{
        restrict: 'E',
        templateUrl:   'app/views/header.html',
    }
});

//displays welcome message
nrlCatalog.directive('welcome', function() {
    return{
        restrict: 'E',
        templateUrl:   'app/views/welcome.html',
    }
});

nrlCatalog.directive('recordTemplate', function() {
    return{
        restrict: 'A',
        templateUrl:   'app/views/record.html',
        controller: function($scope){
            $scope.viewAll = false;
            $scope.boxStyle = extentThumbnail.getBoxStyle($scope.flipExtent($scope.record.extent));
        }
    }
});

nrlCatalog.directive('sidebarTemplate', function() {
    return{
        restrict: 'E',
        templateUrl:   'app/views/sidebar.html',
        replace: true
    }
});


