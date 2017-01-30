/**
 * InvoiceController
 *
 * @description :: Server-side logic for managing invoices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    Invoice
      .findOne({ order: order })
      .then(function(exists) {
        if (exists) throw new Error('invoice already exists');
        return  InvoiceService.create(order)
      })
      .then(function(invoice) {
        return Invoice.create({ id: invoice.id, order: order });
      })
      .then(function(invoice) {
        return res.json(invoice);
      })
      .catch(function(err) {
        if (err.error && err.error.message) {
          err = new Error(err.error.message);
          return res.json(400, err);
        }
        if (err.error && err.error.error)  {
          err = new Error(err.error.error.message);
          return res.json(400, err);
        }
        if (err.error)  {
          err = new Error(err.error);
          return res.json(400, err);
        }
        return res.negotiate(err);
      });
  },

  find: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    Invoice
      .find({ order: order })
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        return res.json(400, err);
      });
  },

  send: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    InvoiceService
      .send(order)
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        if (err.error && err.error.message) {
          err = new Error(err.error.message);
          return res.negotiate(err);
        }
        if (err.error && err.error.error)  {
          err = new Error(err.error.error.message);
          return res.negotiate(err);
        }
        if (err.error)  {
          err = new Error(err.error);
          return res.negotiate(err);
        }
        return res.negotiate(err);
      });
  }
};

