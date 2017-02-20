module.exports = {
	attributes:{
		invoiceSap: 'string',
		document: 'string',

		Order:{
			model:'OrderWeb'
		},
		PaymentsSap:{
			collection:'PaymentSapWeb',
			via:'OrderSap'
		},
		ProductSeries:{
			collection:'ProductSerieWeb',
			via:'OrderSap'
		}
	}
};