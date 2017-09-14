var Promise = require('bluebird');

module.exports = {

	createLeadAndSendQuotation: function(req, res){
		var form = req.allParams();
		var quotationId = form.quotationId;
		form.QuotationWeb = quotationId;
		var createdLead;
		Lead.create(form)
			.then(function(_createdLead){
				createdLead = _createdLead;
				console.log('createdLead', createdLead);
				var isCardProcessingError = false;
				return Promise.resolve();
				//return Email.sendQuotation(quotationId,req.activeStore, isCardProcessingError, createdLead);
			})
			.then(function(result){
				res.json(createdLead);
			})
			.catch(function(err){
				console.log('err create lead', err);
				res.negotation(err);
			});
	}
};