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
                var smExtentThumb = new extenty(69,69);
                $scope.boxStyle = smExtentThumb.getBoxStyle($scope.flipExtent($scope.record.extent));
    
                $scope.toggleViewAll = function(){
                    if (!$scope.viewAll){
                        hideAllViews();
                        $scope.viewAll = true;
                    }
                    else{
                        $scope.viewAll = false;
                    }
                }
    
                $scope.toggleViewXml = function(){
                    if (!$scope.viewXml){
                        hideAllViews();
                        $scope.viewXml = true;
                    }
                    else{
                        $scope.viewXml = false;
                    }
                }
    
                $scope.toggleViewImage = function(){
                    if (!$scope.viewImage){
                        hideAllViews();
                        $scope.viewImage = true;
                    }
                    else{
                        $scope.viewImage = false;
                    }
                }
    
                var hideAllViews = function(){
                    $scope.viewXml = false;
                    $scope.viewAll = false;
                    $scope.viewImage = false;
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