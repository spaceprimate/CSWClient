/*
 * Generates xml for a CSW request
 * csw module, contains filter and search objects as well as methods for building XML request string
 */
var csw = {};

//basic strings (components of request) may go here, although it might not be necessary
csw.components = {};

/**
 * Filters to be used in search query
 * Constructor sets all defaults- no need to pass anything
 *
 * Filters can be either text base or bbox based
 * Only 1 bbox filter is expected
 */
csw.filter = function(filter){
    this.type = this.types[0];
    this.extentyStyle = [];
    this.constraint = this.constraints[0];
    this.term = "";
    this.extent = [-180, -90, 180, 90];
    this.extentConstraint = this.extentConstraints[0];
    this.multiExtent = false; // if extent crosses the antimeridian
    if(filter){
        this.type = this.types.find(function(t){return filter.id === t.id});
        this.term = filter.term;
        if(filter.constraint){
            this.constraint = this.constraints.find(function(c){return filter.constraint === c.id});
        }
    }
};
// types of text that can be filtered for
// Dublin Core ID and corresponding term
csw.filter.prototype.types = [
        {id: "title", label: "Title", prefix: "dc:"},
        {id: "AnyText", label: "Any", prefix: "csw:"},
        {id: "abstract", label: "Abstract", prefix: "dct:"},
        {id: "subject", label: "Keyword", prefix: "dc:"},
        {id: "extent", label: "Bounding Box"},
        {id: "type", label: "type", prefix: "dc:"}
    ];
//types of constraints to apply to search terms
csw.filter.prototype.constraints = [
        {id: "PropertyIsLike", label: "contains"},
        {id: "beginsWith", label: "begins with"},
        {id: "PropertyIsEqualTo", label: "exactly matches"},
        {id: "PropertyIsNotEqualTo", label: "is not"}
    ];

//constraints on bbox queries
csw.filter.prototype.extentConstraints = [
        {id: "Contains", label: "Contains"},
        {id: "Within", label: "Within"},
        {id: "Intersects", label: "Intersects"}
    ];

/**
 * Search constructor
 * contains array of filters to be applied to search
 *
 * Initialized with 1 filter
 */
csw.search = function(){
    this.filters = [];

     //create options for sort dropdown
    this.sortOptions = [
        {id: "dc:title", order: "ASC", label: "Title - Ascending"},
        {id: "dc:title", order: "DESC", label: "Title - Descending"}
    ];
    this.sortOption = this.sortOptions[0];

    //only allow 1 extent filter at a time
    this.hasExtent = false;

    //iterates through filters array, if it finds a constraint, hasExtent is set to true
    this.setHasExtent = function(){
        var extentTest = false;
        for (var i = 0; i < this.filters.length; i++) {
            if (this.filters[i].type.id === "extent"){
                extentTest = true;
            }
        }
        this.hasExtent = extentTest;
    };

    //returns index of extent filter
    this.findExtentIndex = function(){
        for (var i = 0; i < this.filters.length; i++) {
            if (this.filters[i].type.id === "extent"){
                return i;
            }
        }
        return null;
    };

    //sets extent values for extent filter
    this.setExtent = function(extent){
        var index = this.findExtentIndex();
        if (index != null){
            this.filters[index].extent = extent;
        }
    };

    //returns value of extent filter
    this.getExtent = function(){
        return this.filters[this.findExtentIndex()].extent;
    };


    /**
     * forwards to appropriate addFilter function
     * if parameter is empty, and new filter needs to be instantiated
     *
     * @param f - already instantiated filter to add to filters array
     */
    this.addFilter = function(f){
        if(f){
            this.filters.push( new csw.filter(f) );
        }
        else{
            this.filters.push( new csw.filter() );
        }
    };


    /**
     * removes filter at index
     * @param index
     */
    this.removeFilter = function(index){
        this.filters.splice(index, 1);
        this.setHasExtent();
    };

    //removes filters of a given type
    this.removeFilterType = function(type){
        var index = this.filters.length - 1;
        while (index >= 0) {
            if (this.filters[index].type.id === type) {
                this.removeFilter(index);
            }
            index--;
        }
    };


    //removes filters of a given type and term
    this.removeFilterTypeId = function(type, term){
        var index = this.filters.length - 1;
        while (index >= 0) {
            if (this.filters[index].type.id === type && this.filters[index].term === term) {
                this.removeFilter(index);
            }
            index--;
        }
    };


    //removes filters of a given type
    this.hasFilterType = function(type){
        var hasFilter = false;
        this.filters.forEach(function(f){
            if (f.type.id === type){
                hasFilter = true;
            }
        });
        return hasFilter;
    };

    // gets the current filters for this search
    this.getFilters = function(){
        return this.filters;
    };

    this.setFilters = function(filters){
        this.filters = filters;
    };

    //resets search to initial value (1 filter with default values)
    this.clear = function(){
        this.filters = [];
        this.filters[0] = new csw.filter();
        this.setHasExtent();
    };

    //completely clears search (zero filters)
    this.clearAll = function(){
        this.filters = [];
        this.setHasExtent();
    };

    //initialize with 1 filter
    this.filters[0] = new csw.filter();
};

/**
 * Creates XML string used in CSW POST requests * Useful when underlying map service has labels.
 *
 * @param {pages} pages object with curPage, recordsPerPage, and other data from view
 * @return XML string
 */
csw.search.prototype.createRequest = function(pages){
    
    var recordNumber = (pages.curPage - 1) * pages.recordsPerPage.value + 1;
    var request =   '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" service="CSW" version="2.0.2" resultType="results" startPosition="' + recordNumber + '" maxRecords="' + pages.recordsPerPage.value + '" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:gml="http://www.opengis.net/gml">' +
                        '<csw:Query typeNames="csw:Record">' +
                        '<csw:ElementSetName>full</csw:ElementSetName>';
        if (this.filters.length < 2 && !this.filters[0].multiExtent){
            request +=  '<csw:Constraint version="1.1.0">' +
                            '<ogc:Filter>'; 
                                for (var i = 0; i < this.filters.length; i++) {
                                    request += csw.getFilterXml(this.filters[i]);
                                }
            request +=      '</ogc:Filter>' +
                        '</csw:Constraint>';
        }
        else {
            request +=  '<csw:Constraint version="1.1.0">' +
                            '<ogc:Filter>' + 
                                '<ogc:And>' +
                                    '<ogc:PropertyIsNotEqualTo>' +
                                        '<ogc:PropertyName>dc:type</ogc:PropertyName>' +
                                        '<ogc:Literal>deleteThis</ogc:Literal>' +
                                    '</ogc:PropertyIsNotEqualTo>';
                for (var index = 0; index < this.filters.length; index++) {
                    request += csw.getFilterXml(this.filters[index]);
                }
            request +=          '</ogc:And>' + 
                            '</ogc:Filter>' +
                        '</csw:Constraint>';
        }
        request +=   '<ogc:SortBy>' +
                        '<ogc:SortProperty>' +
                        '<ogc:PropertyName>'+ this.sortOption.id + '</ogc:PropertyName>' +
                        '<ogc:SortOrder>' + this.sortOption.order + '</ogc:SortOrder>' +
                        '</ogc:SortProperty>' +
                    '</ogc:SortBy>';

        request +=      '</csw:Query>' +
                    '</csw:GetRecords>';
    // console.log(request);
    return request;
};


/**
 * Determines which type of filter it's processing and returns result of appropriate method
 * @param filter    - csw filter
 * @returns {*}     - xml string
 */
csw.getFilterXml = function(filter){
    if (filter.type.id !== "extent"){ return csw.getTermXml(filter);}
    else{ return csw.getBboxXml(filter); }
};


/**
 * builds xml string for bbox filters
 * Checks if a extent crosses the antimeridian (lat 180 or -180) and creates two bbox filters if necessary
 * @param filter        - csw.filter
 * @returns {string}
 */
csw.getBboxXml = function(filter){
    var extents = [];
    var xml;
    if (filter.multiExtent){
        extents = getOutOfBoundsExtents(filter.extent);
    }
    else {
        extents[0] = filter.extent;
    }

    xml =   '<ogc:'+filter.extentConstraint.id+'>'+
                '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>'+
                '<gml:Envelope>'+
                    '<gml:lowerCorner>' + extents[0][1] + ' ' + extents[0][0] + '</gml:lowerCorner>'+
                    '<gml:upperCorner>' + extents[0][3] + ' ' + extents[0][2] + '</gml:upperCorner>'+
                '</gml:Envelope>'+
            '</ogc:'+filter.extentConstraint.id+'>';

    if(filter.multiExtent){
        xml +=  '<ogc:'+filter.extentConstraint.id+'>'+
                    '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>'+
                    '<gml:Envelope>'+
                        '<gml:lowerCorner>' + extents[1][1] + ' ' + extents[1][0] + '</gml:lowerCorner>'+
                        '<gml:upperCorner>' + extents[1][3] + ' ' + extents[1][2] + '</gml:upperCorner>'+
                    '</gml:Envelope>'+
                '</ogc:'+filter.extentConstraint.id+'>';
    }

    return xml;
};


/**
 * Builds xml string for a given filter
 * @param filter        - csw filter
 * @returns {string}    - xml string
 */
csw.getTermXml = function(filter){
    var constraint, termPrefix, termSuffix, attributes;
    // if 'subject', it's a keyword search and we'll set it's constraint manually to keep the filter object simple
    if (filter.constraint.id === "PropertyIsLike" || (filter.type.id !== 'title' && filter.type.id !== 'abstract') ){
        constraint = "PropertyIsLike";
        termPrefix = "%";
        termSuffix = "%";
        attributes = ' matchCase="false" wildCard="%" singleChar="_" escapeChar="\"';
    }
    else if (filter.constraint.id === "beginsWith"){
        constraint = "PropertyIsLike";
        termPrefix = "";
        termSuffix = "%";
        attributes = ' matchCase="false" wildCard="%" singleChar="_" escapeChar="\"';
    }
    else if (filter.constraint.id === "PropertyIsEqualTo"){
        constraint = "PropertyIsEqualTo";
        termPrefix = "";
        termSuffix = "";
        attributes = '';
    }
    else if (filter.constraint.id === "PropertyIsNotEqualTo"){
        constraint = "PropertyIsNotEqualTo";
        termPrefix = "";
        termSuffix = "";
        attributes = '';
    }

    var xml =   '<ogc:'+ constraint + attributes + '>' +
                    '<ogc:PropertyName>'+ filter.type.prefix + filter.type.id + '</ogc:PropertyName>' +
                    '<ogc:Literal>' + termPrefix + filter.term + termSuffix + '</ogc:Literal>' +
                '</ogc:'+ constraint + '>';

    return xml;
};