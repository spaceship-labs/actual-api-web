module.exports = {
  schema: true,
  migrate:'alter',
  attributes: {
  	name: {type: 'string'},
    deliveryPriceValue: {type:'float'},
    deliveryPriceMode: {
      type: 'string',
      enum : ['percentage', 'amount']
    },
    isActive: {type:'boolean'},
    Zipcodes:{
    	collection: 'ZipcodeDelivery',
    	via: 'ZipcodeState'
    }
  }
};
