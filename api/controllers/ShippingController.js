/**
 * ShippingController
 *
 * @description :: Server-side logic for managing shippings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  product: function(req, res) {
    var form = req.allParams();
    var productCode = form.productCode;
    var store = false;
    var storeId = SiteService.getDefaultActiveStoreId(req);
    var zipcodeDeliveryId = form.zipcodeDeliveryId;
    var options = {
      zipcodeDeliveryId: zipcodeDeliveryId
    };

    Store.findOne({id:storeId}).populate('Warehouse')
      .then(function(storeResult){
        store = storeResult;
        return Common.nativeFindOne({ItemCode: productCode}, Product);
      })
      .then(function(product){
        return Shipping.product(product, store.Warehouse, options);        
      })
      .then(function(shipping) {
        return res.json(shipping);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  getZipcodeDelivery: function(req, res){
    var form = req.allParams();
    var zipcode = form.zipcode;

    ZipcodeDelivery.findOne({cp: zipcode, entrega: Shipping.DELIVERY_AVAILABLE})
      .then(function(zipcodeDelivery){
        res.json(zipcodeDelivery);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      })
  },

  getZipcodeDeliveryById: function(req, res){
    var form = req.allParams();
    var id = form.id;

    ZipcodeDelivery.findOne({id: id, entrega: Shipping.DELIVERY_AVAILABLE})
      .then(function(zipcodeDelivery){
        res.json(zipcodeDelivery);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      })
  },

};
