//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema: true,
  attributes: {
    password: {
      type: 'string'
    },
    email: {
      type: 'email',
      required: true,
      unique: true
    },
    firstName: {
      type: 'string',
      defaultsTo: ''
    },
    lastName: {
      type: 'string',
      defaultsTo: ''
    },
    lastLogin: {
      type: 'datetime'
    },
    active: {
      type: 'boolean',
      defaultsTo: true
    },
    Quotations: {
      collection: 'QuotationWeb',
      via: 'UserWeb'
    },
    Orders: {
      collection: 'OrderWeb',
      via: 'UserWeb'
    },
    CardCode: { type: 'string' },

    dialCode: { type: 'string' },
    phone: { type: 'string' },
    mobileDialCode: { type: 'string' },
    mobilePhone: { type: 'string' },

    externalNumber: { type: 'string' },
    internalNumber: { type: 'string' },
    neighborhood: { type: 'string' },
    municipality: { type: 'string' },
    city: { type: 'string' },
    entity: { type: 'string' },
    zipCode: { type: 'string' },
    street: { type: 'string' },
    street2: { type: 'string' },
    references: { type: 'text' },

    bussinessLegalName: { type: 'string' },
    bussinessName: { type: 'string' },
    rfc: { type: 'string' },

    invoiceEmail: { type: 'string' },
    invoiceDialCode: { type: 'string' },
    invoicePhone: { type: 'string' },
    invoiceStreet: { type: 'string' },
    invoiceExternalNumber: { type: 'string' },
    invoiceInternalNumber: { type: 'string' },
    invoiceNeighborhood: { type: 'string' },
    invoiceMunicipality: { type: 'string' },
    invoiceCity: { type: 'string' },
    invoiceEntity: { type: 'string' },
    invoiceZipCode: { type: 'string' },

    legalRepresentative: { type: 'string' },
    bank: { type: 'string' },
    bankAccount: { type: 'string' },
    interbankClabe: { type: 'string' },

    brokerCode: { type: 'string' },
    brokerName: { type: 'string' },

    //relations - permissions
    /*
    Stores: {
      collection: 'store',
      via: 'users'
    },
    */
    Store: {
      model: 'Store'
    },
    permissions: {
      collection: 'permission',
      via: 'owners'
    },
    Payments: {
      collection: 'paymentweb',
      via: 'UserWeb'
    },
    Client: {
      model: 'Client'
    },
    role: {
      type: 'string',
      enum: ['client', 'admin']
    },
    invited: {
      type: 'boolean',
      defaultsTo: false
    },
    toJSON: function() {
      var obj = this.toObject();
      obj.name = obj.firstName + ' ' + obj.lastName;
      delete obj.password;
      return obj;
    }
  },
  beforeUpdate: function(values, next) {
    if (values.new_password) {
      values.password = CipherService.hashPassword(values.new_password);
    }
    next();
  },
  beforeCreate: function(values, next) {
    if (values.password) {
      values.password = CipherService.hashPassword(values.password);
    }
    next();
  }
};

function isArray(o) {
  return o.constructor === Array;
}
