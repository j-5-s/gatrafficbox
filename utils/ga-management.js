/**
 * Copyright 2013 Google Inc. All Rights Reserved.
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

var googleapis = require('googleapis'),
    priv = require('../private'),
    fs     = require('fs'),
    google = require('./google');

// Client ID and client secret are available at
// https://code.google.com/apis/console
var CLIENT_ID = '430221348997-mp00vok0iee770hk2tvrt8jr3vphlpgn.apps.googleusercontent.com';
var CLIENT_SECRET = priv.ga_key;
var REDIRECT_URL = 'http://localhost:3000/authorize_redirect';


module.exports.getAccounts = function(callback){
  google.getLocalToken(function(token){

    if (typeof token.access_token === 'undefined') {
      return callback(new Error('No token is set'),null );
    }
    var auth = new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

    auth.setCredentials({
      access_token: token.access_token
    });

    // Load Google Analytics v3 API resources and methods
    googleapis
        .discover('analytics', 'v3')
        .execute(function(err, client) {

        // Insertion example
        client
            .analytics.management.accounts.list()
            .withAuthClient(auth)
            .execute(function(err, result) {
              if (err) {
                return callback(err);
              }
              callback(null, result);
            });
    });
  });
};


module.exports.getProperties = function( accountId, cb ) {

  google.getLocalToken(function(token){
    var auth = new googleapis.OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

    auth.setCredentials({
      access_token: token.access_token
    });
    console.log(accountId)
    // Load Google Analytics v3 API resources and methods
    googleapis
        .discover('analytics', 'v3')
        .execute(function(err, client) {

        // Insertion example
        client
            .analytics.management.webproperties.list({accountId:accountId})
            .withAuthClient(auth)
            .execute(function(err, result) {
              console.log(result)
              if (err) {

                console.log("Error", err);
                return cb(err);
              }
              cb(null, result);
            });
    });
  });
};

module.exports.getLocalGAAccount = function( callback ){
  fs.readFile(__dirname+ '/ga.json', function(err, data){
    callback(JSON.parse(data));
  });
}




