/*
 * App for displaying static site content. 
 * Page heirarchy is defined in /sitemap.json
 *
 * JSON format for sitemap.json
 * 	Required attributes:
 * 		id 	- unique, url-safe identifier. Content for "id":"about" would be stored in /content/about.html
 *			name 	- page name
 * 	Optional attributes:
 * 		custom (Boolean) 	- page content area is full-width and non-styled,
 *									- usefull for complicated layouts (homepage) or full-width data tables
 * 		sidebar (String) - displays a left-hand sidebar menu
 *			banner  (filename) - displays a full witdth banner at top of page, using filename specified as the background
 *									 - recommended banner size is: 1920x300
 *			pages (array of page objects) - child pages
 */


//var to store sitemap.json contents
var siteMap;
//import json. on success, initiallize app
$.getJSON( "sitemap.json", 
	function( data ) {
		siteMap = mapSiteMap(data);
		//initialize app
		angular.bootstrap(document, ['nrlSite']);
	})
	.fail(function(data){
		console.log("failed to load json"); console.log(data);
	}
);

/*
 * Go thorugh site-map, adding appropriate layout type, based on various page attributes in json
 * create heirarchical url, based on json depth, eg. about/services/geoPackages
 * set each page's immediate ancestor as 'parent'
 * This function calls it's self recursively to traverse sitemap tree
 */
function mapSiteMap(siteMap, parent, parentName, url){
	var newMap =  siteMap.map(function(m){
		if (url == undefined){
			if (m.id == 'home') {
				m.url = "/";
				m.isHomepage = true;
			}
			else {m.url = "/"+m.id;}
		}
		else{
			m.url = url+"/"+m.id
		}
		if (parent == undefined){
			m.parent = m.id;
			m.parentName = m.name;
		}
		else {
			m.parent = parent;
			m.parentName = parentName;
		}

		if(m.banner != undefined){
			m.hasBanner = true;
		}

		if (m.sidebar != undefined){
			m.hasSidebar = true;
		}

		if (m.pages != undefined){
			// - recursive call -
			m.pages = mapSiteMap(m.pages, m.parent, m.parentName, m.url);
		}
		return m;
	});
	return newMap;
}


// Site Module- instatiated above
var nrlSite = angular.module('nrlSite', ['ngRoute']);

// configure our routes
nrlSite.config(function($routeProvider) {
	function addSitemap(pages){
		pages.forEach(function(e){
			var url = e.url;
			
			$routeProvider.when(url, {
				templateUrl : 'content/' + e.id + '.html',
				currentPage : e
			});

			//if it has children, call recursively
			if (e.pages != undefined){
				addSitemap(e.pages);
			}
		});		
	}
	addSitemap (siteMap);
});


/*
 * main controller
 * $routeProvider allows us to add page specific controllers if needed in the future
 */
nrlSite.controller('mainController', ['$scope', '$route', '$routeParams', function($scope ,$route, $routeParams) {

	//bring sitemap into scope
	$scope.mainMenu = siteMap;

	$scope.curNav = "";
	$scope.updateNav = function(nav){$scope.curNav = nav;}

	//once the new route has successfully loaded, add the current page's params to $scope
	//this is required for elements outside of ng-view in the main template
	$scope.$on("$routeChangeSuccess", function(event, current, previous){
		$scope.page = current.$$route.currentPage;
		//$(".navbar-nav>li.active").removeClass('active');
		$scope.curNav = "";
		$scope.showNavbar = false;
   });

	//returns submenu based on parent page specified by 'sidebar'
   $scope.getMenu = function(sidebar){
   	//arr, attr, val
   	var index = findWithAttr($scope.mainMenu, 'id', sidebar);
   	//return $scope.mainMenu.find(function(e){return e.id == sidebar;});
   	return $scope.mainMenu[index];
   }

   /*
   $scope.selected = function(event){
   	$(".navbar-nav>li").removeClass('active');
   	$(event.target).parent().addClass('active');
   }
   */

   /*
    * Sticky Sidebar
    * jquery to make the sidebar sticky once we've scrolled past the main header
    * we're not doing this through ng-class to save on performance
    */
   $( window ).scroll(function() {
   	if ($(window).scrollTop() > $(".container.main").offset().top ) {
   		$("#sidebar").addClass("fixed");
   	}
   	else{$("#sidebar").removeClass("fixed");}
	});
	


}]);



/*
 * Directives!
 */
nrlSite.directive('siteHeader', function(){
	return{
		restrict: 'E',
		templateUrl: 'templates/header.html'
	}
});

nrlSite.directive('siteFooter', function(){
	return{
		restrict: 'E',
		templateUrl: 'templates/footer.html'
	}
});


nrlSite.directive('pageBanner', function(){
	return{
		restrict: 'E',
		templateUrl: 'templates/banner.html'
	}
});


nrlSite.directive('mainMenu', function() {

	return{
		restrict: 'E',
		templateUrl: 'templates/menu-main.html' 	
	}
	
});

nrlSite.directive('footMenu', function() {
	return{
		restrict: 'E',
		template: 	'<ul class="list-inline">' + 
						'<li ng-repeat="e in mainMenu">' + 
							'<a href="#/{{e.id}}">{{e.name}}</a>' + 
						'</li>' + 
					'</ul>',
	}
	
});

nrlSite.directive('sidebarMenu', function() {
	return {
		restrict: 'E',
		replace: true,
		template: 	'<ul class="menu nav">' + 
							'<li class="parent heading">' + 
								'<a href="#/{{page.parent}}">{{page.parentName}}</a>' + 
								'<ul class="menu nav">' + 
									'<li ng-repeat="link in getMenu(page.sidebar).pages" ng-class="{\'active\' : link.id == page.id}"><a href="#{{link.url}}">{{link.name}}</a></li>' +
								'</ul>' + 
							'</li>' +
						'</ul>'
	};
});


/* IE versions before Edge don't support array.prototype.find , so here is a helper function */
function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}






