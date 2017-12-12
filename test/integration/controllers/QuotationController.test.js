describe('Quotation controller', function(){

	describe('create quotation', function(){
		it('should create a quotation', function(done){
			buildDetails(done);
			/*
			app.post()
			  .set('Authorization', 'JWT' + loggedInData.token)
			  .set('site', currentSiteKey)
			  .set('accept', 'json')
			  .then(function(res){
			  	console.log('quotation', res.body);
					expect(res.body).to.have.property("id");			  	
			  })
			*/
		})
	})

});

function buildDetails(cb){
	var sampleProduct = {
		id: '573f9b7e5280c23e68cf34b7',
		ItemCode: "CO18168",
	};
	var sampleZipcode = {
		id: "58b495c224b5055c100fa4ae",
		cp:"77500"
	};

	app.post('/shipping/product' )
		.send({productCode: sampleProduct.ItemCode,zipcodeDeliveryId: sampleZipcode.id})
	  .set('site', currentSiteKey)
	  .set('accept', 'json')
	  .then(function(shippingDates){

	  	if(shippingDates && shippingDates.length > 0){
				var selectedDate = shippingDates[0];
				var details = [
					{
						Product: sampleProduct.id,
						quantity: selectedDate.available,
						shipDate: selectedDate.date,
						originalShipDate: selectedDate.date,
						productDate: selectedDate.productDate,
						shipCompany: selectedDate.company,
						shipCompanyFrom: selectedDate.companyFrom
					}
				];

				console.log('details', details);
				cb();
	  	}

	  });

}