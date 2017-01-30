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
    var storeId = form.storeId;
    var store = false;
    Store.findOne({id:storeId}).populate('Warehouse')
      .then(function(storeResult){
        store = storeResult;
        return Product.findOne({ItemCode: productCode});
      })
      .then(function(product){
        return Shipping.product(product, store.Warehouse);        
      })
      .then(function(shipping) {
        return res.json(shipping);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }
};

