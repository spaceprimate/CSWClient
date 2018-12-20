angular.module('nrlCatalog')
    .directive('advancedSearch', function() {
        return{
            restrict: 'E',
            replace: true,
            templateUrl:   'app/views/searchAdvanced.html',
            controller: function($scope){

                $scope.getDefaultExtent = function(){
                    return [-180, -90, 180, 90];
                };

                $scope.mapHeight = 480;

                $scope.mapClass = "cross-hair";
                
                // Open Street Maps layer
                var osmLayer = new ol.layer.Tile({
                    source: new ol.source.OSM()
                });
                
                $scope.extentSelectVisibility = false;

                /**
                 * called from template when user selects Bounding Box from dropdown
                 * 
                 * @param {*} filter csw-filter
                 */
                $scope.extentStatus = function(filter){
                    if(filter.type.id === "extent"){
                        $scope.search.setHasExtent();

                        //set current filter of the extent-selection-map
                        advSearchMap.currentFilter = filter;

                        //assign Extenty css style to this filter instance
                        filter.extentyStyle[0] = extentThumbnail.getBoxStyle( $scope.getDefaultExtent() );
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
                    // mapEditButton.innerHTML = "<span class='glyphicon glyphicon-pencil'></span>";
                    mapEditButton.innerHTML = "<div class='icon icon-edit white' style='margin-bottom: 1px; margin-left: 3px;'></div>";
                    mapEditButton.addEventListener('click', function(){$scope.enableMapEdit(); $scope.$apply();}, false);
                    var mapEditButtonContainer = document.createElement('div');
                    mapEditButtonContainer.className = 'map-edit-button ol-unselectable ol-control';
                    mapEditButtonContainer.appendChild(mapEditButton);
                    var editControl = new ol.control.Control({element: mapEditButtonContainer});

                    // pan button
                    var mapPanButton = document.createElement('button');
                    mapPanButton.innerHTML = "<div class='icon icon-pan white' style='margin-bottom: 1px; margin-left: 3px;'></div>";
                    // mapPanButton.innerHTML = "<img src='assets/img/pan-icon.png' style='width: 15px; height: auto;' />";
                    mapPanButton.addEventListener('click', function(){$scope.enableMapPan(); $scope.$apply();}, false);
                    var mapPanButtonContainer = document.createElement('div');
                    mapPanButtonContainer.className = 'map-pan-button ol-unselectable ol-control';
                    mapPanButtonContainer.appendChild(mapPanButton);
                    var panControl = new ol.control.Control({element: mapPanButtonContainer});

                    // mouse position
                    var mousePositionControl = new ol.control.MousePosition({
                        coordinateFormat: ol.coordinate.createStringXY(4),
                        projection: 'EPSG:4326',
                        undefinedHTML: '&nbsp;,&nbsp;'
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
                            minZoom: 1
                        })
                    });

                    advSearchMap.addInteraction(advSearchExtent);

                    $scope.$watch('showSearch', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            advSearchMap.updateSize();
                        }
                    });
                }

                var extentStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgb(255, 34, 34)',
                        width: 1
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 34, 34, 0.2)'
                    })
                });

                //OpenLayers Extent object, for advanced search
                var advSearchExtent = new ol.interaction.Extent({
                    boxStyle: [extentStyle],
                    pointerStyle: [extentStyle],
                    active: true
                });

                /**
                 * updates extent when user manually changes coordinate input in view
                 */
                $scope.updateExtent = function(filter){
                    advSearchExtent.setExtent(filter.extent);
                    if(!isOutOfBounds(filter.extent)){
                        filter.multiExtent = false;

                        filter.extentyStyle[0] = extentThumbnail.getBoxStyle(filter.extent);
                        if (filter.extentyStyle.length > 1){filter.extentyStyle.pop();}
                    }
                    else {
                        filter.multiExtent = true;
                        var multiExtents = getOutOfBoundsExtents(filter.extent);
                        filter.extentyStyle[0] = extentThumbnail.getBoxStyle(multiExtents[0]);
                        filter.extentyStyle[1] = extentThumbnail.getBoxStyle(multiExtents[1]);
                    }
                };

                /**
                 * updates a filter's extent values after user selects constraint on map
                 */
                $scope.updateExtentFields = function(){
                    if (advSearchExtent.getExtent() != null){
                        advSearchMap.currentFilter.extent = advSearchExtent.getExtent(); // set current extent filter extent to extent outline in OL extent object
                        advSearchMap.currentFilter.extent = trimExtent(advSearchMap.currentFilter.extent);
                        if ( isOutOfBounds( advSearchMap.currentFilter.extent )){
                            //set flag
                            advSearchMap.currentFilter.multiExtent = true;
                            var multiExtents = getOutOfBoundsExtents(advSearchMap.currentFilter.extent);

                            advSearchMap.currentFilter.extentyStyle[0] = extentThumbnail.getBoxStyle(multiExtents[0]);
                            advSearchMap.currentFilter.extentyStyle[1] = extentThumbnail.getBoxStyle(multiExtents[1]);
                        }
                        else{
                            if (advSearchMap.currentFilter.extentyStyle.length > 1){advSearchMap.currentFilter.extentyStyle.pop();}
                            //unset flag
                            advSearchMap.currentFilter.multiExtent = false;
                            advSearchMap.currentFilter.extentyStyle[0] = extentThumbnail.getBoxStyle(advSearchMap.currentFilter.extent);
                        }
                    }
                    else{
                        advSearchMap.currentFilter.extent = [-180.0, -90.0, 180.0, 90.0];
                    }
                    $scope.hideExtentSelector();
                };

                $scope.loadExtentSelector = function(filter){
                    advSearchMap.currentFilter = filter;
                    if( !filter.isFirstTime ){
                        advSearchExtent.setExtent(filter.extent);
                    }
                    else{
                        filter.isFirstTime = false;
                    }
                    // adjust map height for shorter screens
                    if ($(window).height() < 595 ){
                        setMapHeight($(window).height() - 115);
                    }
                    else{
                        setMapHeight(480);
                    }
                    $scope.extentSelectVisibility = true;

                    setTimeout(function(){advSearchMap.updateSize();}, 100);

                };

                function setMapHeight(height){
                    $scope.mapHeight = height;
                }

                $scope.hideExtentSelector = function(){
                    $scope.extentSelectVisibility = false;
                };

                /**
                 * resets extent to default (in OL map and search object)
                 */
                $scope.clearExtent = function(filter){
                    advSearchExtent.setExtent(null); // open layers extent (clears it)
                    filter.extent = $scope.getDefaultExtent();
                    filter.extentyStyle[0] = extentThumbnail.getBoxStyle(filter.extent);
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
                };

                setTimeout(addMap, 50);
            },
            controllerAs: 'advSearch'
        }
    });