//APP COLLECTION
module.exports = {
  migrate:'alter',
  schema: true,
  attributes:{
    DocEntry:{type:'integer'},
    folio:{type:'string'},
    documents:{
      type:'array'
    },
    immediateDelivery:{type:'float'},
    ammountPaid: {type:'float'},
    ammountPaidPg1:{type:'float'},
    total:{type:'float'},
    totalPg1: {type:'float'},
    totalPg2: {type:'float'},
    totalPg3: {type:'float'},
    totalPg4: {type:'float'},
    totalPg5: {type:'float'},

    discountPg1: {type:'float'},
    discountPg2: {type:'float'},
    discountPg3: {type:'float'},
    discountPg4: {type:'float'},
    discountPg5: {type:'float'},

    isSpeiOrder: {type:'boolean'},
    speiExpirationPayment: {type:'datetime'},
    speiExpirationReminderStartDate: {type:'datetime'},
    paymentReminderSent:{type:'boolean'},
    paymentExpirationSent:{type:'boolean'},

    subtotal:{type:'float'},
    discount:{type:'float'},
    currency:{type:'string'},
    paymentGroup:{type:'integer'},
    WhsCode:{type:'string'},
    status:{
      type:'string',
      enum:[
        'lost',
        'pending',
        'on-delivery',
        'minimum-paid',
        'paid',
        'pending-sap', 
        'pending-payment',
        'completed',
        'cancelled'
      ]
    },
    inSapWriteProgress:{type:'boolean'},
    QuotationWeb:{
      model:'QuotationWeb',
      unique:true
    },
    Client:{
      model: 'Client'
    },
    Details: {
      collection:'OrderDetailWeb',
      via:'OrderWeb'
    },
    Payments: {
      collection:'PaymentWeb',
      via:'OrderWeb'
    },
    UserWeb:{
      model: 'UserWeb',
    },
    Address:{
      model:'ClientContact',
    },
    Store:{
      model:'store'
      //model:'company',
      //required: 'true'
    },
    PaymentsSapWeb:{
      collection:'PaymentSapWeb',
      via:'OrderWeb'
    },
    OrdersSapWeb:{
      collection:'OrderSapWeb',
      via:'OrderWeb'
    },
    SapOrderConnectionLogWeb:{
      model: 'SapOrderConnectionLogWeb'
    },
    ConektaOrder:{
      model:'ConektaOrder'
    },

    conektaId:{type:'string'},
    receiving_account_bank:{type:'string'},
    receiving_account_number:{type:'string'},
    conektaAmount: {type:'float'},
    //CONTACT ADDRESS FIELDS SNAPSHOT
    //APP/SAP FIELDS


    //SAP FIELDS
    CntCtCode:{type:'integer'},
    SlpCode: {type:'integer'},
    CardCode: {type:'string'},
    CardName: {type:'string'},

    //ADDRESS FIELDS SNAPSHOT
    E_Mail:{type:'string'},
    FirstName:{type:'string'},
    LastName:{type:'string'},

    CntctCode:{type:'integer'},
    Tel1:{type:'string'},
    Cellolar:{type:'string'},
    address:{type:'string'},
    U_Noexterior: {type:'string'},
    U_Nointerior: {type:'string'},
    U_Colonia: {type:'string'},
    U_Mpio: {type:'string'},
    U_Ciudad: {type:'string'},
    U_Estado: {type:'string'},
    U_CP: {type:'string'},
    U_Entrecalle: {type:'string'},
    U_Ycalle: {type:'string'},
    U_Notes1: {type:'string'},
    U_Latitud: {type:'string'},
    U_Longitud: {type:'string'},

    //APP FIELDS

    minPaidPercentage: {
      type:'float',
      defaultsTo: 60
      //defaultsTo: 100
    },
    invoice: {
      //factura sat
      model: 'invoiceweb',
    },

    paymentAttempts:{
      type:'integer',
      defaultsTo: 0
    }    
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'orderWebFolio',function(val){
      cb();
    });
  },
  /*
  afterCreate: function(val, cb) {
    InvoiceService
      .create(val.id)
      .then(function() {
        return InvoiceService.send(val.id);
      })
      .then(function() {
        cb();
      })
      .catch(function(err) {
        cb(err);
      });
  }
  */
}
