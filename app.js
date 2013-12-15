
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var auth = require('http-auth');

var app = express();

var basic = auth.basic({
    realm: "GA TrafficBox",
    file: __dirname + "/users.htpasswd" // gevorg:gpass, Sarah:testpass ...
});

app.use(auth.connect(basic));


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}



// All routes will try to access GA data first
// except for the authorize `routes`
app.all( '*' , routes.gaMiddleware );

app.get('/', routes.index);
app.get('/accounts', routes.accounts);
app.post('/accounts', routes.accounts_update);
app.get('/authorize', routes.authorize);
app.get('/authorize_redirect', routes.authorize_redirect);
app.get('/revoke', routes.revoke);
app.get('/get_visits', routes.get_visits);
app.get('/list_properties/:id', routes.list_properties);
app.post('/toggle_status', routes.toggle_status);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
