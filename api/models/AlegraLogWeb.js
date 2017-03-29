module.exports = {
	attributes:{
	  User:{
	    model: 'UserWeb'
	  },
	  Order: {
	    model:'OrderWeb'
	  },
	  url:{
	    type:'string'
	  },
	  requestData:{
	    type:'string'
	  },
	  responseData:{
	  	type:'string'
	  },
	  isError:{
	  	type:'boolean'
	  },		
	}
};