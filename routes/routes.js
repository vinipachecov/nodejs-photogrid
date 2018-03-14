module.exports = function(express, app, formidable, fs, os, gm) {
  var router = express.Router();

    router.get('/', function(req, res, next) {
      res.render('index', {host:app.get('host')});
    });

    router.post('/upload', function(req,res,next) {

      // 1 - Receive the file with the formidable module
      // 2 - generate a new random file name
      // 3 - once the file uploads completely
      // 4 - fs reads the file
      // 5 - process the file to the s3bucket
      //do the upload

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
      var newForm = new formidable.incomingForm();
      newForm.keepExtensions = true;
      // put into the req
      newForm.parse(req, function(err, fields, files) {
        tmpFile = files.upload.path;
        fname = generateFilename(files.upload.name);
        nfile = os.tmpDir() + '/' + fname;
        //send back as a response
        res.writeHead(200, {'Content-type':'text/plain'});
        res.end();
      });

      newForm.on('end', function() {
        fs.rename(tmpFile, nfile, function() {
          // resize the image and upload this file into the S3 bucket
          gm(nfile).resize(300).write(nfile, function() {
            // finally upload the to s3 bucket
          });
        })
      })
    });

    app.use('/', router);
}