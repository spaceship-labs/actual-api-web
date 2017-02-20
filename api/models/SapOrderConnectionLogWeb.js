//APP COLLECTION
module.exports = {
  attributes: {
    Quotation:{
      model: 'QuotationWeb'
    },
    User:{
      model: 'UserWeb'
    },
    Order: {
      model:'OrderWeb'
    },
    Store:{
      model: 'Store'
    },
    content:{
      type:'string'
    }
  }
};
