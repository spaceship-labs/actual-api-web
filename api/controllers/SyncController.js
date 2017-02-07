var Promise = require('bluebird');

module.exports = {
  syncProductByItemCode: function(req, res){
    sails.log.info('sync');
    var form = req.allParams();
    var itemCode = form.itemcode;

    Common.nativeFindOne({ItemCode: itemCode})
      .then(function(exists){
        if(exists){
          return Promise.reject(new Error('Este producto ya existe'));
        }
        return SapService.syncProduct(itemCode);
      })
      .then(function(response){
        res.json(response);
      }).catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  fixOrders: function(req, res){
  	//Common.reassignOrdersDates();
  }
};

