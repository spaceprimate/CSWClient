angular.module('nrlCatalog')
    .directive('advancedSearch', function() {
        return{
            restrict: 'E',
            templateUrl:   'templates/searchAdvanced.html',
            controller: function($scope, $location, $anchorScroll){

                $scope.getDefaultExtent = function(){
                    return [-180, -90, 180, 90];
                }

                // $scope.defaultExtent = [-180, -90, 180, 90];
                $scope.extentyStyle = extentThumbnail.getBoxStyle( $scope.getDefaultExtent() );

                var vectorSource = new ol.source.Vector({
                    url: 'https://openlayers.org/en/v4.0.1/examples/data/geojson/countries.geojson',
                    format: new ol.format.GeoJSON()
                });
                
                // Open Street Maps layer
                var osmLayer = new ol.layer.Tile({
                    source: new ol.source.OSM()
                });
                //Country Outlines layer
                var countriesLayer = new ol.layer.Vector({
                    source: vectorSource
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
                    $scope.searches.advancedSearch.setHasExtent();

                    //set current filter of the extent-selection-map
                    advSearchMap.currentFilter = filter;

                    //assign extenty css style to this filter instance
                    filter.extentyStyle = extentThumbnail.getBoxStyle( $scope.getDefaultExtent() );
                    filter.isFirstTime = true; // is this the first time the bounding box has been assigned to this filter?
                    $scope.clearExtent(filter);
                    $scope.loadExtentSelector(filter);


                };

                var advSearchMap;

                // adds openlayers map, allowing users to draw bounding box
                function addMap(){
                    
                    advSearchMap = new ol.Map({
                        layers: [osmLayer, countriesLayer],
                        target: 'adv-search-map',
                        controls: ol.control.defaults({
                        zoom: true,
                        attribution: false,
                        rotate: false
                        }),
                        view: new ol.View({
                            center: [0, 0],
                            projection: 'EPSG:4326',
                            zoom: 2,
                            minZoom: 2,
                        })
                    });

                    advSearchMap.addInteraction(advSearchExtent);

                    $scope.$watch('minimizeAdvanced', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            advSearchMap.updateSize();
                        }
                    });
                    $scope.$watch('showAdvancedSearch', function(newValue, oldValue) {
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

                $scope.updateExtentFields = function(){
                    advSearchMap.currentFilter.extent = advSearchExtent.getExtent(); // set current extent filter extent to extent outline in OL extent object
                    advSearchMap.currentFilter.extentyStyle = extentThumbnail.getBoxStyle(advSearchMap.currentFilter.extent);
                    $scope.hideExtentSelector();                
                }


                $scope.loadExtentSelector = function(filter){
                    $location.hash('main');
                    $anchorScroll();

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

                setTimeout(addMap, 50);
            },
            controllerAs: 'advSearch'
        }
    });