/*
 * Generates xml for a CSW request
 */



var csw = {};

csw.request = function(filters){};
//basic strings go here
csw.components = {};

//filter constructor
csw.filter = function(){
    this.types = [
        {id: "title", label: "Title"},
        {id: "extent", label: "Bounding Box"},
        {id: "test", label: "test"}
    ];
    this.constraints = [
        {id: "PropertyIsLike", label: "Property Is Like"},
        {id: "PropertyIsNotEqualTo", label: "Property Is Not Equal To"}
    ];
    this.type = this.types[0];
    this.constraint = this.constraints[0];
    this.term = "";
    this.extent = [-180, -90, 180, 90];
    this.extentConstraints = [
        {id: "Envelope", label: "Contains"},
        {id: "test", label: "test"}
    ];
    this.extentConstraint = this.extentConstraints[0];
};

//filters constructor
csw.search = function(){
    this.filters = [];
    //only allow 1 extent filter at a time
    this.hasExtent = false;
    this.setHasExtent = function(){
        var extentTest = false;
        for (var i = 0; i < this.filters.length; i++) {
            if (this.filters[i].type.id == "extent"){
                extentTest = true;
            }
        }

        console.log("SET HAS EXTENT");

        this.hasExtent = extentTest;
    };

    
    this.findExtentIndex = function(){
        for (var i = 0; i < this.filters.length; i++) {
            if (this.filters[i].type.id == "extent"){
                return i;
            }
        }
        return null;
    };

    this.setExtent = function(extent){
        this.filters[this.findExtentIndex()].extent = extent;
    };
    this.getExtent = function(){
        return this.filters[this.findExtentIndex()].extent;
    };
    this.addFilter = function(){
        this.filters.push(new csw.filter());
    };
    this.removeFilter = function(index){
        this.filters.splice(index, 1);
        this.setHasExtent();
    };

    this.clear = function(){
        this.filters = [];
        this.filters[0] = new csw.filter();
        this.setHasExtent();
    }

    //initialize with 1 filter
    this.filters[0] = new csw.filter();
}





csw.search.prototype.createRequest = function(pages){
    console.log("prototype request made");
//function createRequest(page){
        console.log("filters: ");
        console.log(this.filters);

        //console.log(pages.curPage);
        //console.log(pages.recordsPerPage);



        var recordNumber = (pages.curPage - 1) * pages.recordsPerPage + 1;
        console.log("record number: ");
        console.log(recordNumber);
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

csw.getFilterXml = function(filter){

    if (filter.type.id == "title"){ return csw.getTitleXml(filter);}
    else if (filter.type.id == "extent"){ return csw.getBboxXml(filter);}

    
};

csw.getBboxXml = function(filter){
    
    var xml =          '<ogc:BBOX>' + 
                      '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
                      '<gml:Envelope>' + 
                        '<gml:lowerCorner>' + filter.extent[0] + ' ' + filter.extent[1] + '</gml:lowerCorner>' + 
                        '<gml:upperCorner>' + filter.extent[2] + ' ' + filter.extent[3] + '</gml:upperCorner>' + 
                      '</gml:Envelope>' + 
                    '</ogc:BBOX>';
    
    /*
    var xml = '<ogc:BBOX>' + 
                                      '<ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>' + 
                                      '<gml:Envelope>' + 
                                        '<gml:lowerCorner>47 -5</gml:lowerCorner>' + 
                                        '<gml:upperCorner>55 20</gml:upperCorner>' + 
                                      '</gml:Envelope>' + 
                                    '</ogc:BBOX>';
    */
    return xml;
    
}

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




