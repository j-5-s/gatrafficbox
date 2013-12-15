var request = require('request'),
    priv    = require('../private');

var pushToSpark = module.exports.pushToSpark =  function( degrees ) {
  var core = '53ff6c065067544849451087',
      access_token = priv.spark_key,
      spark_url = 'https://api.spark.io/v1/devices/' + core + '/ga';

  request.post({url: spark_url, form:{access_token:access_token,args: degrees}}, function(e,r,body){
    console.log(body);
  });
};
