var express = require('express'),
  path = require('path'),
  config = require('./config/config.js'),
  know = require('knox'),
  fs = require('fs'),
  os = require('os'),
  formidable = require('formidable'),
  gm = require('gm')


var app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || 3000);
app.set('host', config.host);

//Knox config
var knowClient = know.createCLient({
  //3 values key, secret, bucket
  key: config.S3AcessKey,
  secret: config.S3Secret,
  bucket: config.S3Bucket
});

//send the express and the app to the module
require('./routes/routes.js')(express,app, formidable, fs, os, gm);


// http server and socket.io
var server = require('http').createServer(app);
var io = require('socket.io')(server);



server.listen(app.get('port'), function(){
	console.log('PhotoGRID Running on port: ' + app.get('port'));
})

