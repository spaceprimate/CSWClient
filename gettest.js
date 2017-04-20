/*
 * App for interfacing with CSW services to browse and seach records
 * 
 *
 *
 *
 */


// Site Module- instatiated above
var app = angular.module('app', [ ]);
//var app = angular.module('store', [ ]);



/*
 * main controller
 * injects $scope and $http ( for post requests )
 */
app.controller('mainController', ['$scope', '$http', function($scope, $http) {

    //location of the pycsw server
    //  var cswUrl = "https://nrlgeoint.cs.uno.edu/pycsw?service=CSW&version=2.0.2";
    var cswUrl = "https://data.noaa.gov/csw?version=2.0.2";
    // var cswUrl = "http://demo.pycsw.org/cite/csw?service=CSW&version=2.0.2";

















    /**
     * Makes angular http POST request to CSW Server
     * iterates through results, creating and pushing record objects to $scope.curRecords
     *
     * @param {String} recordRequest - string containing xml for request
     */

    // check here: http://stackoverflow.com/questions/21455045/angularjs-http-cors-and-http-authentication
    $scope.requestRecords = function(recordRequest){
        console.log("request made");
        $http({
            url: cswUrl,
            method: "POST",
            data: recordRequest,
            headers: {
                'Accept': 'application/xml',
            }
        })
        .then(function(response){
            //success
            $scope.curRecords = [];   
            console.log("data is: ");
            console.log(response.data);

           


            var xml = $.parseXML(response.data);
            console.log(xml);


             var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);

            //console.log("x2js: ");
            //console.log(jsonData);


            var i = 1;

            if (newRequest == true){
                $scope.pages.totalRecords = $(xml).find("SearchResults").attr('numberOfRecordsMatched');
                $scope.setPages();
                newRequest = false;
            }
            console.log("made it to 206: ");
            // $(xml).find("csw:Record").each(function(i,record){
            //     var item = {};
            //     item.title = $(record).find("title").html();
            //     item.keywords = [];
            //     $(record).find("subject").each(function(e, subject){
            //         item.keywords.push($(subject).html());
            //     });
            //     item.abstract = $(record).find("abstract").html();
            //     item.type = $(record).find("type").html();
            //     item.lowerCorner = $(record).find("LowerCorner").html();
            //     item.upperCorner = $(record).find("UpperCorner").html();
            //     item.extent = getExtentFromCorners($(record).find("LowerCorner").html(), $(record).find("UpperCorner").html());
            //     item.mapID = "map"+i;
            //     $scope.curRecords.push(item);
            //     //console.log(item);
            //     i++;

            // });


            jsonData.GetRecordsResponse.SearchResults.Record.forEach(function(e, i) {
                
                    var item = {};
                    item.title = e.title.toString();
                    item.keywords = [];
                    if ( Array.isArray(e.subject) ){
                        e.subject.forEach(function(el){
                            item.keywords.push(el.toString());
                        });
                    }
                    if (e.abstract != undefined){
                        if (e.abstract.toString != "[object Object]"){
                            item.abstract = e.abstract.toString();
                        }
                        
                    }
                    
                    item.type = e.type.toString();
                    item.lowerCorner = e.BoundingBox.LowerCorner.toString();
                    item.upperCorner = e.BoundingBox.UpperCorner.toString();
                    item.extent = getExtentFromCorners(item.lowerCorner, item.upperCorner);
                    item.mapID = "map"+i;
                    $scope.curRecords.push(item);

                    // $(record).find("subject").each(function(e, subject){
                    //     item.keywords.push($(subject).html());
                    // });
                    // item.abstract = $(record).find("abstract").html();
                    // item.type = $(record).find("type").html();
                    // item.lowerCorner = $(record).find("LowerCorner").html();
                    // item.upperCorner = $(record).find("UpperCorner").html();
                    // item.extent = getExtentFromCorners($(record).find("LowerCorner").html(), $(record).find("UpperCorner").html());
                    // item.mapID = "map"+i;
                    //$scope.curRecords.push(item);
                    console.log(e);
                    i++;
            });


            //setTimeout(createPreviews, 100);
        },
        function(response){
            //error
            console.log("Request Error, response follows: ");
            console.log(response);
        });
    };

    



}]);

