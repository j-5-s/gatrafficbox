var url = require('url'),
    helpers = require('../application/helpers'),
    google  = require('../application/google'),
    request = require('request'),
    gaManagement = require('../application/ga-management'),
    app = require('../application/app'),
    fs  = require('fs');

//GA Login middleware
var gaMiddleware = exports.gaMiddleware = function(req, res, next) {

  //setup check. If the user does not have all ga data,
  //reroute them to setup

  if (/authorize|setup|javscripts|stylesheets|vendor|images/.test(req.params[0])){
    return next();
  }

  if (!isSetup()) {
    return res.redirect('/setup?redirect=true');
  }

  gaManagement.getLocalGAAccount(function(localAccount){
    gaManagement.getAccounts(function(err, accounts){
      if (err) {
          //attempt to refresh
          if (typeof req.refresh_attempted === 'undefined') {
            google.refreshToken(function(e){
              if (e) {
                return res.redirect('authorize');
              } else {
               req.refresh_attempted = true;
               return gaMiddleware(req,res,next);
              }
            });
         } else {
           return res.redirect('authorize');
         }
      } else {
        req.accounts = accounts;
        req.localAccount = localAccount;
        next();
      }
      
    });
  });

  
};

var isSetup = function() {
  var obj = require('../private');
  var keys = Object.keys(obj)
  for (var m in obj) {
    if (obj[m].hasOwnProperty && obj[m] ==='' || keys.length < 8) {
      return false;
    }
  }
  return true;
};

/*
 * GET home page.
 */
var index = exports.index = function(req, res, next){

    var localAccount = req.localAccount,
        accounts = req.accounts;
    google.getRealtimeVisits(function(response){
      app.getAverageHistory(function(averageHistory){
        
        res.render('index', { 
          title: 'GA TrafficBox',
          status: app.getStatus(),
          localAccount:localAccount,
          activeVisitors:response.totalResults,
          averageHistory: averageHistory,
          accounts:accounts, 
          page: 'home' 
        });
      });
    });
};

exports.setup = function(req, res) {
  var obj = require('../private'),
      e = '';

  if (req.query && req.query.redirected) {
    e = 'Please enter all information before proceeding'
  }
  res.render('setup',{page:'setup', setup:obj, status:'', error: e}); 
};

exports.setup_post = function(req, res) {
  var body = req.body;
  var obj = require('../private'),
      e = '';
  for (var field in body) {
    var f = body[field];
    if (f === '') {
      e = 'Please enter all fields'
      break;
    }
    obj[field] = f;
  }
  if (e.length) {
    return res.render('setup', {page:'setup', setup: obj,error:'Please enter all fields', status: ''})
  } 

  
  if (body.user_name === 'admin' && body.password === 'admin') {
    return res.render('setup', {page:'setup', setup: obj,error:'Please change your username/password', status: ''})
  }

  var str = 'module.exports = ' + JSON.stringify(obj, null, ' ');
  fs.writeFile(__dirname + '/../private.js', str, function(){
    var htpasswd = obj.user_name + ':' + obj.password;
    fs.writeFile(__dirname + '/../users.htpasswd', htpasswd, function(){
      res.render('setup', {page:'setup', setup: obj, status: 'updated'});
    });
  });
}

//update to the GA account the user wants
exports.accounts = function(req, res) {
  var localAccount = req.localAccount,
      accounts = req.accounts;

      res.render('accounts', {
        title: 'GA TrafficBox',
        localAccount:localAccount,
        accounts:accounts,
        
        page: 'accounts'
      });

};

//Post of GA account page
exports.accounts_update = function( req, res ) {
  var body = req.body,
      profile_id = body.profile_id.split('|'),
      account_id = body.account.split('|');
      var data = {
        "account": {
          "id": account_id[0],
          "name": account_id[1]
        },
        "profile": {
          "id": profile_id[0],
          "name": profile_id[1]
        }
      };

      fs.writeFile(__dirname +'/../application/ga.json', JSON.stringify(data, null, " "), function(){
        res.redirect('/accounts');
      });

};

//JSON response for ajax request on accounts page
exports.list_properties = function(req, res) {
  var id = req.params.id;
  gaManagement.getProperties(id, function(err, properties){
    if (err) {
      return res.redirect('/authorize');
    }
    
    res.json(properties);
  });
};

//Authorize page to generate oauth link for GA
exports.authorize = function(req, res) {
  var url = google.generateAuthUrl({
    access_type:'offline',
    scope: 'https://www.googleapis.com/auth/analytics.readonly'
  });
  res.render("authorize",{
    url:url,
    page: 'authorize'
  });
};

//oauth redirect to create the access token
exports.authorize_redirect = function(req, res){
  var code = req.query.code;
  google.getAccessToken(code, function(tokens){
    fs.writeFile( __dirname + '/../application/token.json',JSON.stringify(tokens), function(err){
      if (err) {
        throw err;
      }
      return res.redirect('/?authorized=true');
    });
  });
};

//JSON response for vistits
// (used for debugging)
exports.get_visits = function(req,res) {
  app.getRealTimeVisits(1, function(visits){
    res.render('get_visits',{visits:JSON.stringify(visits)});
  });
};

//Turns on and off the app
exports.toggle_status = function(req, res) {
  var status = app.toggleStatus();
  res.json({on:status});
};

exports.revoke = function(req, res) {
  google.getLocalToken(function(token){
    request.get({url:'https://accounts.google.com/o/oauth2/revoke?token='+token.access_token},function(e,r,body){
      if (e) throw (e);
      return res.redirect('/authorize');
    });
  });
};

exports.debug_visits = function(req, res) {
  fs.readFile(__dirname + '/../application/visits.json', function(err, body){
    var visits = JSON.parse(body);
    res.json(visits);
  });
};

exports.debug_ga = function(req, res) {
  fs.readFile(__dirname + '/../application/ga.json', function(err, body){
    var ga = JSON.parse(body);
    res.json(ga);
  });
};

exports.debug_spark = function(req, res) {
  fs.readFile(__dirname + '/../application/spark.log', function(err, body){
    
    res.send(body)
  });
};

