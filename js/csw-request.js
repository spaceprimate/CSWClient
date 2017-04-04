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
        {id: "extent", label: "Bounding Box"},
        {id: "test", label: "test"}
    ];
//types of constraints to apply to search terms
csw.filter.prototype.constraints = [
        {id: "PropertyIsLike", label: "Property Is Like"},
        {id: "PropertyIsNotEqualTo", label: "Property Is Not Equal To"}
    ];
//constraints on bbox queries
csw.filter.prototype.extentConstraints = [
        {id: "Envelope", label: "Contains"},
        {id: "test", label: "test"}
    ];

/**
 * Search constructor
 * contains array of filters to be applied to search
 *
 * Initialized with 1 filter
 */
csw.search = function(){
    this.filters = [];

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
        this.filters[this.findExtentIndex()].extent = extent;
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

                    for (var i = 0; i < this.filters.length; i++) {
                        request += csw.getFilterXml(this.filters[i]);
                    }
                                        
                request +=          '</ogc:And>' + 
                                '</ogc:Filter>' +
                            '</csw:Constraint>';
            }


        request +=      '</csw:Query>' +
                    '</csw:GetRecords>';
        console.log(request);
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
    var xml =          '<ogc:BBOX>' + 
                      '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
                      '<gml:Envelope>' + 
                        '<gml:lowerCorner>' + filter.extent[0] + ' ' + filter.extent[1] + '</gml:lowerCorner>' + 
                        '<gml:upperCorner>' + filter.extent[2] + ' ' + filter.extent[3] + '</gml:upperCorner>' + 
                      '</gml:Envelope>' + 
                    '</ogc:BBOX>';
    return xml;
}

/**
 * @param {csw.filter} 
 * @return XML string
 */
csw.getTitleXml = function(filter){
    var termPrefix, termSuffix, matchCase;
    if (filter.constraint.id == "PropertyIsLike"){
        termPrefix = "%";
        termSuffix = "%";
        matchCase = "false";
    }

    var xml =   '<ogc:'+ filter.constraint.id +' matchCase="'+ matchCase +'" wildCard="%" singleChar="_" escapeChar="\">' +
                '<ogc:PropertyName>dc:' + filter.type.id + '</ogc:PropertyName>' +
                '<ogc:Literal>' + termPrefix + filter.term + termSuffix + '</ogc:Literal>' +
            '</ogc:PropertyIsLike>';
    return xml;
};
