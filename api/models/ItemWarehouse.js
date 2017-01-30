/**
 * ItemWarehouse.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'ItemWarehouse',
  schema: true,
  attributes: {
    ItemCode: {
      type: 'string'
    },
    WhsCode: {
      type: 'string'
    },
    Available: {
      type: 'integer'
    },
    IsCommited: {
      type: 'integer'
    },
    OnOrder: {
      type: 'integer'
    }
  }
};

