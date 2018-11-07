function extenty(w, h){

    var baseWidth = 100; // in pixels
    var baseHeight = 100;
    
    if(w != undefined && h != undefined){
        baseWidth = w;
        baseHeight = h;
    }
    

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
        var pixelCoords = [];
        pixelCoords[0] = convertLong(coords[0]);
        pixelCoords[1] = convertLat(coords[1]);
        pixelCoords[2] = convertLong(coords[2]);
        pixelCoords[3] = convertLat(coords[3]);
        var temp; //flip pixelCoords if they're not in ascending order
        if (pixelCoords[0] > pixelCoords [2]){
            temp = pixelCoords[0];
            pixelCoords[0] = pixelCoords[2];
            pixelCoords[2] = temp;
        }
        if (pixelCoords[1] > pixelCoords [3]){
            temp = pixelCoords[1];
            pixelCoords[1] = pixelCoords[3];
            pixelCoords[3] = temp;
        }
        if( isNaN(pixelCoords[0]) ||  isNaN(pixelCoords[1]) ||  isNaN(pixelCoords[2]) ||  isNaN(pixelCoords[3]) ){
            console.log("NaN value retured");
            return [9999,0,0,0];
        }
        
        return pixelCoords;
    }

    /**
     * Plot Latitude onto Web Mercator EPSG:3857 pixels
     * @param {*} lat 
     */
    function convertLat(lat){
        var pixelLat = 0;
        pixelLat = parseInt(lat);
        pixelLat = baseHeight / (2 * Math.PI) * Math.log(Math.tan(Math.PI / 4 + (pixelLat / 2) * Math.PI / 180)); //whew        
        pixelLat = ( baseHeight / 2 ) - pixelLat;
        if (pixelLat < 0){pixelLat = 0;}
        if (pixelLat > baseHeight){pixelLat = baseHeight;}
        return pixelLat;
    }

    /**
     * Plot Longitude onto Web Mercator EPSG:3857 pixels
     * @param {*} long 
     */
    function convertLong(long){
        var pixelLong = 0;
        pixelLong = parseInt(long);
        pixelLong =  (pixelLong + 180) * baseWidth / 360;
        if (pixelLong < 0){pixelLong = 0;}
        if (pixelLong > baseWidth){pixelLong = baseWidth;}
        return pixelLong;
    }
};