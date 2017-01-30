//APP COLLECTION
module.exports = {
  migrate:'alter',
  schema: true,
  attributes:{
    DocEntry:{type:'integer'},
    folio:{type:'integer'},
    documents:{
      type:'array'
    },
    immediateDelivery:{type:'float'},
    ammountPaid: {type:'float'},
    total:{type:'float'},
    subtotal:{type:'float'},
    discount:{type:'float'},
    currency:{type:'string'},
    paymentGroup:{type:'integer'},
    WhsCode:{type:'string'},
    status:{
      type:'string',
      enum:['lost','pending','on-delivery','minimum-paid','paid']
    },
    Quotation:{
      model:'Quotation',
      unique:true
    },
    Sale: {
      model:'Sale'
    },
    Client:{
      model: 'Client'
    },
    Details: {
      collection:'OrderDetail',
      via:'Order'
    },
    Payments: {
      collection:'Payment',
      via:'Order'
    },
    EwalletRecords:{
      collection:'EwalletRecord',
      via:'Order'
    },
    ClientBalanceRecords:{
      collection:'ClientBalanceRecord',
      via:'Order'
    },
    User:{
      model: 'User',
    },
    Broker:{
      model: 'User',
    },
    Address:{
      model:'ClientContact',
    },
    Store:{
      model:'store'
      //model:'company',
      //required: 'true'
    },
    PaymentsSap:{
      collection:'PaymentSap',
      via:'Order'
    },
    OrdersSap:{
      collection:'OrderSap',
      via:'Order'
    },
    SapOrderConnectionLog:{
      model: 'SapOrderConnectionLog'
    },

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
      model: 'invoice',
    }
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'orderFolio',function(val){
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
