/**
 * Directive for displaying individual records
 */

angular.module('nrlCatalog')
    .directive('recordTemplate', function() {
        return{
            restrict: 'A',
            templateUrl:   'app/views/record.html',
            controller: function($scope){
                $scope.viewAll = false;
                $scope.viewXml = false;
                $scope.viewImage = false;
                $scope.thumbnailLoaded = false;
                $scope.record.xmlLoaded = false;
                var smExtentThumb = new Extenty(69,69);
                $scope.colors1 = [
                    "#f9f9f9",
                    "#009688",
                    "#7fd882",
                    "#fff8bf",
                    "#d0bc83",
                    "#795548"
                ];
                $scope.colors2 = [
                    "#000000",
                    "#9e9e9e",
                    "#0164b3",
                    "#74cef7",
                    "#dbfbff",
                    "#ffbba6",
                    "#f44336",
                ];
                $scope.thumbBg = "#f9f9f9";
                $scope.thumbBgBackup = "#f9f9f9";
                $scope.showColorSelect = false;
                $scope.boxStyle = smExtentThumb.getBoxStyle($scope.flipExtent($scope.record.extent));
    
                $scope.toggleViewAll = function(){
                    if (!$scope.viewAll){
                        hideAllViews();
                        $scope.viewAll = true;
                    }
                    else{
                        $scope.viewAll = false;
                    }
                };
    
                $scope.toggleViewXml = function(){
                    if (!$scope.viewXml){
                        hideAllViews();
                        $scope.viewXml = true;
                    }
                    else{
                        $scope.viewXml = false;
                    }
                };
    
                $scope.toggleViewImage = function(){
                    if (!$scope.viewImage){
                        hideAllViews();
                        $scope.viewImage = true;
                    }
                    else{
                        $scope.viewImage = false;
                    }
                };
    
                var hideAllViews = function(){
                    $scope.viewXml = false;
                    $scope.viewAll = false;
                    $scope.viewImage = false;
                };

                $scope.setThumbBg = function(c){
                    $scope.thumbBg = c;
                    $scope.thumbBgBackup = c;
                    $scope.showColorSelect = false;
                    console.log("select: " + $scope.showColorSelect);
                    console.log("color: " + c);
                };
                $scope.setHoverBg = function(c){
                    $scope.thumbBgBackup = $scope.thumbBg;
                    $scope.thumbBg = c;
                };
                $scope.setHoverOut = function (){
                    $scope.thumbBg = $scope.thumbBgBackup;
                };

                $scope.toggleColorSelect = function(){
                    $scope.showColorSelect = !$scope.showColorSelect;
                };
    
            }
        }
    });

angular.module('nrlCatalog')
    .directive('imageonload', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.bind('load', function() {
                    scope.$parent.thumbnailLoaded = true;
                    scope.$apply();
                });
                element.bind('error', function(){
                    console.log('image could not be loaded');
                });
            }
        };
    });