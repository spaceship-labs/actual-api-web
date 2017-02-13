var moment = require('moment');

//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema:true,
  tableName: 'Quotation',
  attributes: {
    Client:{
      model:'Client'
    },
    User:{
      model: 'User',
    },
    Details: {
      collection:'QuotationDetail',
      via:'Quotation'
    },
    Address:{
      model:'ClientContact',
    },
    Order:{
      model:'Order'
    },
    Payments:{
      collection: 'Payment',
      via:'Quotation'
    },
    EwalletRecords:{
      collection:'EwalletRecord',
      via:'Quotation'
    },
    ClientBalanceRecords:{
      collection:'ClientBalanceRecord',
      via:'Quotation'
    },
    Store:{
      model:'store'
    },
    SapOrderConnectionLogs: {
      collection: 'SapOrderConnectionLog',
      via: 'Quotation'
    },

    CardName: {type:'string'},
    CardCode:{type:'string'},
    isClosed:{type:'boolean'},
    isClosedReason:{type:'string'},
    isClosedNotes:{type:'text'},
    immediateDelivery:{type:'boolean'},
    clientName: {type:'string'},
    folio:{type:'integer'},
    total:{type:'float'},
    subtotal: {type:'float'},
    subtotal2: {type:'float'}, // includes discounts but not big ticket neither family and friends
    discount: {type:'float'},
    ammountPaid: {type:'float'},
    totalProducts: {type:'integer'},
    paymentGroup:{type:'integer'},
    bigticketMaxPercentage:{
      type:'integer',
      enum:[0,1,2,3,4,5]
    },
    bigticketPercentage: {
      type:'integer',
      enum:[0,1,2,3,4,5]
    },
    minPaidPercentage: {
      type:'float',
      defaultsTo: 100
    },
    //TODO: Check status types
    status:{
      type:'string',
      //enum:['closed','pending-payment','to-order']
    },
    source:{
      type:'string',
    },
    tracing: {
      type:'datetime'
    }
  },

  beforeCreate: function(val,cb){
    val.tracing = addDefaultTracingDate();
    Common.orderCustomAI(val, 'quotationFolio',function(val){
      cb();
    });
  },

};

function addDefaultTracingDate(){
  return moment().add(72,'hours').toDate();
}