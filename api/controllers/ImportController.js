var request = require('request');
var fs = require('fs');
var pathService = require('path');
var Promise = require('bluebird');

module.exports = {
  importImagesSap: function(req, res){
    var form = req.params.all();
    var limit = form.limit || 10;
    //var skip = 2477;
    var skip = 0;
    productsList = [];
    photosUploaded = 0;
    prodCount = 0;
    waitingTime = 0;
    sails.log.debug('limit : ' + limit);
    Product.find({},{select:['ItemCode','PicturName','icon_filename']})
      .sort('Available DESC')
      .skip(skip)
      .limit(limit)
      .then(function(products){
        var uploader = new SyncService.ProductImageUploader();
        return uploader.updateIcons(products);
      })
      .then(function(productsList){
        res.json(productsList);        
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  importBrokersToUsers: function(req, res){
    SyncService.importBrokersToUsers()
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        sails.log.info('err');
        sails.log.info(err);
        res.negotiate(err);
      });
  }
};


