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
    url:{type:'string'},
    url_sandbox:{type:'string'},    

    //RELATIONS
    Warehouse:{
      model:'Company'
    },
    Promotions:{
      collection: 'promotion',
      via: 'Stores'
    },
    UsersWeb:{
      collection: 'userweb',
      via: 'Store'
    },    
    Payments: {
      collection:'PaymentWeb',
      via:'Store'
    },
    Quotations: {
      collection:'QuotationWeb',
      via:'Store'
    },
    Orders: {
      collection:'OrderWeb',
      via:'Store'
    },
    PromotionPackages:{
      collection:'ProductGroup',
      via:'Stores'
    }
  }
};

