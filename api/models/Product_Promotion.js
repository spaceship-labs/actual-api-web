//APP COLLECTION
module.exports = {
  tableName: 'product_promotions__promotion_products',
  attributes:{
    product : { //product 
      columnName:'product_Promotions',
      model : 'product'
    },
    promotion : { //promotion
      columnName:'promotion_Products',
      model : 'promotion'
    }
  }
};
