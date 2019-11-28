module.exports = {
  migrate: 'alter',
  schema: true,
  attributes: {
    conektaId: { type: 'string' },
    created_at: { type: 'string' },
    currency: { type: 'string' },
    amount: { type: 'float' },
    payment_status: { type: 'string' },
    isSpeiOrder: { type: 'boolean' },
    requestData: { type: 'text' },
    responseData: { type: 'text' },
    receiving_account_bank: { type: 'string' },
    receiving_account_number: { type: 'string' },
    speiExpirationPayment: {
      type: 'string',
      columnType: 'datetime'
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
