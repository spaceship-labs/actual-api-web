//APP COLLECTION
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    type: {
      type:'string',
      enum:[
        'cash',
        'cash-usd',
        'cheque',
        'deposit',
        'transfer',
        'ewallet',
        'credit-card', //TODO remove
        'single-payment-terminal',
        'client-balance',
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
    terminal:{type:'string'},
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
    cardExpDate: {type:'string'},
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
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    },
    User:{
      model:'User'
    },
    Commissions: {
      collection: 'commission',
      via: 'payment'
    },
    Client:{
      model: 'Client'
    },
    PaymentSap:{
      model: 'PaymentSap'
    },

  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'paymentFolio',function(val){
      cb();
    });
  },

  afterCreate: function(val, cb) {
    Commissions
      .calculate()
      .then(function() {
        cb();
      })
      .catch(function(err) {
        cb(err);
      });
  }
}
