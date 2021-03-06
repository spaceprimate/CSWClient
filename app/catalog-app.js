/*
 * App for interfacing with CSW services to browse and seach records
 * - note: This app uses POST XML to request CSW records, requiring the CSW to allow CORS for the client domain
 */

// Site Module
var nrlCatalog = angular.module('nrlCatalog', [ 'ngAnimate' ]);

// init Extenty- handles extent thumbnails
var extentThumbnail = new Extenty(100,100);

nrlCatalog.config(function($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
});

/*
 * main controller
 * injects $scope and $http ( for post requests )
 */
nrlCatalog.controller('mainController', ['$scope', '$http', '$window', function($scope, $http, $window) {

    //CSW Endpoint
    var cswUrl = "https://geoint.nrlssc.navy.mil/pycsw?service=CSW&version=2.0.2";

    //if true, app knows to rebuild $scope.pages object, called during http request
    $scope.newRequest = true;

    //after post request, records objects are created and pushed here
    $scope.curRecords= [];
    
    $scope.curUrl = cswUrl;

    $scope.showSearch = false;

    // optional- Holds arrays of all existing entries for specific CSW properties (eg. 'subject')
    // useful if you need to list all possible 'subject' or 'type' options for a given CSW source
    $scope.domain = {};

    // Welcome screen, displayed until initial request is submitted
    $scope.startScreen = true;

    //used in view to display loading icon
    $scope.loadingData = false;

    // True if results are returned. False if no results or error
    $scope.hasData = false;

    $scope.search = new csw.search(); // main search object

    //create options for sort dropdown
    $scope.sortOptions = [
        {id: "dc:title", order: "ASC", label: "Title - Ascending"},
        {id: "dc:title", order: "DESC", label: "Title - Descending"}
    ];
    $scope.sortOption = $scope.sortOptions[0];

    $scope.displaySearch = function(){
        $scope.showSearch = true;
    };

    $scope.hideSearch = function(){
        $scope.showSearch = false;
    };

    $scope.keywordsLoaded = false;
    $scope.keywordsLoadError = false;


    // set dynamically accessible width and height values for the browser window
    $scope.width = $window.innerWidth;
    $scope.height = $window.innerHeight;

    angular.element($window).bind('resize', function(){
        $scope.width = $window.innerWidth;
        $scope.height = $window.innerHeight;
        $scope.setAdvancedSearchStyle();
        $scope.$digest();
    });

    $scope.advancedSearchContentStyle = {'max-height' : ($scope.height - 58)};

    /**
     * Prevents the search dropdown from overflowing the browser window
     * Only required for desktop view, mobile is handled with pure css
     */
    $scope.setAdvancedSearchStyle = function(){
        $scope.advancedSearchContentStyle = {'max-height' : ($scope.height - 58)};
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
    };

    $scope.loadWelcome = function(){
        $scope.startScreen = true;
        $scope.hasData = false;
    };

    $scope.welcomeScreenInput = "";

    $scope.welcomeScreenSearchSubmit = function(){
        $scope.search.clearAll();
        $scope.addFilter('AnyText', $scope.welcomeScreenInput);
        $scope.submitSearch();
    };
    
    /**
     * Sets $scope.curSearch value and calls method to retrieve the first set of pages
     */
    $scope.submitSearch = function(){
        $scope.showSearch = false;
        refreshDomain();
        if ($scope.search.filters.length >= 1){
            $scope.getFirstPage();
        }
        else{
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
    };

    /**
     * Converts coordinates from corner formatted strings "20, 30" to extent array
     * @param{String} lowerCorner
     * @param{String} upperCorner
     * @return{[]} getExtentFromCorners
     */
    function getExtentFromCorners(lowerCorner, upperCorner){
        if (lowerCorner === undefined || upperCorner === undefined){
            return [null, null, null, null];
        }
        var lc = lowerCorner.split(" ");
        var uc = upperCorner.split(" ");
        return lc.concat(uc);
    }

    /**
     * Get possible values for meta-data fields, Dublin core formatted
     * makes an ajax POST GetDomain request to CSW server
     * @param property - name of property
     * @param filter - optional method to further process values (remove dupes or extraneous data)
     *                      needed to handle idiosyncrasies between CSWs and metadata format and volume
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
                'Accept': 'application/xml'
            }
        })
        .then(function(response){
            $scope.curRecords = [];   

            // X2JS converts returned xml data into JSON
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);

            if(jsonData.ExceptionReport){ // If server returns an exception
                $scope.openDialog("Keyword request exception", jsonData.ExceptionReport.Exception.ExceptionText.toString());
                console.log("Error: ");
                console.log(jsonData.ExceptionReport);
            }
            else  { // success!
                // TODO - keywords are specific to nrl use and this is a generic function. Create a callback to handle this behavior
                $scope.keywordsLoaded = true;
                $scope.keywordsLoadError = false;

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
            $scope.openDialog(response.status, response.statusText);
            console.log("Request Error, response follows: ");
            console.log(response);
        });
    }



    /**
     * Adds a new type to the $scope.domain, and populates it with all possible values in the catalog
     * called once a AJAX GetDomain request has completed.
     *
     * @param type      {string} - type id
     * @param values    {[]} - array of values
     * @param filter    {method} - optional method to further process values (remove dupes or extraneous data)
     */
    var updateDomain = function(type, values, filter){
        $scope.domain[type] = {};
        $scope.domain[type].values = [];
        values.forEach(function(v){
            if ( !domainHasProperty(type) ){
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
    };

    /**
     * Checks to see if domain contains a given property type
     * @param type - property-type to search
     * @returns {boolean}
     */
    var domainHasProperty = function(type){
        var found = false;
        for(var i = 0; i < $scope.domain[type].values.length; i++) {
            if ($scope.domain[type].values[i].id === type) {
                found = true;
                break;
            }
        }
        return found;
    };


    /**
     * Gets all the values of a given domain type and returns them as an array
     * @param type      - domain type (category) to add
     * @returns {Array} - values of the given type
     */
    $scope.getDomainValues = function(type){
        var values = [];
        if($scope.domain[type] !== undefined){
            $scope.domain[type].values.forEach(function(v){
                values.push(v.id);
            });
        }
        return values;
    };

    /**
     * resets all properties 'active' state to false
     * currently implemented for only 'subject' and 'type' types
     */
    function resetDomain(){
        if($scope.domain.subject !== undefined){
            $scope.domain.subject.values.forEach(function(e){
                e.active = false;
            });
        }
        if($scope.domain.type !== undefined){
            $scope.domain.type.values.forEach(function(e){
                e.active = false;
            });
        }
    }

    /**
     * Iterates through search filters. If filter type is 'type' or 'subject', 
     * set the corresponding element of the domain to 'active'
     */
    function refreshDomain(){
        resetDomain();
        $scope.search.filters.forEach(function(e){
            if (e.type.id === "subject" && $scope.domain.subject !== undefined){
                $scope.domain.subject.values.forEach(function(ee){
                    if(e.term === ee.id){
                        ee.active = true;
                    }
                });
            }
            else if (e.type.id === "type" && $scope.domain.type !== undefined){
                $scope.domain.type.values.forEach(function(ee){
                    if(e.term === ee.id){
                        ee.active = true;
                    }
                });
            }
        });
    }

    /**
     * searches domain for possible auto-complete terms
     * as user enters a term into a input field
     */
    $scope.autoComplete = function(f){
        if(f.term === ""){
            f.autoTerms = null;
        }
        else{
            var keywords = $scope.getDomainValues(f.type.id);
            var output=[];
            
            angular.forEach(keywords,function(val){
                if(val.toLowerCase().indexOf(f.term.toLowerCase())>=0){
                    output.push(val);
                }
            });
            f.autoTerms=output;
        }
    };

    /**
     * When user selects an auto-complete suggestion, this enters it into the 
     * filter term field and clears the auto-complete suggestion list (f.autoTerms)
     */
    $scope.fillAutoComplete = function(f, term){
        f.term = term;
        f.autoTerms = null;
    };


    /**
     * Adds a filter of to $scope.searches.advancedSearch
     * @param id    - id of type to filter for
     * @param term  - string to search for
     */
    var addFilter = function(id, term){
        var filter = {
            id: id,
            term: term
        };
        $scope.search.addFilter(filter);
    };

    $scope.addFilter = addFilter;

    /**
     * updates search filter with new constraint
     * based on domain meta-data
     * set's current value for meta-data type via $scope.domain
     * @param type          - {string} - type: type to filter for
     * @param term          - {string} - term: term
     * @param multiSelect   - {string} - multiSelect: optional, if true, other filters of this type will not be cleared
     *                       - this allows for the selection of multiple keywords of the same type ('subject')
     */
    $scope.refineSearch = function(type, term, multiSelect){
        
        if ($scope.domain[type].values.find(function(e){return e.id === term}).active){
            $scope.domain[type].values.find(function(e){return e.id === term}).active = false;
            $scope.search.removeFilterTypeId(type, term);
            $scope.submitSearch(); 
        }
        else{
            if (!multiSelect){
                $scope.clearFilterType(type);
            }
            addFilter(type,term);
            $scope.domain[type].values.find(function(e){return e.id === term}).active = true;
            $scope.submitSearch(); 
        }
    };


    /**
     * toggles the showSidebar boolean variable true/false
     */
    $scope.toggleSidebar = function(){
        $scope.showSidebar = !$scope.showSidebar;
    };



    $scope.toggleExtentFilter = function(){
        $scope.displaySearch();
        addFilter('extent','');
        $scope.extentStatus($scope.search.filters[$scope.search.filters.length - 1]);
    };

    /**
     * removes all filters of a given type from the current search
     */
    $scope.clearFilterType = function(type){
        $scope.search.removeFilterType(type);
        $scope.domain[type].values.forEach(function(e) {
            e.active = false;
        });
    };

    /**
     * checks to see if filter type exists for current search
     */

     $scope.hasFilterType = function(type){
         return $scope.search.hasFilterType(type);
     };

    /**
     * opens the advanced search section. If current search is basic, values are copies over
     */
    $scope.refineSearchToggle = function(){
        $scope.displaySearch();
    };

    /**
     * custom filter for keywords, specific to NRL CSW endpoint
     * shortens verbose keywords, removes duplicates, etc
     */
    function keywordFilter(){
        var keywords = {};
        $scope.domain.subject.values.forEach(function(v){
            var vArr = v.id.toString().split(',');


            // nrl specific filter, consolidates verbose keywords
            vArr.forEach(function(keyword){
                if (keyword.indexOf("CLASSIFICATION//RELEASABILITY = UNCLASSIFIED") === 0 ){
                    keyword = "UNCLASSIFIED";
                }
                if (keywords[keyword]){
                    keywords[keyword].count++;
                }
                else{
                    if ( keyword.indexOf("Layer Update Time") !== 0 &&  keyword.indexOf("[object Object]") !== 0 ){
                        keywords[keyword] = {
                            id: keyword,
                            count: 1,
                            active: false
                        }
                    }
                }
            });
        });

        $scope.domain.subject.values = [];

        for (var kw in keywords){
            $scope.domain.subject.values.push({id: keywords[kw].id, count: keywords[kw].count, active: keywords[kw].active});
        }
    } 


    /**
     * Makes angular http POST request to CSW Server
     * iterates through results, creating and pushing record objects to $scope.curRecords
     *
     * @param {String} recordRequest - string containing xml for request
     */
    $scope.requestRecords = function(recordRequest){
        $scope.startScreen = false;
        $scope.hasData = false;
        $scope.loadingData = true;

        $http({
            url: cswUrl,
            method: "POST",
            data: recordRequest,
            headers: {
                'Accept': 'application/xml'
            }
        })
        .then(function(response){
            // Request successful!
            $scope.curRecords = [];   

            // X2JS converts returned xml data into JSON
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);
            var totalRecords = parseInt(
                getSafe(function(){return jsonData.GetRecordsResponse.SearchResults._numberOfRecordsMatched })
            );

            //If server returns an exception
            if(jsonData.ExceptionReport){
                $scope.loadingData = false;
                $scope.openDialog("CSW server error", jsonData.ExceptionReport.Exception.ExceptionText.toString());
                console.log("Error: ");
                console.log(jsonData.ExceptionReport);
            }

            // 0 records returned
            else if(totalRecords === 0 || totalRecords === undefined ){
                $scope.loadingData = false;
            }

            // 1 or more records returned
            else  {
                addRecords(jsonData.GetRecordsResponse.SearchResults);
            }

        },
        function(response){
            $scope.hasData = false;
            $scope.loadingData = false;
            $scope.openDialog("Error: " + response.status, response.statusText);
            console.log("Request Error, response follows: ");
            console.log(response);
        });
    };


    /**
     * Requests a single record as xml
     *
     * @param r - {String} recordRequest - string containing xml from request
     */
    $scope.requestRecord = function(r){
        if (r.xml === undefined){ // only run once
            r.xml = "";
            var url = cswUrl + "&REQUEST=GetRecordById&service=CSW&version=2.0.2&elementSetName=full&id=" + r.identifier;
            $http({
                url: url,
                method: "GET",
                headers: {
                    'Accept': 'application/xml'
                }
            })
            .then(function(response){
                // Request successful!
                r.xml = vkbeautify.xml(response.data.toString(), 4);
                r.xmlLoaded = true;
            },
            function(response){
                r.xml = "The CSW server returned an error.";
                //error
                $scope.openDialog("Error: " + response.status, response.statusText);
                console.log("Request Error, response follows: ");
                console.log(response);
            });
        }
    };

    /**
     * takes JSONified record data returned from CSW server request and 
     * pushes records to $scope.curRecords array
     * @param {JSON} records 
     */
    function addRecords(records){

        var i = 1;
        var totalRecords = getSafe(function(){ return records._numberOfRecordsMatched } );

        //if this is a new request, update pagination
        if ($scope.newRequest === true && totalRecords >= 0){
            $scope.pages.totalRecords = totalRecords;
            $scope.setPages();
            $scope.newRequest = false;
        }

        // If there's only 1 record, it won't be in an array, so
        //replace Record object with an array so the following forEach will work
        if ( !Array.isArray(records.Record) ){
            var tmp = records.Record;
            records.Record = [tmp];
        }

        records.Record.forEach(function(e, i) { // element, index
            var item = {};
            item.hasThumbnail = false;
            item.title = getSafe(function(){ return  e.title.toString() });
            item.keywords = [];
            if ( Array.isArray(e.subject) ){
                e.subject.forEach(function(el){
                    item.keywords.push(el.toString());
                });
            }
            item.abstract = getSafe( function(){ return e.abstract.toString() });
            if (item.abstract ===  "[object Object]"){item.abstract = "";}
            item.type = getSafe( function(){ return  e.type.toString() });
            item.lowerCorner = getSafe( function(){ return  e.BoundingBox.LowerCorner.toString() });
            item.upperCorner = getSafe( function(){ return e.BoundingBox.UpperCorner.toString() });
            item.extent = getExtentFromCorners(item.lowerCorner, item.upperCorner);
            item.identifier = getSafe( function(){ return e.identifier.toString() });

            item.info = [];
            if ( getSafe( function(){ return e.date.toString()        }) !== undefined ){ item.info.push(["Date", e.date.toString()]);}
            if ( getSafe( function(){ return e.modified.toString()    }) !== undefined ){ item.info.push(["Modified", e.modified.toString()]);}
            if ( getSafe( function(){ return e.source.toString()      }) !== undefined ){ item.info.push(["Source", e.source.toString()]);}
            
            if ( getSafe( function(){ return e.type.toString()        }) !== undefined ){ item.info.push(["Type", e.type.toString()]);}
            if ( getSafe( function(){ return e.language.toString()    }) !== undefined ){ item.info.push(["Language", e.language.toString()]);}
            if ( getSafe( function(){ return e.rights.toString()      }) !== undefined ){ item.info.push(["Rights", e.rights.toString()]);}
            if ( getSafe( function(){ return e.format.toString()      }) !== undefined ){ item.info.push(["Format", e.format.toString()]);}

            if ( getSafe( function(){ return e.references.toString()  }) !== undefined ){ item.info.push(["References", e.references.toString()]);}

            // try to retrieve thumbnail
            // TODO prob a cleaner way to do this, getting pycsw to update ENCServer to enc/wms. etc would also be a good idea
            if ( getSafe( function(){ return e.references.toString()  }) !== undefined && Array.isArray(e.references)  ){
                e.references.forEach(function(ref){
                    if (ref['_scheme'] === "WWW:LINK-1.0-http--image-thumbnail"){
                        item.hasThumbnail = true;
                        item.thumbnail = decodeURIComponent(ref.toString());
                        // item.thumbnail.replace("ENCServer/wms/ENC/feature/individual/ENC/feature/", "enc/wms/ENC/feature/");

                        if (item.thumbnail.indexOf("ENCServer") >= 0){
                            item.thumbnail = item.thumbnail.replace("ENCServer/wms/ENC/feature/individual/ENC/feature/", "enc/wms/ENC/feature/");
                            console.log("old ENC Server path detected");
                        }
                    }
                })
            }

            item.mapID = "map"+i;
            $scope.curRecords.push(item);
            i++;
        });
        $scope.hasData = true;
        $scope.loadingData = false;
    }

/* 
* Init Openlayers elements
*/

    /**
     * Flips the long/lat values in an extent array
     * for use in building an OL polygon
     * @param extent    - {float Array(4)} extent
     * @returns {*[]}   - {float Array(4)} flipExtent
     */
    $scope.flipExtent = function(extent){
        return [extent[1], extent[0], extent[3], extent[2]];
    };

    // Styles for extent preview maps
    var mapStroke = new ol.style.Stroke({
        color: '#f44336',
        width: 2
    });
    $scope.mapStyle = new ol.style.Style({ stroke: mapStroke });

    // init - functions to call once on page load
    requestDomain('type');
    requestDomain('subject', keywordFilter);

}]);
// end main directive



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

nrlCatalog.directive('sidebarTemplate', function() {
    return{
        restrict: 'E',
        templateUrl:   'app/views/sidebar.html',
        replace: true,
        controller: function($scope){
            $scope.showSidebar = false;
        }
    }
});