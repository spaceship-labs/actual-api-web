/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */
var async = require('async');
var Promise = require('bluebird');
var _ = require('underscore');

module.exports.models = {

  /***************************************************************************
  *                                                                          *
  * Your app's default connection. i.e. the name of one of your app's        *
  * connections (see `config/connections.js`)                                *
  *                                                                          *
  ***************************************************************************/
  // connection: 'localDiskDb',

  /***************************************************************************
  *                                                                          *
  * How and whether Sails will attempt to automatically rebuild the          *
  * tables/collections/etc. in your schema.                                  *
  *                                                                          *
  * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html  *
  *                                                                          *
  ***************************************************************************/
  // migrate: 'alter'
  migrate: 'safe',
  connection: 'mongodb',

  updateAvatar : function(req,opts){
    var query = {id: opts.id};
    if(opts.dir == 'products'){
      query = {ItemCode: opts.id};
    }
    return this.findOne(query)
      .then(function(obj){
        return obj.updateAvatar(req,opts);
      });
  },
  destroyAvatar : function(req,opts,cb){
    var query = {id:opts.id};
    if(opts.dir == 'products'){
      query = {ItemCode: opts.id};
    }
    return this.findOne(query)
      .then(function(obj){
        return obj.destroyAvatar(req,opts);
      });
  },

  updateAvatarSap : function(req,opts,cb){
    var query = {id: opts.id};
    if(opts.dir == 'products'){
      query = {ItemCode: opts.id};
    }
    this.findOne(query).exec(function(e,obj){
      if(e) return cb && cb(e,obj);
      obj.updateAvatarSap(req,opts,cb);
    });
  },

  /*
  beforeCreate: function(values, next){
  }*/

  attributes : {
    hash: {type:'string'},
    /*createdBy: {
      model:'User'
    },
    */
    updateAvatar : function(req,opts,cb){
      var object = this;
      opts.file = mapIconFields(object);
      
      if(process.env.CLOUDUSERNAME){ //if remote
        opts.avatar = true;
        opts.filename = object.icon_filename ? object.icon_filename : null;
        
        return Files.saveFiles(req, opts)
          .then(function(files){

            object.icon_filename = files[0].filename;
            object.icon_name = files[0].name;
            object.icon_type = files[0].type;
            object.icon_typebase = files[0].typebase;
            object.icon_size = files[0].size;
            
            return object.save();
          })
          .then(function(){
            if(opts.file && opts.file.filename){
              return Files.removeFile(opts);                          
            }
            return object;
          });
      }
      else{ //If local save
        Files.saveFiles(req, opts)
          .then(function(files){
            
            object.icon_filename = files[0].filename;
            object.icon_name = files[0].name;
            object.icon_type = files[0].type;
            object.icon_typebase = files[0].typebase;
            object.icon_size = files[0].size;
            opts.filename = object.icon_filename;
            return Files.makeCrops(req,opts);            
          })
          .then(function(crops){
            if(opts.file && opts.file.filename){
              return Files.removeFile(opts);
            }
            return object.save();
          })
          .then(function(){
            return object;
          });
      }
    },
    
    destroyAvatar : function(req,opts){
      object = this;
      opts.file = mapIconFields(object);
      return Files.removeFile(opts)
        .then(function(result){
          console.log('result destroy avatar', result);
          object.icon_filename = null;
          object.icon_name = null;
          object.icon_type = null;
          object.icon_typebase = null;
          object.icon_size = null;
          return object.save();
        })
        .then(function(){
          return object;
        });
    },

    addFiles : function(req,opts){
      var object = this;
      var objectFiles = object.files ? object.files : [];
      req.onProgress = getOnProgress(req);
      
      if(process.env.CLOUDUSERNAME){
        opts.avatar = true;
      }

      return Files.saveFiles(req, opts)
        .then(function(uploadedFiles){

          return Promise.each(uploadedFiles,function(file){
            //var mapCallback = req.onProgress.nextElement(uploadedFiles,async_callback);
            sails.log.info('file uploaded', file);
            objectFiles.push(file);
            opts.filename = file.filename;
            
            if(file.typebase == 'image' && !opts.avatar){
              return Files.makeCrops(req,opts);
            }else{
              return file;
            }
          });
        })
        .then(function(crops){
          sails.log.info('crops created', crops);
          object.files.add(objectFiles);
          return object.save();
        })
        .then(function(){
          return object;            
        });
    },

    removeFiles : function(req,opts,cb){
      var object = this;
      var files = opts.files ? opts.files : [];
      var FileModel = opts.fileModel;
      files = Array.isArray(files) ? files : [files];
      filesToDelete = [];
      return Promise.each(files, function(file){
        opts.file = file;
        var fileIndex = getFileIndex(opts.file, object.files);
        var fileId  = object.files[fileIndex].id;
        sails.log.info('destroy id', fileId);
        //sails.log.info('destroy index', fileIndex);
        return FileModel.destroy({id: fileId})
          .then(function(destroyedFile){
            object.files.splice(fileIndex, 1);
            return Files.removeFile(opts);
          });
      })
      .then(function(files){
        sails.log.info('object.files final');
        return object.save();
      });
    },

    updateAvatarSap : function(internalFiles,opts,cb){
      var object = this;
      opts.file = mapIconFields(object);
      if(process.env.CLOUDUSERNAME){
        opts.avatar = true;
        opts.filename = object.icon_filename?object.icon_filename : null;
        Files.saveFilesSap(internalFiles,opts,function(err,files){
            if(err) return cb(err);
            object.icon_filename = files[0].filename;
            object.icon_name = files[0].name;
            object.icon_type = files[0].type;
            object.icon_typebase = files[0].typebase;
            object.icon_size = files[0].size;

            object.save(cb);
            if(opts.file && opts.file.filename)
                Files.removeFile(opts,function(err){
            });
        });
        return;
      }

      async.waterfall([
        function(callback){
          Files.saveFilesSap(internalFiles,opts,callback);
        },
        function(files,callback){
          object.icon_filename = files[0].filename;
          object.icon_name = files[0].name;
          object.icon_type = files[0].type;
          object.icon_typebase = files[0].typebase;
          object.icon_size = files[0].size;
          opts.filename = object.icon_filename;
          Files.makeCrops(internalFiles,opts,callback)
        },
        function(crops,callback){
          console.log('remove',opts.file);
          if(opts.file && opts.file.filename) Files.removeFile(opts,callback);
          else callback(null,crops);
        },
      ],function(e,results){
        if(e) console.log(e);
        object.save(cb);
      });
    },

  }


};

function getFileIndex(file, files){
  fileIndex = false;
  for(var i = 0;i<files.length;i++){
    if(files[i].filename == file.filename){  
      fileIndex = i;
    }
  }
  return fileIndex;
}

function mapIconFields(obj){
  var icon = {};
  icon = {
    filename: obj.icon_filename,
    type: obj.icon_type,
    typebase: obj.icon_typebase,
    size: obj.icon_size
  };
  return icon;
}


function getOnProgress(req){
  var salt = 5;
  var uid = req.param('uid');
  var index = req.param('index');
  var indice = 1;
  //console.log( '---- uid: ' + uid + ' ---- index: ' + index );
  return{
    fileProgress:function(progress){
      var written = progress.written,
      total = progress.stream.byteCount*2,//time crops.
      porcent = (written*100/total).toFixed(2);
      if(porcent >= salt){
        salt += salt;
        sails.io.sockets.emit(uid, {porcent: porcent,index:index});
      }
    },
    nextElement:function(files,cb){//de a 1
      var size = files && files.length;
      return function(err){
        if(size){
          var porcent =  100;
          sails.io.sockets.emit(uid, {
              porcent:porcent,
              index:index,
              file:files[0]
          });
          indice++;
        }
        cb(err);
      };
    }
  };
}
