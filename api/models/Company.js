/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  tableName: 'Warehouse',
  schema: true,
  migrate: 'alter',
  attributes: {
    //sap fields
    WhsCode: {
      type: 'string',
      columnType: 'text'
      // size: 8
    },
    WhsName: {
      type: 'string',
      columnType: 'text'
      // size: 100
    },
    IntrnalKey: {
      type: 'integer'
    },
    U_Calle: {
      type: 'string',
      columnType: 'text'
      // size: 150
    },
    U_noExterior: {
      type: 'string',
      columnType: 'text'
      // size: 15
    },
    U_noInterior: {
      type: 'string',
      columnType: 'text'
      // size: 15
    },
    U_Colonia: {
      type: 'string',
      columnType: 'text'
      // size: 150
    },
    U_Localidad: {
      type: 'string',
      columnType: 'text'
      // size: 150
    },
    U_Municipio: {
      type: 'string',
      columnType: 'text'
      // size: 150
    },
    U_Estado: {
      type: 'string',
      columnType: 'text'
      // size: 50
    },
    U_Pais: {
      type: 'string',
      columnType: 'text'
      // size: 50
    },
    U_CodigoPostal: {
      type: 'string',
      columnType: 'text'
      // size: 10
    },
    U_Serie_FCP: {
      type: 'string',
      columnType: 'text'
      // size: 25
    },
    U_Serie_ND: {
      type: 'string',
      columnType: 'text'
      // size: 25
    },
    U_Serie_NC: {
      type: 'string',
      columnType: 'text'
      // size: 25
    },
    U_Serie_FR: {
      type: 'string',
      columnType: 'text'
      // size: 25
    },
    U_Serie_FA: {
      type: 'string',
      columnType: 'text'
      // size: 25
    },
    U_EsTransito: {
      type: 'integer'
    },
    U_Bodega: {
      type: 'integer'
    },
    U_InfoWhs: {
      type: 'integer'
    },
    U_Procesado: {
      type: 'integer'
    },

    //relations
    Stores: {
      collection: 'store',
      via: 'Warehouse'
    }
  }
};
