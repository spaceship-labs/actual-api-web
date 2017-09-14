// APP/SAP COLLECTION
module.exports = {
  schema: true,
  migrate:'alter',
  attributes:{

    name: {type:'string'},
    email: {type:'email'},
    phone: {type:'string'},
    QuotationWeb:{
      model: 'QuotationWeb',
    }
  }
};

