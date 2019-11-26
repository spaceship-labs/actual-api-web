/**
 * QuotationRecord.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    Quotation: {
      model: 'QuotationWeb',
      columnName: 'DocEntry'
    },
    User: {
      model: 'UserWeb'
    },
    notes: {
      type: 'text'
    },
    eventType: {
      type: 'string'
    },
    dateTime: {
      type: 'datetime'
    },
    estimatedCloseDate: {
      type: 'datetime'
    },
    files: {
      collection: 'QuotationRecordFile',
      via: 'QuotationRecord'
    }
  },
  tableName: 'QuotationRecordWeb',
  migrate: 'alter',
  schema: true,
  afterCreate: function(newVal, cb) {
    return QuotationWeb.update({ id: newVal.QuotationWeb })
      .set({ tracing: newVal.dateTime })
      .fetch()
      .then(function(updated) {
        cb();
      })
      .catch(function(err) {
        console.log(err);
        cb();
      });
  }
};
