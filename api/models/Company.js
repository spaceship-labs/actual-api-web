/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  tableName: 'Warehouse',
  schema: true,
  migrate:'alter',
  attributes: {
    //sap fields
    WhsCode:{
      type:'string',
      size:8
    },
		WhsName:{
      type:'string',
      size: 100
    },
		IntrnalKey:{
      type:'integer'
    },
		U_Calle:{
      type:'string',
      size:150
    },
		U_noExterior:{
      type:'string',
      size:15
    },
		U_noInterior:{
      type:'string',
      size:15
    },
		U_Colonia:{
      type:'string',
      size:150
    },
		U_Localidad:{
      type:'string',
      size:150
    },
		U_Municipio:{
      type:'string',
      size:150
    },
		U_Estado:{
      type:'string',
      size:50
    },
		U_Pais:{
      type:'string',
      size:50
    },
		U_CodigoPostal:{
      type:'string',
      size:10
    },
		U_Serie_FCP:{
      type:'string',
      size:25
    },
		U_Serie_ND:{
      type:'string',
      size:25
    },
		U_Serie_NC:{
      type:'string',
      size:25
    },
		U_Serie_FR:{
      type:'string',
      size:25
    },
		U_Serie_FA:{
      type:'string',
      size:25
    },
		U_EsTransito:{
      type:'integer'
    },
		U_Bodega:{
      type:'integer'
    },
		U_InfoWhs:{
      type:'integer'
    },
		U_Procesado:{
      type:'integer'
    },

    //relations
    Stores:{
      collection:'store',
      via:'Warehouse'
    }
    /*
    users: {
      collection: 'user',
      via: 'companies'
    },
    Promotions:{
      collection: 'promotion',
      via: 'Companies'
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
    ProductsPackages:{
      collection:'ProductGroup',
      via:'Stores'
    }
    */
  }
};

