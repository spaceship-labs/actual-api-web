//APP COLLECTION
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    type: {
      type:'string',
      enum:[
        'single-payment-terminal',
        '3-msi',
        '6-msi',
        '9-msi',
        '12-msi',
        '18-msi',
      ]
    },
    folio:{type:'integer'},
    name:{type:'string'},
    ammount:{type:'float'},
    currency:{
      type:'string',
      enum:[
        'mxn',
        'usd'
      ]
    },
    exchangeRate:{type:'float'},
    verificationCode: {type:'string'},
    conektaId: {type:'string'},
    isCancelled: {type:'boolean'},
    isCancellation: {type:'boolean'},
    isRecurring: {type:'boolean'},
    msi:{type:'float'},
    paymentType: {type:'string'},
    terminal: {
      type:'string',
      enum:[
        'american-express',
        'banamex',
        'bancomer',
        'banorte',
        'santander'
      ]
    },
    card: {type:'string'},
    cardLastDigits: {type:'string'},
    cardName: {type:'string'},
    cardToken: {type:'string'},
    group:{type:'integer'},
    description:{type:'string'},
    status:{
      type:'string',
      enum: ['paid','pending','cancelled']
    },
    sentToSap: {
      type:'boolean'
    },
    Store:{
      model:'store'
      //model:'company'
    },
    Order:{
      model:'OrderWeb'
    },
    Quotation:{
      model:'QuotationWeb'
    },
    User:{
      model:'UserWeb'
    },
    Client:{
      model: 'Client'
    },
    PaymentSap:{
      model: 'PaymentSapWeb'
    },

  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'paymentWebFolio',function(val){
      cb();
    });
  },

};
