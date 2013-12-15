/**
 * Map values from one array to another
 * @param {Number} value
 * @param {Array} srcRange
 * @param {Array} dstRange
 */
var convertToRange = module.exports.convertToRange = function convertToRange(value, srcRange, dstRange){
  // value is outside source range return
  if (value < srcRange[0] || value > srcRange[1]){
    return NaN;
  }

  var srcMax = srcRange[1] - srcRange[0],
      dstMax = dstRange[1] - dstRange[0],
      adjValue = value - srcRange[0];

  return (adjValue * dstMax / srcMax) + dstRange[0];
};

/**
 * Helper function to pad 0-9
 * with 0, for dates
 * @param {Mixed} n formats to string
 * @returns {String} n
 */
var padZero = module.exports.padZero = function padZero( n ){
  n = '' + n;
  if (n.length === 1) {
    n = '0' + n;
  }
  return n;
};



