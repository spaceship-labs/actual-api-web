module.exports = {
	schema: true,
  migrate:'alter',
	attributes:{
		type:{
			type:'string',
			enum:['positive', 'negative']
		},
		amount:{
			type:'float',
			required:true
		},
    Store:{
      model:'store'
    },
    Order:{
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    },
    QuotationDetail:{
      model:'QuotationDetail'
    },
    User:{
      model:'User'
    },
    Client:{
    	model: 'Client'
    },
    Payment:{
      model: 'Payment'
    }    
	}
};
