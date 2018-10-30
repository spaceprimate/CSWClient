angular.module('nrlCatalog')
    .directive('paginationTemplate', function() {
        return{
            restrict: 'E',
            templateUrl:   'app/views/pagination.html',
            controller: function($scope, $location, $anchorScroll){
                console.log("working so far");

                $scope.recordsPerPageOptions = [
                    {value: 10, label: '10 per page'},
                    {value: 25, label: '25 per page'},
                    {value: 50, label: '50 per page'},
                    {value: 100, label: '100 per page'}
                ]

                $scope.pages = {
                    curPage: 1,
                    pages: [],
                    totalRecords: 0,
                    recordsPerPage: $scope.recordsPerPageOptions[0],
                    totalPages: null,
                    pageLimits: []
                }

                

                /**
                 * based on settings in pages object, this calculates how many pages are required
                 * to accomodate the number of returned records, based on the number of records per page (set by user)
                 */
                $scope.setPages = function(){
                    $scope.pages.totalPages = Math.ceil($scope.pages.totalRecords / $scope.pages.recordsPerPage.value);
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
                 * 
                 * @param {*} curPage index of the current page
                 */
                function setCurPage(curPage){
                    $scope.pages.curPage = curPage;
                    $scope.pages.pageLimits[1] = Math.ceil(curPage / 10) * 10;
                    $scope.pages.pageLimits[0] = $scope.pages.pageLimits[1] - 10;
                }

                /**
                 * Checks $scope.search and calls createRequest on appropriate search object
                 * There are only 2 possible search objects, "basic" and "advanced"
                 *
                 * @return{String} getRecordRequest - xml string required for csw record request
                 */
                $scope.getFirstPage = function(){
                    $scope.pages.curPage = 1;
                    $scope.pages.pageLimits = [0, 10];
                    $scope.newRequest = true;
                    var recordRequest = $scope.search.createRequest($scope.pages);
                    $scope.requestRecords(recordRequest);
                    
                };

                /**
                 * gets page numbers in sets of 10
                 */
                $scope.getPageNumbers = function(){
                    var arr = [];
                    for (i = $scope.pages.pageLimits[0] + 1; i <= $scope.pages.pageLimits[1] && i <= $scope.pages.totalPages; i++){
                        arr.push(i);
                    }
                    return arr;
                };


                

                /**
                 * gets all the page numbers
                 */
                $scope.getAllPageNumbers = function(){
                    var arr = [];
                    for (i = 1; i <= $scope.pages.totalPages; i++){
                        arr.push(i);
                    }
                    return arr;
                }

                /**
                 * increments $scope.pages.curPage
                 * creates and submits and new records request
                 */
                $scope.getNextPage = function(){
                    setCurPage($scope.pages.curPage + 1);
                    var recordRequest = $scope.search.createRequest($scope.pages);
                    $scope.requestRecords(recordRequest);
                };

                /**
                 * decrements $scope.pages.curPage
                 * creates and submits and new records request
                 */
                $scope.getPrevPage = function(){
                    setCurPage($scope.pages.curPage - 1);
                    var recordRequest = $scope.search.createRequest($scope.pages);
                    $scope.requestRecords(recordRequest);
                };

                // separate model maintained for GoTo dropdown
                $scope.goToPageModel = 1;

                /**
                 * Loads records for a arbitrary page #
                 * creates and submits and new records request
                 * @param{int} page - page #
                 */
                $scope.goToPage = function(page){
                    setCurPage(page);
                    $scope.goToPageModel = 1;
                    var recordRequest = $scope.search.createRequest($scope.pages);
                    $scope.requestRecords(recordRequest);
                };
                
            },
            controllerAs: 'pgCtrl'
        }
    });