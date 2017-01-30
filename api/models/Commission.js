/**
 * Commission.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    folio: {
      type: 'integer',
      required: true
    },
    datePayment: {
      type: 'date',
    },
    ammountPayment: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    rate: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    ammount: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    status : {
      type: 'string',
      enum: ['paid', 'pending'],
      required: true,
      defaultsTo: 'pending'
    },
    store: {
      model: 'store',
      required: true
    },
    user: {
      model: 'user',
      required: true
    },
    role: {
      type: 'string',
      enum: ['seller', 'store manager'],
    },
    payment: {
      model: 'payment',
      required: true
    },
    toJSON: function () {
      var obj = this.toObject();
      obj.order = obj.payment.Order;
      obj.quotation = obj.payment.Quotation;
      return obj;
    }
  },
  beforeValidate: function(val, cb){
    Common.orderCustomAI(val, 'commissionFolio', function(val){
      cb();
    });
  },
};

