// APP/SAP COLLECTION
module.exports = {
  schema: true,
  migrate:'alter',
  tableName:'Contact',
  attributes:{

    /*-----/
    FIELDS SAP
    /*-----*/
    CardCode:{type:'string'},
    CardName:{type:'string'},
    Title:{type:'string'},
    Birthdate:{type:'date'},
    Phone1: {type:'string'},
    Cellular:{type:'string'},
    E_Mail:{type:'string'},
    SlpCode : {type:'integer'},
    Gender:{type:'string'},
    LicTradNum:{type:'string'},
    Balance: {type:'float'},
    Currency:{type:'string'},

    /*
    */
    /*Seller:{
      model:'User',
      columnName: 'SlpCode'
    }
    */

    /*-----/
    FIELDS APP
    /*-----*/
    FirstName: {type:'string'},
    LastName: {type:'string'},
    email: {
      type:'string',
      unique: true
    },

    bussinessLegalName: {type:'string'},
    bussinessName: {type:'string'},
    rfc:{type:'string'},
    isMoral:{type:'boolean'},
    ewallet: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },


    /*----------/
      RELATIONS
    /*----------*/
    Quotations: {
      collection:'Quotation',
      via: 'Client',
    },

    Orders: {
      collection:'Order',
      via: 'Client',
    },

    EwalletRecords: {
      collection:'EwalletRecord',
      via: 'Client',
    }


  }
};
