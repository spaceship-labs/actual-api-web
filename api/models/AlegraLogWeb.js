module.exports = {
	attributes:{
	  Client:{
	    model: 'Client'
	  },
	  OrderWeb: {
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