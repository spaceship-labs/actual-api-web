module.exports = {
	attributes:{
		invoiceSap: 'string',
		document: 'string',

		Order:{
			model:'Order'
		},
		PaymentsSap:{
			collection:'PaymentSap',
			via:'OrderSap'
		},
		ProductSeries:{
			collection:'ProductSerie',
			via:'OrderSap'
		}
	}
};