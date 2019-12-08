// APP/SAP COLLECTION
module.exports = {
  schema: true,
  migrate: 'alter',
  attributes: {
    name: { type: 'string' },
    email: { type: 'string', columnType: 'email' },
    phone: { type: 'string' },
    QuotationWeb: {
      model: 'QuotationWeb'
    }
  }
};
