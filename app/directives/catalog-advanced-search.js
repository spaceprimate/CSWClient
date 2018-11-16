//delete this and all references before going live pls
var root = {};

angular.module('nrlCatalog')
    .directive('advancedSearch', function() {
        return{
            restrict: 'E',
            templateUrl:   'app/views/searchAdvanced.html',
            controller: function($scope, $location, $anchorScroll){

                $scope.getDefaultExtent = function(){
                    return [-180, -90, 180, 90];
                }

                $scope.extentyStyle = extentThumbnail.getBoxStyle( $scope.getDefaultExtent() );

                $scope.mapClass = "cross-hair";
                
                // Open Street Maps layer
                var osmLayer = new ol.layer.Tile({
                    source: new ol.source.OSM()
                });
                
                $scope.extentSelectVisibility = false;

                var mapCreated = false;
            
                var bboxSelected = 0; // needed in the rare case a user changes browser size after map has loaded, then been hidden

                /**
                 * called from template when user selects Bounding Box from dropdown
                 * 
                 * @param {*} filter csw-filter
                 */
                $scope.extentStatus = function(filter){
                    if(filter.type.id == "extent"){
                        $scope.search.setHasExtent();

                        //set current filter of the extent-selection-map
                        advSearchMap.currentFilter = filter;

                        //assign extenty css style to this filter instance
                        filter.extentyStyle = extentThumbnail.getBoxStyle( $scope.getDefaultExtent() );
                        filter.isFirstTime = true; // is this the first time the bounding box has been assigned to this filter?
                        $scope.clearExtent(filter);
                        $scope.loadExtentSelector(filter);
                    }
                };

                var advSearchMap;

                // adds openlayers map, allowing users to draw bounding box
                function addMap(){
                    
                    // create Openlayers buttons to control panning and extent selection
                    // edit button
                    var mapEditButton = document.createElement('button');
                    mapEditButton.innerHTML = "<span class='glyphicon glyphicon-pencil'></span>";
                    mapEditButton.addEventListener('click', function(){$scope.enableMapEdit(); $scope.$apply();}, false);
                    var mapEditButtonContainer = document.createElement('div');
                    mapEditButtonContainer.className = 'map-edit-button ol-unselectable ol-control';
                    mapEditButtonContainer.appendChild(mapEditButton);
                    var editControl = new ol.control.Control({element: mapEditButtonContainer});

                    // pan button
                    var mapPanButton = document.createElement('button');
                    mapPanButton.innerHTML = "<img src='assets/img/pan-icon.png' style='width: 15px; height: auto;' />";
                    mapPanButton.addEventListener('click', function(){$scope.enableMapPan(); $scope.$apply();}, false);
                    var mapPanButtonContainer = document.createElement('div');
                    mapPanButtonContainer.className = 'map-pan-button ol-unselectable ol-control';
                    mapPanButtonContainer.appendChild(mapPanButton);
                    var panControl = new ol.control.Control({element: mapPanButtonContainer});

                    // mouse position
                    var mousePositionControl = new ol.control.MousePosition({
                        coordinateFormat: ol.coordinate.createStringXY(4),
                        projection: 'EPSG:4326',
                        // comment the following two lines to have the mouse position
                        // be placed within the map.
                        // className: 'custom-mouse-position',
                        // target: document.getElementById('mouse-position'),
                        // undefinedHTML: '&nbsp;'
                        undefinedHTML: '103.4839, 28.3930'
                      });

                    advSearchMap = new ol.Map({
                        layers: [osmLayer],
                        target: 'adv-search-map',
                        controls: ol.control.defaults({
                            zoom: true,
                            attribution: false,
                            rotate: false
                        }).extend([editControl, panControl, mousePositionControl]),
                        view: new ol.View({
                            center: [0, 0],
                            projection: 'EPSG:4326',
                            zoom: 2,
                            minZoom: 2
                        })
                    });




                    

                    advSearchMap.addInteraction(advSearchExtent);

                    root.extent = advSearchExtent;
                    root.map = advSearchMap;


                    // $scope.$watch('minimizeAdvanced', function(newValue, oldValue) {
                    //     if (newValue !== oldValue) {
                    //         advSearchMap.updateSize();
                    //     }
                    // });
                    $scope.$watch('showSearch', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            advSearchMap.updateSize();
                        }
                    });

                    advSearchMap.currentFilter;

                }

                var extentStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgb(255, 34, 34)',
                        width: 1,
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 34, 34, 0.2)'
                    })
                });

                //OpenLayers Extent object, for advanced search
                var advSearchExtent = new ol.interaction.Extent({
                    // condition: ol.events.condition.click,
                    boxStyle: [extentStyle],
                    pointerStyle: [extentStyle],
                    active: true
                });

                

                /**
                 * updates extent when user manually changes coordinate input in view
                 */
                $scope.updateExtent = function(filter){
                    //this needs to get extent from a specific contraint
                    advSearchExtent.setExtent(filter.extent);
                    filter.extentyStyle = extentThumbnail.getBoxStyle(filter.extent);
                };

                /**
                 * updates a filter's extent values after user selects constraint on map
                 */
                $scope.updateExtentFields = function(){
                    if (advSearchExtent.getExtent() != null){
                        advSearchMap.currentFilter.extent = advSearchExtent.getExtent(); // set current extent filter extent to extent outline in OL extent object
                    }
                    else{
                        advSearchMap.currentFilter.extent = [-180.0, -90.0, 180.0, 90.0];
                    }
                    
                    advSearchMap.currentFilter.extentyStyle = extentThumbnail.getBoxStyle(advSearchMap.currentFilter.extent);
                    $scope.hideExtentSelector();
                }


                $scope.loadExtentSelector = function(filter){
                    //scroll to top of page
                    // $location.hash('main');
                    // $anchorScroll();

                    advSearchMap.currentFilter = filter;

                    if( !filter.isFirstTime ){
                        advSearchExtent.setExtent(filter.extent);
                    }
                    else{
                        filter.isFirstTime = false;
                    }
                    
                    $scope.extentSelectVisibility = true;
                    setTimeout(function(){advSearchMap.updateSize();}, 100);

                }

                $scope.hideExtentSelector = function(){
                    $scope.extentSelectVisibility = false;
                }

                /**
                 * resets extent to default (in OL map and search object)
                 */
                $scope.clearExtent = function(filter){
                    advSearchExtent.setExtent(null); // open layers extent (clears it)
                    filter.extent = $scope.getDefaultExtent();
                    filter.extentyStyle = extentThumbnail.getBoxStyle(filter.extent);
                };

                /**
                 * allows user to click and drag to pan the map
                 */
                $scope.enableMapPan = function(){
                    advSearchExtent.setActive(false);
                    $scope.mapClass = "grab";
                };

                /**
                 * re-enables the extent selection interaction
                 */
                $scope.enableMapEdit = function(){
                    advSearchExtent.setActive(true);
                    $scope.mapClass = "cross-hair";
                    console.log("this was called");
                    
                };


                

                setTimeout(addMap, 50);
            },
            controllerAs: 'advSearch'
        }
    });