module.exports = function(express, app, formidable, fs, os, gm, knoxClient, mongoose, io) {

  var Socket;

  io.on('connection', function(socket){
    Socket = socket;  
  });

  // create a mongoose schema
  var singleImage = new mongoose.Schema({
    filename:String,
    votes:Number
  });

  var singleImageModel = mongoose.model('singleImage', singleImage);

  var router = express.Router();

    router.get('/', function(req, res, next) {
      res.render('index', {host:app.get('host')});
    });

    router.post('/upload', function(req, res, next){
      // File upload
    
    function generateFilename(filename) {
      //extract the filename
      var ext_regex = /(?:\.([^.]+))?$/;
      //get the name of the file name, not the rest of the path
      var ext = ext_regex.exec(filename)[1];
      var date = new Date().getTime();
      var charBank = 'abcdefghijqlmonprstuvwxyz';
      var fstring = '';
      for(var i = 0; i < 15; i++) {
        fstring += charBank[parseInt(Math.random()*26)];
      }
      return (fstring += date + '.' + ext);
    }


    var tmpFile, nFile, fname;
    var newForm = new formidable.IncomingForm();
    newForm.keepExtensions = true;
    // put into the req
    newForm.parse(req, function(err, fields, files) {
      tmpFile = files.upload.path;
      fname = generateFilename(files.upload.name);
      nfile = os.tmpdir() + '/' + fname;
      //send back as a response
      res.writeHead(200, {'Content-type':'text/plain'});
      res.end();
    });
    
    newForm.on('end', function() {
      fs.rename(tmpFile, nfile, function() {
        // resize the image to 300 pixels and upload this file into the S3 bucket
        gm(nfile).resize(300).write(nfile, function() {
          // finally upload the to s3 bucket
    
          //read the file
          fs.readFile(nfile, function(err, buf) {
            //provide a name for the file in the bucket
            // and a json object
            var req = knoxClient.put(fname, {
              'Content-Length': buf.length,
              'Content-Type': 'image/jpeg'
            });
    
            // once the s3 bucket respond
            req.on('response', function() {
              if (res.statusCode === 200) {
                // this means that the file is really in the S3 bucket :)

                //Save the image in the MongoDB
                var newImage = new singleImageModel({
                    filename: fname,
                    votes: 0
                }).save();
    
                // Socket events:
                // status
                // doUpdate
    
                //signal the front end that the file has been successfully uploaded
                Socket.emit('status', {'msg': 'Saved!!', 'delay':3000});
                // the momment this is done we need to update the gallery
                Socket.emit('doUpdate', {});
    
                // now delete the local file
                fs.unlink(nfile, function() {
                  console.log('local file deleted!');
                });
    
              }
            })
    
            req.end(buf);
          })
        })
      })
    })
  });


  router.get('/getimages', function(req, res ,next) {
    singleImageModel.find({}, null, {sort:{ votes:-1}}, function(err, result) {
      res.send(JSON.stringify(result));
    })
  })

  router.get('/voteup/:id', function(req, res, next) {
    console.log('voting...');
    //find a particular image in the database    
    //first param is the id of what we want
    //increment of the key 'votes' by one
    singleImageModel.findByIdAndUpdate(req.params.id, {$inc:{votes:1}}, function(err, result) {      
      res.send(200, {votes:result.votes});
    })
  })

  
// router.get('/voteup/:id', function(req, res, next){
//   console.log('voting now');
// 	singleImageModel.findByIdAndUpdate(req.params.id, {$inc:{votes:1}}, function(err, result){
// 		res.send(200, {votes:result.votes});
// 	})
// })
  app.use('/', router);
}


