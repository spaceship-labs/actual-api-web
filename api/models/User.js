var Promise = require('bluebird');

//APP COLLECTION
module.exports = {
    migrate:'alter',
    schema: true,
    attributes: {
        password: {
            type: 'string'
        },
        email: {
            type: 'email',
            required: true,
            unique:true
        },
        firstName: {
            type: 'string',
            defaultsTo: '',
        },
        lastName: {
            type: 'string',
            defaultsTo: ''
        },
        lastLogin : {
          type: 'datetime'
        },
        active:{
          type:'boolean',
          defaultsTo: true
        },

        Seller: {
          model: 'Seller',
        },
        Quotations:{
          collection: 'Quotation',
          via:'User'
        },
        Orders:{
          collection:'Order',
          via:'User'
        },
        Records: {
          collection:'QuotationRecord',
          via:'User'
        },
        accessList: {
          type:'array'
        },

        dialCode: {type:'string'},
        phone:{type:'string'},
        mobileDialCode:{type:'string'},
        mobilePhone: {type:'string'},

        externalNumber:{type:'string'},
        internalNumber:{type:'string'},
        neighborhood: {type:'string'},
        municipality: {type:'string'},
        city:{type:'string'},
        entity:{type:'string'},
        zipCode: {type:'string'},
        street: {type:'string'},
        street2: {type:'string'},
        references:{type:'text'},

        bussinessLegalName: {type:'string'},
        bussinessName: {type:'string'},
        rfc:{type:'string'},

        invoiceEmail: {type:'string'},
        invoiceDialCode: {type:'string'},
        invoicePhone: {type:'string'},
        invoiceStreet: {type:'string'},
        invoiceExternalNumber:{type:'string'},
        invoiceInternalNumber:{type:'string'},
        invoiceNeighborhood: {type:'string'},
        invoiceMunicipality: {type:'string'},
        invoiceCity:{type:'string'},
        invoiceEntity:{type:'string'},
        invoiceZipCode: {type:'string'},

        bussinessLegalName: {type:'string'},
        bussinessName: {type:'string'},
        rfc:{type:'string'},
        legalRepresentative: {type:'string'},
        bank:{type:'string'},
        bankAccount:{type:'string'},
        interbankClabe: {type:'string'},

        brokerCode:{type:'string'},
        brokerName:{type:'string'},

        //relations - permissions
        Stores: {
          collection: 'store',
          via: 'users'
        },
        mainStore: {
          model: 'store'
        },
        activeStore: {
          model: 'store'
        },
        permissions: {
          collection: 'permission',
          via: 'owners'
        },
        role: {
          model: 'role',
        },
        Payments:{
          collection:'payment',
          via: 'User'
        },
        toJSON: function () {
          var obj = this.toObject();
          obj.name = obj.firstName + ' ' + obj.lastName;
          delete obj.password;
          delete obj.socialProfiles;
          return obj;
        }
    },
    beforeUpdate: function (values, next) {
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
    },
    beforeDestroy: function(criteria, next){
      User.find(criteria).populate('Seller')
        .then(function(users) {
          return Promise.all(
            users.map(function(user){
              return Seller.update(user.Seller.id, {User: null});
            })
          );
        })
        .then(function(users){
          next();
        });
    },


};

function isArray(o) {
  return o.constructor === Array;
}
