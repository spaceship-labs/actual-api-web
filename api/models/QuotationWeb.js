var moment = require('moment');

//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema: true,
  tableName: 'QuotationWeb',
  attributes: {
    Client: {
      model: 'Client'
    },
    UserWeb: {
      model: 'UserWeb'
    },
    Details: {
      collection: 'QuotationDetailWeb',
      via: 'QuotationWeb'
    },
    Address: {
      model: 'ClientContact'
    },
    OrderWeb: {
      model: 'OrderWeb'
    },
    Payments: {
      collection: 'PaymentWeb',
      via: 'QuotationWeb'
    },
    Store: {
      model: 'store'
    },
    ZipcodeDelivery: {
      model: 'ZipcodeDelivery'
    },
    SapOrderConnectionLogs: {
      collection: 'SapOrderConnectionLogWeb',
      via: 'QuotationWeb'
    },

    ignoreContactZipcode: {
      defaultsTo: true,
      type: 'boolean'
    },
    CardName: { type: 'string' },
    CardCode: { type: 'string' },
    isWeb: { type: 'boolean' },
    isClosed: { type: 'boolean' },
    isClosedReason: { type: 'string' },
    isClosedNotes: { type: 'text' },
    immediateDelivery: { type: 'boolean' },
    clientName: { type: 'string' },
    folio: { type: 'string' },
    total: { type: 'float' },
    totalPg1: { type: 'float' },
    totalPg2: { type: 'float' },
    totalPg3: { type: 'float' },
    totalPg4: { type: 'float' },
    totalPg5: { type: 'float' },

    discountPg1: { type: 'float' },
    discountPg2: { type: 'float' },
    discountPg3: { type: 'float' },
    discountPg4: { type: 'float' },
    discountPg5: { type: 'float' },

    ammountPaidPg1: { type: 'float' },
    financingCostPercentage: 'float',
    subtotal: { type: 'float' },
    subtotal2: { type: 'float' }, // includes discounts but not big ticket neither family and friends
    discount: { type: 'float' },
    ammountPaid: { type: 'float' },
    totalProducts: { type: 'integer' },
    paymentGroup: { type: 'integer' },
    bigticketMaxPercentage: {
      type: 'integer',
      enum: [0, 1, 2, 3, 4, 5]
    },
    bigticketPercentage: {
      type: 'integer',
      enum: [0, 1, 2, 3, 4, 5]
    },
    minPaidPercentage: {
      type: 'float',
      defaultsTo: 100
    },
    //TODO: Check status types
    status: {
      type: 'string'
      //enum:['closed','pending-payment','to-order']
    },
    source: {
      type: 'string'
    },
    tracing: {
      type: 'datetime'
    },
    rateLimitReported: {
      type: 'boolean'
    },
    paymentAttempts: {
      type: 'integer',
      defaultsTo: 0
    },
    paymentType: { type: 'string' },
    tracing: {
      type: 'datetime'
    }
  },

  beforeCreate: function(val, cb) {
    val.tracing = addDefaultTracingDate();
    Common.orderCustomAI(val, 'quotationWebFolio', function(val) {
      cb();
    });
  }
};

function addDefaultTracingDate() {
  return moment()
    .add(72, 'hours')
    .toDate();
}
