/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var request      = require('request'),
    fs           = require('fs'),
    priv         = require('../private'),
    googleapis   = require('googleapis'),
    OAuth2Client = googleapis.OAuth2Client;

// Client ID and client secret are available at
// https://code.google.com/apis/console
var CLIENT_ID =  priv.client_id //'430221348997-mp00vok0iee770hk2tvrt8jr3vphlpgn.apps.googleusercontent.com';
var CLIENT_SECRET = priv.client_secret;
var REDIRECT_URL = 'http://localhost:3000/authorize_redirect';

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var getAccessToken = module.exports.getAccessToken = function(code, callback) {

    oauth2Client.getToken(code, function(err, tokens) {
      oauth2Client.setCredentials(tokens);
      console.log(tokens)
      callback(tokens);
    });

};

var getLocalToken = module.exports.getLocalToken = function(cb) {
  fs.readFile(__dirname+'/token.json', function(err,token){
    token = JSON.parse(token);
    cb(token);
  });
};


var saveLocalToken = module.exports.saveLocalToken = function(token, cb) {
  fs.writeFile(__dirname+'/token.json', JSON.stringify(token) , cb );
};


var generateAuthUrl = module.exports.generateAuthUrl = function() {
  var url = oauth2Client.generateAuthUrl({
    access_type:'offline',
    scope: 'https://www.googleapis.com/auth/analytics.readonly'
  });

  return url;
};


var refreshToken = module.exports.refreshToken = function(callback) {
  getLocalToken(function(token){
    request.post({
      url:'https://accounts.google.com/o/oauth2/token',
      form:{
        refresh_token: token.refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    }, function(e,r, body){
      var freshToken = JSON.parse(body);
      if (freshToken.error) {
        callback(freshToken.error, null);
      } else {
        token.access_token = freshToken.access_token;
        saveLocalToken(token, function(){
          callback(e, token);
        });
      }
      
    });
  });
};





var getRealtimeVisits = module.exports.getRealtimeVisits = function(callback, attempt) {

  var key         = priv.ga_key,
      property_id = '15295270',
      ga_url      = 'https://www.googleapis.com/analytics/v3/data/realtime?ids=ga%3A'+property_id+'&metrics=ga%3AactiveVisitors&key='+key;

  getLocalToken(function(token){
    request.get({
      url:ga_url,
      headers: {
        Authorization: 'Bearer '+ token.access_token
      }
    }, function(err, response, body){
      
      if (err && typeof regenerate !== 'undefined') {
        refreshToken(e, function(){
          getRealtimeVisits(callback, true);
        });
        return;
      } else if (err) {
        throw err;
      }
      body = JSON.parse(body);
      callback(body);
    });
  });
};