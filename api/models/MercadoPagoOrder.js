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
    created_at: {
      type: 'string'
    },
    currency: {
      type: 'string'
    },
    amount: {
      type: 'float'
    },
    requestData: {
      type: 'json'
    },
    responseData: {
      type: 'json'
    },
    receiving_account_bank: {
      type: 'string'
    },
    receiving_account_number: {
      type: 'string'
    },
    speiExpirationPayment: {
      type: 'datetime'
    },
    issuerId: {
      type: 'string'
    },
    installments: {
      type: 'integer'
    },
    status: {
      type: 'string'
    },
    statusDetail: {
      type: 'string'
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
