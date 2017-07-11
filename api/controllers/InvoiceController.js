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
    InvoiceWeb
      .findOne({ order: order })
      .then(function(exists) {
        if (exists) throw new Error('invoice already exists');
        return  InvoiceService.create(order);
      })
      .then(function(invoice) {
        return InvoiceWeb.create({ id: invoice.id, order: order });
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
    InvoiceWeb
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
  },


  sendFiscalData: function(req, res){
    var params = req.allParams();
    var form = params.form;
    var email = params.email;
    var name = params.name;

    if( !Common.validateEmail(email) ){
      res.negotiate(new Error('Email invalido'));
      return;
    }

    var formArr = [
      {label: 'Folio de compra', value: form.orderFolio},
      {label: 'RFC', value: form.LicTradNum},
      {label: 'Razón social', value: form.companyName},
      {label: 'Nombre de la empresa', value: form.companyPublicName},
      {label: 'Télefono', value: form.Phone1},
      {label: 'Email', value: form.U_Correos},
      {label: 'Calle', value: form.Street},
      {label: 'No. exterior', value: form.U_NumExt},
      {label: 'No. interior', value: form.U_NumInt},
      {label: 'Colonia', value: form.Block},
      {label: 'Ciudad', value: form.City},
      {label: 'Estado', value: form.State},
      {label: 'Código postal', value: form.ZipCode},
      {label: 'Municipio', value: form.U_Localidad},
    ];

    Email.sendFiscalData(
      name,
      email,
      formArr,
      req.activeStore,
      function(){
        res.ok({success:true});
      }
    );
  }
};

