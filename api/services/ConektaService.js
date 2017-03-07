var conekta = require('conekta');
conekta.api_key = '9YxqfRnx4sMQDnRsqdYn';
conekta.locale = 'es';
conekta.api_version = '2.0.0';


module.exports = {
	createOrder: createOrder,
	chargeOrder: chargeOrder
};
function createOrder() {
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
	  }],

	}, function(err, res) {
	      var order =  res.toObject();
	      console.log('ID', order.id);
	      return order;
	});
}

function chargeOrder() {
	var params = {
		"payment_method": {
			"type": "card",
			"expires_at": 1479167175
		},
		"amount": 350000
	}
	conekta.Order.find("ord_2g8ipqs4pzpfQMvqC", function(err, order) {
	    order.createCharge(params, function(err, charge) {
	        console.log(charge);
	    });
	}); 
}
