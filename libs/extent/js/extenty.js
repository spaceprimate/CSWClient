function extenty(){
    var baseWidth = 100; // in pixels
    var baseHeight = 100;
    

    /**
     * Cycle through all the elements with the "extenty-box" class. 
     * Get the coordinates in the dat-coords attribute
     * update styles for each box
     */
    this.updateExtents = function(){
        var i;
        var extents = document.getElementsByClassName("extenty-box");
        for (i = 0; i < extents.length; i++) {
            var coords = convertCoords( extents[i].dataset.coords.split(',') );
            var width = coords[2] - coords[0];
            var height = coords[3] - coords[1];
            extents[i].style.top = coords[1] + "px";
            extents[i].style.left = coords[0] + "px";
            extents[i].style.width = width + "px";
            extents[i].style.height = height + "px";
        }
    }

    /**
     * Returns a JSON formatted css style for a given bounding box
     * @param {[]} - [x,y,x,y]
     */
    this.getBoxStyle = function(c){
        var coords = convertCoords( c );
        var width = coords[2] - coords[0];
        var height = coords[3] - coords[1];
        var style = {
            'top':      coords[1] + "px",
            'left':     coords[0] + "px",
            'width':    width + "px",
            'height':   height + "px"
        };
        if (coords[0] == 9999){style.display = 'none';}
        if (height * width < 20){style.borderWidth = '2px';}
        return style;
    }

    /**
     * Converts latitude and longitude into pixel values
     * @param {*} coords 
     */
    function convertCoords(coords){
        coords[0] = convertLong(coords[0]);
        coords[1] = convertLat(coords[1]);
        coords[2] = convertLong(coords[2]);
        coords[3] = convertLat(coords[3]);
        var temp; //flip coords if they're not in ascending order
        if (coords[0] > coords [2]){
            temp = coords[0];
            coords[0] = coords[2];
            coords[2] = temp;
        }
        if (coords[1] > coords [3]){
            temp = coords[1];
            coords[1] = coords[3];
            coords[3] = temp;
        }
        if( isNaN(coords[0]) ||  isNaN(coords[1]) ||  isNaN(coords[2]) ||  isNaN(coords[3]) ){
            console.log("NaN value retured");
            return [9999,0,0,0];
        }
        return coords;
    }

    /**
     * Plot Latitude onto Web Mercator EPSG:3857 pixels
     * @param {*} lat 
     */
    function convertLat(lat){
        lat = parseInt(lat);
        lat = baseHeight / (2 * Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat / 2) * Math.PI / 180)); //whew        
        lat = ( baseHeight / 2 ) - lat;
        if (lat < 0){lat = 0;}
        if (lat > baseHeight){lat = baseHeight;}
        return lat;
    }

    /**
     * Plot Longitude onto Web Mercator EPSG:3857 pixels
     * @param {*} long 
     */
    function convertLong(long){
        long = parseInt(long);
        long =  (long + 180) * baseWidth / 360;
        if (long < 0){long = 0;}
        if (long > baseWidth){long = baseWidth;}
        return long;
    }
};