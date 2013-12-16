var request = require('request'),
    fs      = require('fs'),
    priv    = require('../private');

var log = function() {

  if (priv.debug !==  'on' ){
    return ;
  }
  var args = [].slice.apply(arguments);
  fs.appendFile(__dirname + '/../utils/spark.log', '\n\n' + new Date().toISOString() +':\n' + args.join('\n'));
}
var lastSend;

var pushToSpark = module.exports.pushToSpark =  function( degrees, active, average ) {
  var core = priv.spark_id,
      access_token = priv.spark_key,
      spark_url = 'https://api.spark.io/v1/devices/' + core + '/ga';

  if (degrees === lastSend) {
    //dont hit spark servers because nothing has changed and that would be rude
    console.log('exiting');
    //return;
  }
  request.post({url: spark_url, form:{access_token:access_token,args: degrees}}, function(e,r,body){
    lastSend = degrees;
    if (e) {
      log(e)
    };
    
    log(degrees, active, average);
  });
};



