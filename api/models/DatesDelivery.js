/**
 * DatesDelivery.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'DatesDelivery',
  schema: true,
  attributes: {
    ItemCode: {
      type: 'string',
      required: true
    },
    ShipDate: {
      type: 'date',
      required: true
    },
    OpenCreQty: {
      type: 'integer',
      required: true
    },
    whsCode: {
      type: 'string',
      required: true
    }
  }
};

