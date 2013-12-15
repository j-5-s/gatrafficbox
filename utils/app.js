var request     = require('request'),
    fs          = require('fs'),
    utils       = require('../utils'),
    google      = require('../utils/google'),
    spark       = require('../utils/spark'),
    priv        = require('../private');



// Tries to figure out the average visits over an hour period
// Order of attempt (uses utils/visits.json:
// - Same hour 1 week ago
// - Same hour yesterday
// - Previous hour today
// - Last call to GA
// - returns undefined
var getAverageHistory = module.exports.getAverageHistory = function( h, callback ) {
  if (typeof h === 'function') {
    callback = h;
    h = new Date().getHours();
  }

  fs.readFile(__dirname +'/visits.json', function(err, visits){
    visits = JSON.parse(visits);

    // Look for last week at the same hour
    if (visits.length === 7) {
      if (typeof visits[6][h] !== 'undefined') {
        return callback(visits[6][h]);
      }
      
    }

    // Look for yesterday at the same hour
    if (typeof visits[1] !== 'undefined' ) {
      if (typeof visits[1][h] !== 'undefined' ) {
        return callback(visits[1][h]);
      }
    }
    
    //look for previous hour
    if ( typeof visits[0] !== 'undefined' ) {
      if (typeof visits[0][h-1] !== 'undefined' ) {
        return callback(visits[0][h-1]);
      }
    }

    if ( visits ) {
      if (typeof visits[0] !== 'undefined') {
        var len = visits[0].length;
        if (typeof visits[0][len-1] !== 'undefined') {
          return callback(visits[0][len-1]);
        }
      }
    }

    return ;
  });
};


var status = module.exports.status = false;
module.exports.getStatus = function(){
  return status;
};

//`i` is the call count
//It should update the visit count every time
//it gets the data from GA. so rather than
var updateVisits = module.exports.updateVisits = function( i, visit, cb ) {
  fs.readFile(__dirname +'/visits.json', function(err, visits){
    visits = JSON.parse(visits);
    //remove data older than 7 days
    visits.splice(7,visits.length);
    var today = visits[0];
    //update or repl
    if (i % 240 === 0) {
      //its the first for the hour, add the single visit
      today.push(visit);
      today.splice(24,visits.length);
    } else {
      var indx = today.length-1;
      if (indx < 0) {
        indx = 0;
      }
      //only update if there is no visit history for this
      //time period or if the current visit count is higher
      if (typeof today[indx] === 'undefined') {
        today[indx] = visit;
      } else if ( visit > today[indx]) {
        today[indx] = visit;
      }
      
    }
    fs.writeFile(__dirname +'/visits.json', JSON.stringify(visits), cb);
  });
};


// .getVisits()
// It's assumed that the app has at least a valid access_token at this point
// it may be expired though in which case google.getRealTimeVisits with exchange
// it with a refresh token.
var getVisits = function(i, regenerate, cb) {
  google.getRealtimeVisits(function(response){
    var av = parseInt(response.totalsForAllResults['ga:activeVisitors'],10);
    updateVisits(i, av, function(){
      cb(av);
    });
  });
};

//Deprecated
var getRealTimeVisits = module.exports.getRealTimeVisits = function( i, cb ) {
  getVisits(i, false, cb);
};


var averageVisitors,
    liveInterval,
    historyInterval;

// # .toggleStatus is the main jump off point
// it will turn on and off the speedometer
//Every 15 seconds ping GA and push to spark
//every hour, figure out average
module.exports.toggleStatus = function() {
  status = !status;
  var i = 0;
  if (status) {
     liveInterval = setInterval(function(){
      i++;
      getRealTimeVisits(i,function(activeVisitors){
        //if there is no history of average visitors
        //set it to `1` and it will learn slowly
        if ( typeof averageVisitors === 'undefined' ) {
          averageVisitors = 1;
        }

        //Dont want to make the max just what it was last period
        //so give it 100% increase because the idea
        //is you want maximum of 180 degrees to indicate 
        //greater than last time. So 50% would be same as last time
        averageVisitors = Math.ceil(averageVisitors*2);
        
        
        var degrees = parseInt(utils.convertToRange(activeVisitors,[0,averageVisitors],[180,0]),10);
        
        if (isNaN(degrees)) {
          degrees = 0;
        }
        spark.pushToSpark(degrees);
      });
    },  15 * 1000 ); //15 seconds

    historyInterval = setInterval(function(){
      getAverageHistory(function(visitors){
        averageVisitors = visitors;
      });
    }, 60 * 60  * 1000 ); //1 hour

    //okay to be down here because of 15 second timeout
    //of getRealTimeVisits
    getAverageHistory(function(visitors){
        averageVisitors = visitors;
    });

  } else {
    clearInterval(liveInterval);
    clearInterval(historyInterval);
  }
  return status;
};



