/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  schema: true,
  migrate:'alter',
  attributes: {
    name:{
      type:'string'
    },
    group:{
      type:'string',
      enum:['home','studio','kids','proyectos']
    },
    logo: {
      type: 'string'
    },
    code:{type:'string'},
    

    //RELATIONS
    users: {
      collection: 'user',
      via: 'Stores'
    },
    Warehouse:{
      model:'Company'
    },
    Promotions:{
      collection: 'promotion',
      via: 'Stores'
    },
    Payments: {
      collection:'Payment',
      via:'Store'
    },
    Quotations: {
      collection:'Quotation',
      via:'Store'
    },
    Orders: {
      collection:'Order',
      via:'Store'
    },
    PromotionPackages:{
      collection:'ProductGroup',
      via:'Stores'
    }
  }
};

