//APP COLLECTION
module.exports = {
  tableName: 'product_filtervalues__productfiltervalue_products',
  attributes:{
    value : 'integer',
    productfiltervalue : { //product filter value
      columnName:'productfiltervalue_Products',
      model : 'productfiltervalue'
    },
    product : { //product
      columnName:'product_FilterValues',
      model : 'product'
    }
  }
}
