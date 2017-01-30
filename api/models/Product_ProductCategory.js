//APP COLLECTION
module.exports = {
  tableName: 'product_categories__productcategory_products',
  attributes:{
    productCategory: {
      columnName:'productcategory_Products',
      model: 'productCategory'
    },
    product: {
      columnName:'product_Categories',
      model: 'product'
    }
  }
};
