/*
 * Collection of utility functions
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