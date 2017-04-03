var Promise = require('bluebird');
var conekta = require('conekta');
conekta.locale = 'es';
conekta.api_version = '2.0.0';


module.exports = {
	createOrder: createOrder,
	chargeOrder: chargeOrder,
	test: test
};

function test(req){
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	sails.log.info('req.headers.site', req.headers.site);
	sails.log.info('api_key', conekta.api_key);
}


function createOrder(payment, req) {
	conekta.api_key = SiteService.getConektaKeyBySite(req);

	return new Promise(function(resolve, reject){

		conekta.Order.create({
		  "currency": "mxn",
		  "customer_info": {
				"name": "Jul Ceballos",
		        "phone": "+5215555555555",
		        "email": "jul@conekta.io"  
		    },
		  "line_items": [{
		    "name": "Box of Cohiba S1s",
		    "unit_price": 35000,
		    "quantity": 1
		  }]
		}, function(err, res) {
			if(err){
				reject(err);
			}

		      var order =  res.toObject();
		      console.log('ID', order.id);
		     resolve(order); 
		});

	});

}

function chargeOrder(order, req) {
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	
	return new Promise(function(resolve, reject){
		var params = {
			"payment_method": {
				"type": "card",
				"expires_at": 1479167175
			},
			"amount": 350000
		};
		conekta.Order.find(order.id, function(err, order) {
		    order.createCharge(params, function(err, charge) {
		        if(err){
		        	reject(err);
		        }
		        console.log(charge);
		    	resolve(charge);
		    });
		}); 

	});
}

function getConektaKeyBySite(){

}

/*


createOrder()
	.then(function(order){
		return chargeOrder(order);
	})
	.then(function(charge){
		console.log(charge)
		res.json(charge);
	})
	.catch(function(err){

	})
*/