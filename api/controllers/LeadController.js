module.exports = {
  async createLeadAndSendQuotation(req, res) {
    try {
      const quotationId = req.param('quotationId');
      const leadParams = Object.assign({ QuotationWeb: quotationId }, req.allParams());
      const leadCreated = await Lead.create(leadParams).fetch();
      const isCardProcessingError = false;
      await QuotationWebService.assignClient(
        leadParams.name,
        leadParams.email,
        leadParams.phone,
        quotationId
      );
      await Email.sendQuotation(quotationId, req.activeStore, isCardProcessingError, leadCreated);
      res.json(leadCreated);
    } catch (err) {
      console.log('err create lead', err);
      res.negotiate(err);
    }

    // var form = req.allParams();
    // var quotationId = form.quotationId;
    // form.QuotationWeb = quotationId;
    // var createdLead;
    // Lead.create(form)
    //   .then(function(_createdLead) {
    //     createdLead = _createdLead;
    //     console.log('createdLead', createdLead);
    //     var isCardProcessingError = false;
    //     return Email.sendQuotation(
    //       quotationId,
    //       req.activeStore,
    //       isCardProcessingError,
    //       createdLead
    //     );
    //   })
    //   .then(function(result) {
    //     res.json(createdLead);
    //   })
    //   .catch(function(err) {
    //     console.log('err create lead', err);
    //     res.negotation(err);
    //   });
  }
};
