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
csw.filter = function(){
    this.type = this.types[0];
    this.constraint = this.constraints[0];
    this.term = "";
    this.extent = [-180, -90, 180, 90];
    this.extentConstraint = this.extentConstraints[0];
};
//types of text that can be filtered for
csw.filter.prototype.types = [
        {id: "title", label: "Title"},
        {id: "AnyText", label: "Any"},
        {id: "abstract", label: "Abstract"},
        {id: "keyword", label: "Keyword"},
        {id: "extent", label: "Bounding Box"}
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
            if (this.filters[i].type.id == "extent"){
                extentTest = true;
            }
        }
        this.hasExtent = extentTest;
    };

    //returns index of extent filter
    this.findExtentIndex = function(){
        for (var i = 0; i < this.filters.length; i++) {
            if (this.filters[i].type.id == "extent"){
                return i;
            }
        }
        return null;
    };

    //sets extent values for extent filter
    this.setExtent = function(extent){
        var index = this.findExtentIndex();
        if (index != null){
            this.filters[this.findExtentIndex()].extent = extent;
        }
    };

    //returns value of extent filter
    this.getExtent = function(){
        return this.filters[this.findExtentIndex()].extent;
    };

    //pushes new filter object into filters array
    this.addFilter = function(){
        this.filters.push(new csw.filter());
    };

    //removes filter at index
    this.removeFilter = function(index){
        this.filters.splice(index, 1);
        this.setHasExtent();
    };

    //resets search to initial value (1 filter with default values)
    this.clear = function(){
        this.filters = [];
        this.filters[0] = new csw.filter();
        this.setHasExtent();
    }

    //initialize with 1 filter
    this.filters[0] = new csw.filter();
}

/**
 * Creates XML string used in CSW POST requests * Useful when underlying map service has labels.
 *
 * @param {pages} pages object with curPage, recordsPerPage, and other data from view
 * @return XML string
 */
csw.search.prototype.createRequest = function(pages){
        var recordNumber = (pages.curPage - 1) * pages.recordsPerPage + 1;
        var request =   '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" service="CSW" version="2.0.2" resultType="results" startPosition="' + recordNumber + '" maxRecords="' + pages.recordsPerPage + '" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:gml="http://www.opengis.net/gml">' +
                          '<csw:Query typeNames="csw:Record">' +
                            '<csw:ElementSetName>full</csw:ElementSetName>';


        
            if (this.filters == 0){
                console.log("filters was 0");
                request +=  '<csw:Constraint version="1.1.0">' +
                                '<ogc:Filter>' + 
                                    '<ogc:PropertyIsNotEqualTo>' +
                                        '<ogc:PropertyName>dc:type</ogc:PropertyName>' +
                                        '<ogc:Literal>service</ogc:Literal>' +
                                    '</ogc:PropertyIsNotEqualTo>' + 
                                '</ogc:Filter>' +
                            '</csw:Constraint>';
            }
            else {
                request +=  '<csw:Constraint version="1.1.0">' +
                                '<ogc:Filter>' + 
                                    '<ogc:And>' +
                                        '<ogc:PropertyIsNotEqualTo>' +
                                            '<ogc:PropertyName>dc:type</ogc:PropertyName>' +
                                            '<ogc:Literal>service</ogc:Literal>' +
                                        '</ogc:PropertyIsNotEqualTo>';
                        console.log(this.filters.length);
                    for (var i = 0; i < this.filters.length; i++) {
                        console.log(this.filters[i]);
                        request += csw.getFilterXml(this.filters[i]);
                    }
                                        
                request +=          '</ogc:And>' + 
                                '</ogc:Filter>' +
                            '</csw:Constraint>';
            }

            // request +=   '<ogc:SortBy>' +
            //             '<ogc:SortProperty>' +
            //             '<ogc:PropertyName>dc:title</ogc:PropertyName>' +
            //             '<ogc:SortOrder>ASC</ogc:SortOrder>' +
            //             '</ogc:SortProperty>' +
            //         '</ogc:SortBy>';


            // request +=   '<ogc:SortBy>' +
            //                 '<ogc:SortProperty>' +
            //                 '<ogc:PropertyName>'+ this.sortOption.id + '</ogc:PropertyName>' +
            //                 '<ogc:SortOrder>' + this.sortOption.order + '</ogc:SortOrder>' +
            //                 '</ogc:SortProperty>' +
            //             '</ogc:SortBy>';



        request +=      '</csw:Query>' +
                    '</csw:GetRecords>';
        //console.log(request);
        return request;
    }

/**
 * Determines which type of filter it's processing and returns result of appropriate method
 *
 * @param {csw.filter} 
 * @return XML string
 */
csw.getFilterXml = function(filter){
    if (filter.type.id == "title"){ return csw.getTitleXml(filter);}
    else if (filter.type.id == "extent"){ return csw.getBboxXml(filter);}
};

/**
 * @param {csw.filter} 
 * @return XML string
 */
csw.getBboxXml = function(filter){
    // var xml2 =          '<ogc:BBOX>' + 
    //                   '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
    //                   '<gml:Envelope>' + 
    //                     '<gml:lowerCorner>' + filter.extent[0] + ' ' + filter.extent[1] + '</gml:lowerCorner>' + 
    //                     '<gml:upperCorner>' + filter.extent[2] + ' ' + filter.extent[3] + '</gml:upperCorner>' + 
    //                   '</gml:Envelope>' + 
    //                 '</ogc:BBOX>';

    var xml = '<ogc:'+filter.extentConstraint.id+'>'+
                    '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>'+
                    '<gml:Envelope>'+
                        '<gml:lowerCorner>' + filter.extent[0] + ' ' + filter.extent[1] + '</gml:lowerCorner>'+
                        '<gml:upperCorner>' + filter.extent[2] + ' ' + filter.extent[3] + '</gml:upperCorner>'+
                    '</gml:Envelope>'+
                '</ogc:'+filter.extentConstraint.id+'>';


 var xml2 =          '<ogc:BBOX>' + 
                      '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
                      '<gml:Envelope>' + 
                        '<gml:lowerCorner>0 0</gml:lowerCorner>' + 
                        '<gml:upperCorner>90 90</gml:upperCorner>' + 
                      '</gml:Envelope>' + 
                    '</ogc:BBOX>';
    return xml;
    // return '';
}

/**
 * @param {csw.filter} 
 * @return XML string
 */
csw.getTitleXml = function(filter){
    var constraint, termPrefix, termSuffix, attributes;
    if (filter.constraint.id == "PropertyIsLike"){
        constraint = "PropertyIsLike";
        termPrefix = "%";
        termSuffix = "%";
        attributes = ' matchCase="false" wildCard="%" singleChar="_" escapeChar="\"';
    }
    else if (filter.constraint.id == "beginsWith"){
        constraint = "PropertyIsLike";
        termPrefix = "";
        termSuffix = "%";
        attributes = ' matchCase="false" wildCard="%" singleChar="_" escapeChar="\"';
    }
    else if (filter.constraint.id == "PropertyIsEqualTo"){
        constraint = "PropertyIsEqualTo";
        termPrefix = "";
        termSuffix = "";
        attributes = '';
    }
    else if (filter.constraint.id == "PropertyIsNotEqualTo"){
        constraint = "PropertyIsNotEqualTo";
        termPrefix = "";
        termSuffix = "";
        attributes = '';
    }

    var xml =   '<ogc:'+ constraint + attributes + '>' +
                    '<ogc:PropertyName>dc:' + filter.type.id + '</ogc:PropertyName>' +
                    '<ogc:Literal>' + termPrefix + filter.term + termSuffix + '</ogc:Literal>' +
                '</ogc:'+ constraint + '>';

    return xml;
};
