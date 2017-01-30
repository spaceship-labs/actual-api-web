var baseUrl = 'http://sapnueve.homedns.org:8080/';
var request = require('request');
var Promise = require('bluebird');
var BROKER_ROLE_ID = "57915b6d81e8947014bec270";
var ACTUAL_HOME_ID = '57bf590089c75aed0825c3f2';
var fs = require('fs');

module.exports = {
  syncProducts: syncProducts,
  importBrokersToUsers: importBrokersToUsers,
  ProductImageUploader: ProductImageUploader
};

function syncProducts(){
  return new Promise(function(resolve, reject){
    request.get(baseUrl + 'Product', function(err, response, body){
      if(err){
        reject(err);
      }else{
        sails.log.info(response);
        sails.log.info(body);
        resolve(response);
      }
    });
  });
}

function importBrokersToUsers(){
  var users = [];
  var brokerUsersEmails = [];
  return User.find({
    role: BROKER_ROLE_ID,
    select:['email']
  })
  .then(function(brokerUsers){
    sails.log.info('brokerUsers: ' + brokerUsers.length);
    brokerUsersEmails = brokerUsers.map(function(buser){
      return buser.email;
    });
    return;
  })
  .then(function(){
    return BrokerSAP.find({ U_email: {'!':null}  });
  })
  .then(function(brokers){
    newUsers = brokers.map(mapBrokersToUsers);
    newUsers = newUsers.filter(function(u){
      if(brokerUsersEmails.indexOf(u.email) == -1){
        sails.log.info('Email de broker no registrado: ' + u.email);
      }
      return brokerUsersEmails.indexOf(u.email) === -1;
    });
    newUsers = _.uniq(newUsers, function(u){
      return u.email;
    });
    return User.create(newUsers);
  })
  .then(function(created){
    return newUsers;
  });
}

function mapBrokersToUsers(broker){
  var params = {
    firstName : broker.Name,
    brokerName : broker.Name,
    brokerCode: broker.Code,
    password: generateRandomString(8),
    //password: "1234",
    activeStore: ACTUAL_HOME_ID,
    mainStore: ACTUAL_HOME_ID,
    email: broker.U_email,
    role: BROKER_ROLE_ID,
    Stores: [ACTUAL_HOME_ID]
  };
  return params;
}

function generateRandomString(length) {
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}


function streamToFile(inStream, filename) {

  var Upstream = require('skipper/standalone/Upstream');
  var stream = require('stream');
  var imgName = filename;

  function ByteCountStream(opts){
    stream.Transform.call(this, opts);
    this.byteCount = 0;
    var extension = Common.getImgExtension(imgName);
    this.filename = 'generico.' + extension;
    this.type = 'image/' + extension;
    this._transform = function(chunk, encoding, done){
      this.byteCount += chunk.length;
      return done(null, chunk);
    };
  }
  ByteCountStream.prototype = Object.create(stream.Transform.prototype);
  var file = new Upstream(), intermediary = new ByteCountStream();
  inStream.pipe(intermediary);
  file.writeFile(intermediary);
  file.noMoreFiles();
  return file;
}

var photosUploaded = 0;
var productsList = [];
var waitingTime = 0;

function updateIconFromBase64(product){
  var base64Img = product.base64Img;
  var itemCode = product.ItemCode;
  return new Promise(function(resolve, reject){

    if(photosUploaded%5 === 0 && photosUploaded !== 0){
      waitingTime = 60000;
    }else{
      waitingTime = 0;
    }    

    setTimeout(function(){
      Product.updateAvatarSap(internalFile,{
        dir : 'products',
        profile: 'avatar',
        id : itemCode,
      },function(e,product){
        if(e){
          console.log(e);
          resolve();
        }else{
          photosUploaded++;
          productsList.push({ItemCode: itemCode, status: 'con imagen SAP'});
          resolve();
        }
      });

    }, waitingTime);    
  });
}

function updateIcon(product){
  return new Promise(function(resolve, reject){
    photosUploaded = photosUploaded || 0;
    productsList = productsList || [];
    waitingTime = waitingTime || 0;
    var itemCode = product.ItemCode;
    var icon = product.icon_filename;
    var imgName = product.PicturName;
    var excludes = [];
    //sails.log.warn('Articulo: ' + itemCode +' | Icono : ' + icon);

    if(hasImage(imgName) && icon === null && excludes.indexOf(itemCode) < 0 ){
      var internalFile = getInternalFile(imgName);
      sails.log.debug('Articulo a subir : ' + itemCode  + ' , product index: ' + prodCount + ' imagen:' + imgName + ' | icon: ' + icon);
      sails.log.info('Fotos subidas: ' + photosUploaded + ' | Tiempo de espera: ' + waitingTime);

      if(photosUploaded%5 === 0 && photosUploaded !== 0){
        waitingTime = 60000;
      }else{
        waitingTime = 0;
      }

      setTimeout(function(){
        Product.updateAvatarSap(internalFile,{
          dir : 'products',
          profile: 'avatar',
          id : itemCode,
        },function(e,product){
          if(e){
            console.log(e);
            resolve();
          }else{
            photosUploaded++;
            productsList.push({ItemCode: itemCode, status: 'con imagen SAP'});
            resolve();
          }
        });

      }, waitingTime);
    }
    else if( excludes.indexOf(itemCode) > -1 ){
      productsList.push({ItemCode: itemCode, status: 'verificar imagen'});
      resolve();
    }

    else if(icon && icon!=='' && imgName && imgName !== ''){
      productsList.push({ItemCode: itemCode, status: 'con imagen SAP'});
      resolve();

    }
    else if(icon && icon!=='' && !imgName){
      productsList.push({ItemCode: itemCode, status: 'con imagen'});
      resolve();
    }    
    else{
      resolve();
    }
  });
}

function getInternalFile(imgName){
  var rootDir = '/home/luis/Pictures/ImagenesSAP/';
  var path = rootDir  + imgName;
  var rsfile = fs.createReadStream(path);
  var internalFile = streamToFile( rsfile, imgName );
  return internalFile;
}


function hasImage(imgName){
  return typeof imgName!= 'undefined' && imgName && imgName !== '';
}

function updateProductsIcons(products){
  return Promise.each(products, updateIcon)
    .then(function(){
      return productsList;
    });
}

function updateProductsIconsFromBase64(products){
  return Promise.each(products, updateIcon)
    .then(function(){
      return productsList;
    });
}

function ProductImageUploader(){
  var photosUploaded = 0;
  var productsList = [];  
  var waitingTime = 0;
  return {
    photosUploaded: photosUploaded,
    productsList: productsList,
    waitingTime: waitingTime,
    updateProductsIcons: updateProductsIcons,
    updateProductsIconsFromBase64: updateIconFromBase64
  };
}


