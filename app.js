var express = require('express'),
  path = require('path'),
  config = require('./config/config.js'),
  knox = require('knox'),
  fs = require('fs'),
  os = require('os'),
  formidable = require('formidable'),
  gm = require('gm'),
  mongoose = require('mongoose').connect(config.dbURL);


var app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || 3000);
app.set('host', config.host);

//Knox config
//3 values key, secret, bucket
var knoxClient = knox.createClient({  
  key: config.S3AccessKey,
  secret: config.S3Secret,
  bucket: config.S3Bucket
});



// http server and socket.io
var server = require('http').createServer(app);
var io = require('socket.io')(server);


//send the express and the app and other modules to the route handler
require('./routes/routes.js')(express,app, formidable, fs, os, gm, knoxClient, mongoose, io);


server.listen(app.get('port'), function(){
	console.log('PhotoGRID Running on port: ' + app.get('port'));
})

