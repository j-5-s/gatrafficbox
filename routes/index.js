var url = require('url'),
    utils = require('../utils'),
    google  = require('../utils/google'),
    request = require('request'),
    gaManagement = require('../utils/ga-management'),
    app = require('../utils/app'),
    fs  = require('fs');

//GA Login middleware
var gaMiddleware = exports.gaMiddleware = function(req, res, next) {

  if (/authorize/.test(req.params[0])){
    return next();
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

      fs.writeFile(__dirname +'/../utils/ga.json', JSON.stringify(data, null, " "), function(){
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
    fs.writeFile( __dirname + '/../utils/token.json',JSON.stringify(tokens), function(err){
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

