var moment = require('moment');

//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema:true,
  tableName: 'QuotationWeb',
  attributes: {
    Client:{
      model:'Client'
    },
    User:{
      model: 'UserWeb',
    },
    Details: {
      collection:'QuotationDetailWeb',
      via:'Quotation'
    },
    Address:{
      model:'ClientContact',
    },
    Order:{
      model:'OrderWeb'
    },
    Payments:{
      collection: 'PaymentWeb',
      via:'Quotation'
    },
    Store:{
      model:'store'
    },
    SapOrderConnectionLogs: {
      collection: 'SapOrderConnectionLogWeb',
      via: 'Quotation'
    },

    CardName: {type:'string'},
    CardCode:{type:'string'},
    isWeb:{type:'boolean'},
    isClosed:{type:'boolean'},
    isClosedReason:{type:'string'},
    isClosedNotes:{type:'text'},
    immediateDelivery:{type:'boolean'},
    clientName: {type:'string'},
    folio:{type:'integer'},
    total:{type:'float'},
    totalPg1: {type:'float'},
    ammountPaidPg1: {type:'float'},
    financingCostPercentage: 'float',    
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
    Common.orderCustomAI(val, 'quotationWebFolio',function(val){
      cb();
    });
  },

};

function addDefaultTracingDate(){
  return moment().add(72,'hours').toDate();
}