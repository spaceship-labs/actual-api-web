var fs = require('fs');
var im = require('imagemagick');
var adapterPkgCloud = require('skipper-pkgcloud');
var async = require('async');
var gm = require('gm');//crops con streams.
var gmIm = gm.subClass({imageMagick:true});
var mime  = require('mime');
var Promise = require('bluebird');
var _ = require('underscore');

var fileTypes2Crop = {
    'image/jpeg':true,
    'image/png': true,
    'image/gif': true
};

module.exports = {
  saveFiles: saveFiles,
  removeFile: removeFile,
  makeCrops: makeCrops
};

function saveFiles(req,opts,cb){
  var directoryToSaveIn = __dirname+'/../../assets/uploads/'+opts.dir+'/';
  var $files = req.file && req.file('file')._files || [];
  var maxBytes = 22020096;//max 21mb. //Before 52428800

  return new Promise(function(resolve, reject){

    sails.log.info('saving files', $files);

    if(req._fileparser.upstreams.length && $files.length > 0){

      if(req._fileparser.form.bytesExpected >= maxBytes){
        reject(new Error('exceeds maxBytes')); //throw en controllers
      }
      
      var uploadedFiles = [];
      var uploadOptions = {
        saveAs: generateFileName,
        dirname: directoryToSaveIn, //Only on local without Cloud Files connection
        onProgress:(req.onProgress && req.onProgress.fileProgress || null),
        maxBytes: maxBytes
      };

      if(process.env.CLOUDUSERNAME && !opts.disableCloud){
        var dirName = '/uploads/' + opts.dir + '/';

        uploadOptions = _.extend(uploadOptions,{
          adapter  : adapterPkgCloud,
          dirname  : dirName,
          username : process.env.CLOUDUSERNAME,
          apiKey   : process.env.CLOUDAPIKEY,
          region   : process.env.CLOUDREGION,
          container: process.env.CLOUDCONTAINER
        });

        if(opts.avatar){
          uploadOptions.after = function onFinishUpload(stream, filename, next){
            var lookup = mime.lookup(filename);
            if(!fileTypes2Crop[lookup])
              return next();

            opts.srcData = stream;
            opts.filename = filename;
            makeCropsStreams(uploadOptions, opts, next);
          };
        }
      }

      req.file('file').upload(
        uploadOptions,
        function(e,files){
          if(e){
            console.log('error saveFiles',e);
            reject(e);
          }
          var uploadedFiles = mapUploadedFiles(files);
          if(uploadedFiles.length === 0){
            reject('Error al subir imagenes');
          }
          sails.log.info('uploadedFiles', uploadedFiles);
          resolve(uploadedFiles);
        });      

    }
    else{
      reject('No hay imagenes por subir');
    }

  });
}

function mapUploadedFiles(files){
  var uploadedFiles = [];
  if(!files){
    return [];
  }
  files.forEach(function(file){
    var filename = file.fd.split('/');
    filename = filename[filename.length-1];
    var typebase = file.type.split('/');
    uploadedFiles.push({
      filename : filename, 
      name : file.filename,
      type : file.type,
      size : file.size,
      typebase : typebase[0],
    });
  });
  return uploadedFiles;  
}


function generateFileName(_stream,callback){
  var error = null;
  var extension = _stream.filename.split('.');
  var fileName = new Date().getTime().toString()+Math.floor(Math.random()*10000000).toString();

  if(extension.length){
    extension = extension[extension.length-1];
    fileName += '.'+extension;
  }
  callback(error,fileName);
}

// crop streams rackspace.
//Makes crops acording to a profile defined in config/images.js
function makeCropsStreams(uploadOptions, opts, cb){
  var sizes = sails.config.images[opts.profile];
  var adapter = adapterPkgCloud(uploadOptions);
  opts.dirSave = '/uploads/'+opts.dir+'/';

  if(!sizes || sizes.length === 0) return cb();

  var individualCropStream = function(size, next){
    var wh = size.split('x');
      gmIm(opts.srcData)
      .resize(wh[0], wh[1], '^')
      .gravity('Center')
      .crop(wh[0], wh[1], 0, 0)
      .stream(function(err, stdout, stderr){
          if(err){
            console.log('error makeCropsStreams', err);
            return next(err);
          }
          var fileName = size + opts.filename;
          sails.log.info('fileName individualCropStream', fileName);

          stdout.pipe(
            adapter.uploadStream({
              dirSave:opts.dirSave,
              name: fileName 
            }, next)
          );
      });

  };

  async.each(sizes, individualCropStream, cb);
}


//Deletes a File and Crops if profile is specified;
function removeFile(opts){
  var adapter = getAdapterConfig();
  var remoteSaveDir = '/uploads/'+opts.dir+'/';
  var localSaveDir = __dirname+'/../../assets/uploads/'+opts.dir+'/';

  var dirSave = adapter? remoteSaveDir : localSaveDir;
  var sizes = opts.profile ? sails.config.images[opts.profile] : [];
  var filename = opts.file.filename;
  var routes = [dirSave+filename];

  //Gets routes for different sizes
  if(opts.file.typebase == 'image'){ 
    sizes.forEach(function(size){
      routes.push(dirSave+size+filename);
    });
  }

  sails.log.info('files to remove', routes);

  return new Promise(function(resolve, reject){
    if(adapter){ //if remote
      async.each(routes, adapter.rm, function(err){
        if(err) reject(err);
        resolve();
      });
    }
    else{ //if local
      async.map(routes,fs.unlink,function(err){
        if(err) reject(err);
        resolve();
      });
    }
  });
}


function getAdapterConfig(){
  if(process.env.CLOUDUSERNAME){
    var uploadOptions = {
      username: process.env.CLOUDUSERNAME,
      apiKey: process.env.CLOUDAPIKEY,
      region: process.env.CLOUDREGION,
      container: process.env.CLOUDCONTAINER
    };
    return adapterPkgCloud(uploadOptions);
  }
  return false;
}

module.exports.containerCloudLink = '';

//Runs in bootstrap
//or '' if not setting
module.exports.getContainerLink = function(next){ 
  if(module.exports.containerCloudLink){
    if(next) return next(null, containerCloudLink);
    return containerCloudLink;
  }

  var adapter = getAdapterConfig();
  if(adapter){
    adapter.getContainerLink(function(err, link){
      module.exports.containerCloudLink = link || '';
      if(next) return next(err, module.exports.containerCloudLink);
    });
  }else{
    module.exports.containerCloudLink = '';
    if(next) return next(null, module.exports.containerCloudLink);
    return module.exports.containerCloudLink;
  }
};

module.exports.middleware = function(req, res, next){
  if(req.url.indexOf('/uploads/') !== 0 || Files.containerCloudLink === ''){
    next();
  }else{
    res.redirect(301, module.exports.containerCloudLink + req.url);
  }
};

module.exports.saveFilesSap = function(internalFiles,opts,cb){
  var dirSave = __dirname+'/../../assets/uploads/'+opts.dir+'/';
  //var $files = req.file && req.file('file')._files || [],
  maxBytes = 22020096;//max 21mb.
  if(internalFiles){
    /*
    if(req._fileparser.form.bytesExpected>=maxBytes){
      //cb(new Error('exceeds maxBytes')); //throw en controllers
      cb(false,[]);
    }
    */
    var fFiles = [];
    var uploadOptions = {
      saveAs:generateFileName,
      dirname:dirSave,
      //onProgress:(req.onProgress && req.onProgress.fileProgress || null),
      maxBytes:52428800
    };

    if(process.env.CLOUDUSERNAME && !opts.disableCloud){
      uploadOptions.adapter = adapterPkgCloud;
      uploadOptions.username = process.env.CLOUDUSERNAME;
      uploadOptions.apiKey = process.env.CLOUDAPIKEY;
      uploadOptions.region = process.env.CLOUDREGION;
      uploadOptions.container = process.env.CLOUDCONTAINER;
      uploadOptions.dirname = '/uploads/' + opts.dir + '/';
      if(opts.avatar)
        uploadOptions.after = function(stream, filename, next){
          var lookup = mime.lookup(filename);
          if(!fileTypes2Crop[lookup])
            return next();

          opts.srcData = stream;
          opts.filename = filename;
          Files.makeCropsStreams(uploadOptions, opts, next);
        };
    }
    internalFiles.upload(
      uploadOptions,
      function(e,files){
        if(e){
          console.log('error saveFilesSap',e);
          return cb(e,files);
        }
        files.forEach(function(file){

          //TODO dont override
          var extension = Common.getImgExtension(filename);
          file.type = 'image/' + extension;

          var filename = file.fd.split('/');
          filename = filename[filename.length-1];
          var typebase = file.type.split('/');
          fFiles.push({
            filename : filename,
            name : file.filename,
            type : file.type,
            size : file.size,
            typebase : typebase[0],
          });
        });
        cb(e,fFiles);
      });
  }else{
    return cb(true,false);
  }
};


/*----------------------------/
  LOCAL SAVING
/*---------------------------*/

//Local makecrops 
//Makes crops acording to a profile defined in config/images.js
function makeCrops(req,opts,cb){
  var sizes = sails.config.images[opts.profile];
  opts.dirSave = opts.dirSave || __dirname + '/../../assets/uploads/'+opts.dir+'/';
  opts.dirPublic = __dirname +'/../../.tmp/public/uploads/' + opts.dir + '/';
  
  return Promise.each(sizes,function(size){
    return makeCrop(size, opts);
  });
}

//
//Locally makes individual Crop
function makeCrop(size,opts,cb){
  //Todo make delete crops function
  //if(opts.lastIcon) fs.unlink(opts.dirSave+size+opts.lastIcon,function(){});
  var wh = size.split('x');
  var opts2 = {
    srcPath:opts.dirSave+opts.filename,
    dstPath:opts.dirSave+size+opts.filename,
    width:wh[0],
    height:wh[1],
    gravity: 'Center'
  };

  return new Promise(function(resolve, reject){
    
    im.crop(opts2,function(err,stdout,stderr){
      if(err) return cb && cb(err);
      var route = opts.dirSave+size+opts.filename;
      
      fs.createReadStream(route)
        .pipe(fs.createWriteStream(opts.dirPublic+size+opts.filename))
        .on('finish',function(){
          resolve({route:route, size:size});
          //return cb && cb(null,{route:route,size:size});
        })
        .on('error',function(err){
          console.log('error with the crop');
          reject(err);
          //return cb && cb(null,false);
          //return cb && cb(true);
        });
    });

  });
}