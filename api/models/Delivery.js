/**
 * Delivery.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'Delivery',
  schema: true,
  attributes: {
    idDelivery: {
      type: 'integer',
      unique: true
    },
    FromCode: {
      type: 'string'
    },
    FromName: {
      type: 'string'
    },
    ToCode: {
      type: 'string'
    },
    ToName: {
      type: 'string'
    },
    Days: {
      type: 'integer'
    },
    Active: {
      type: 'string'
    },
  }
};

