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

    /*-----/
    FIELDS APP
    /*-----*/
    FirstName: {type:'string'},
    LastName: {type:'string'},
    //password:{type:'string'},
    //lastLogin: {type:'datetime'},
    /*
    email: {
      type:'string',
      unique: true
    },
    */

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
    UserWeb:{
      model:'UserWeb'
    },

    Quotations: {
      collection:'QuotationWeb',
      via: 'Client',
    },

    Orders: {
      collection:'OrderWeb',
      via: 'Client',
    },
    toJSON: function () {
      var obj = this.toObject();
      delete obj.password;
      return obj;
    }    
  },
  beforeUpdate: function (values, next) {
    delete values.CardCode;
    if (values.new_password) {
      values.password = CipherService.hashPassword(values.new_password);
    }
    next();
  },
  beforeCreate: function (values, next) {
    if (values.password) {
      values.password = CipherService.hashPassword(values.password);
    }
    next();
  }  
};

