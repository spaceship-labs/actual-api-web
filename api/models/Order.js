//APP COLLECTION / TODO: REMOVE MODEL
module.exports = {
  migrate:'alter',
  schema: true,
  attributes:{
    DocEntry:{type:'integer'},
    folio:{type:'string'},
    documents:{
      type:'array'
    },
    immediateDelivery:{type:'boolean'},
    ammountPaid: {type:'float'},
    ammountPaidPg1: {type:'float'},
    total:{type:'float'},
    subtotal:{type:'float'},
    discount:{type:'float'},
    currency:{type:'string'},
    paymentGroup:{type:'integer'},
    appliesClientDiscount: {type:'boolean'},
    WhsCode:{type:'string'},
    status:{
      type:'string',
      enum:['lost','pending','on-delivery','minimum-paid','paid']
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
};
