/*
 * Collection of utility and polyfill functions
 */


/**
 * Safely checks if a object exists or not
 * @param {*} fn 
 */
function getSafe(fn) {
    try {
        return fn();
    } catch (e) {
        return undefined;
    }
}

/**
 * Checks if extent has out-of-bounds coordinate
 * @param extent
 * @returns {boolean}
 */
function isOutOfBounds(extent){
    return (
        extent[0] > 180 || extent[0] < -180 ||
        extent[1] > 90 || extent[1] < -90 ||
        extent[2] > 180 || extent[2] < -180 ||
        extent[3] > 90 || extent[3] < -90
    );
}

/**
 * If latitude exceeds |90| or both longitudinal coordinates exceed |180|, trim them
 * Allow one and only one longitudinal coordinate to exceed |180| in case
 * selection crosses antimeridian
 * @param e
 * @returns {*}
 */
function trimExtent(e){
    // trim latitudes to 90, -90
    if(e[1] < -90){e[1] = -90;}
    if(e[3] > 90){e[3] = 90;}
    if(e[0] < -180 && e[2] > 180){e[0] = -180; e[2] = 180;}
    return e;
}

//make case for both being out of bounds
function getOutOfBoundsExtents(e){
    var e1, e2;
    if (e[0] < -180){
        e1 = [ (e[0] + 360), e[1], 180, e[3] ];
        e2 = [ -180, e[1], e[2], e[3] ];
    }
    else if((e[2] > 180)){
        e1 = [ e[0], e[1], 180, e[3] ];
        e2 = [ -180, e[1], (e[2] - 360), e[3] ];
    }
    else{
        e1 = [];
    }
    return [e1, e2];
}


/**
 * MDN polyfill for Array find (IE doesn't support)
 */
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;
  
      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    };
  }


