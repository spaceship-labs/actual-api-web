module.exports = {
	attributes:{
		invoiceSap: 'string',
		document: 'string',

		OrderWeb:{
			model:'OrderWeb'
		},
		PaymentsSapWeb:{
			collection:'PaymentSapWeb',
			via:'OrderSapWeb'
		},
		ProductSeriesWeb:{
			collection:'ProductSerieWeb',
			via:'OrderSapWeb'
		}
	}
};