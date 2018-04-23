/**
 * QuotationRecordFile.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    filename: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    typebase: {
      type: 'string'
    },
    size: {
      type: 'integer'
    },
    QuotationRecord: {
      model: 'QuotationRecord'
    }
  },
  tableName: 'QuotationRecordFileWeb'
};
