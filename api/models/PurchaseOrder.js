/**
 * PurchaseOrder.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'PurchaseOrder',
  schema: true,
  attributes: {
    ItemCode: {
      type: 'string'
    },
    ShipDate: {
      type: 'date'
    },
    Dscription: {
      type: 'string'
    },
    OpenCreQty: {
      type: 'integer'
    },
    WhsCode: {
      type: 'string'
    }
  }
};
