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
    if(!storeId || storeId === 'null'){
      storeId = SiteService.getDefaultActiveStoreId(req);
    }

    Store.findOne({id:storeId}).populate('Warehouse')
      .then(function(storeResult){
        store = storeResult;
        return Common.nativeFindOne({ItemCode: productCode}, Product);
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

