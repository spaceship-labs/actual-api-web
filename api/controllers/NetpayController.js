/**
 * MeController
 *
 * @description :: Server-side logic for managing us
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var Promise = require('bluebird');

 module.exports = {
  process3dSecure: async function(req, res) {
    var form = req.params.all();
    var transactionTokenId = form.transaction_token;
    var website = form.website
    try {
      const response = await Netpay.process3dSecure(transactionTokenId);
      res.redirect(website + response.returnURI);
    } catch(error) {
      res.negotiate(error)
    }
    //UserWeb.update({id: user.id}, form)
    //  .then(function(user){
    //    res.json(user[0] || false);
    //  })
    //  .catch(function(err){
    //    res.negotiate(err);
    //  });
  }
 };
 
 