/**
 * NetpayOrder.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

 module.exports = {
  migrate: 'alter',
  schema: true,
  attributes: {
    source: {
      type: 'string'
    },
    amount: {
      type: 'float'
    },
    description: {
      type: 'string'
    },
    transactionTokenId: {
      type: 'string'
    },
    returnUrl: {
      type: 'string'
    },
    status: {
      type: 'string'
    },
    paymentMethod: {
      type: 'string'
    },
    responseData: {
      type: 'text'
    },
    createdAt: {
      type: 'date'
    },
    UserWeb: {
      model: 'UserWeb'
    },
    QuotationWeb: {
      model: 'QuotationWeb'
    },
    OrderWeb: {
      model: 'OrderWeb'
    }
  }
}
