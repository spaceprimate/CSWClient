/**
 * Directive for displaying individual records
 */

angular.module('nrlCatalog')
    .directive('dialog', function() {
        return{
            restrict: 'A',
            templateUrl:   'app/views/dialog.html',
            replace: true,
            controller: function($scope){
                $scope.showDialog = false;
                $scope.dialog = {
                    title: "error",
                    msg: "An error has occurred."
                }
                $scope.openDialog = function(title, msg){
                    $scope.dialog.title = title;
                    $scope.dialog.msg = msg;
                    $scope.showDialog = true;
                };
                $scope.closeDialog = function(){
                    $scope.showDialog = false;
                };

                $scope.toggleColorSelect = function(){
                    $scope.showColorSelect = !$scope.showColorSelect;
                };

            }
        }
    });

