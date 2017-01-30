var Promise = require('bluebird');

//APP COLLECTION
module.exports = {
  tableName: 'product_groups__productgroup_products',
  attributes:{
    product: {
      columnName:'product_Groups',
      model: 'product'
    },
    productgroup: {
      columnName:'productgroup_Products',
      model: 'productgroup'
    }
  },

  afterDestroy: function(destroyedRecords, cb){
    sails.log.info('destroyedRecords');
    sails.log.info(destroyedRecords);
    if(destroyedRecords.length > 0){
      Promise.each(destroyedRecords, destroyPackageRule)
        .then(function(){
          sails.log.info('destroyed');
          cb();
        })
        .catch(function(err){
          console.log(err);
          cb();
        })
    }else{
      cb();
    }
  }
};


function destroyPackageRule(record){
  var productId = record.product_Groups;
  var productGroupId = record.productgroup_Products;
  return PackageRule.destroy({Product: productId, PromotionPackage: productGroupId});
}
