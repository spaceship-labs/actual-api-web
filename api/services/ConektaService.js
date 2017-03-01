var conekta = require('conekta');
conekta.api_key = '9YxqfRnx4sMQDnRsqdYn';
conekta.locale = 'es';

module.exports = {
	createOrder: createOrder
};

function createOrder(){
	conekta.Order.create({
	    "currency": "MXN",
	    "customer_info": {
	        "name": "Jul Ceballos",
	        "phone": "+5215555555555",
	        "email": "jul@conekta.io"
	    },
	    "line_items": [{
	        "name": "Box of Cohiba S1s",
	        "description": "Imported From Mex.",
	        "unit_price": 35000,
	        "quantity": 1,
	        "tags": ["food", "mexican food"],
	        "type": "physical"
	    }]
	  }, function(err, res) {
	    if (err) {
	        console.log(err.type);
	        return;
	    }
	    console.log(res.toObject());
	});	
}