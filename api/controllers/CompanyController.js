/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Company.find().exec(function(err, companies){
      if (err) {return res.negotiate(err);}
      return res.json(companies);
    });
  },

  getAll: function(req, res) {
    Company.find().exec(function(err, companies) {
      if (err) {return res.negotiate(err);}
      return res.json(companies);
    });
  },

};

