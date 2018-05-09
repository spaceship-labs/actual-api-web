/**
 * FeaturedProduct.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  migrate: 'alter',
  attributes: {
    product: {
      model: 'Product'
    },
    site: {
      model: 'Site'
    },
    productCategory: {
      model: 'ProductCategory'
    },
    categoryHandle: {
      type: 'string'
    }
  }
};
