/**
 * MercadoPagoOrder.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  migrate: 'alter',
  schema: true,
  attributes: {
    mercadoPagoId: {
      type: 'string'
    },
    currency: {
      type: 'string'
    },
    amount: {
      type: 'float'
    },
    status: {
      type: 'string'
    },
    status_detail: {
      type: 'string'
    },
    requestData: {
      type: 'text'
    },
    responseData: {
      type: 'text'
    },
    issuerId: {
      type: 'string'
    },
    installments: {
      type: 'integer'
    },
    total_paid_amount: {
      type: 'integer'
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
};
