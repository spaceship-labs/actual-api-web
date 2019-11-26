var Promise = require('bluebird');
var moment = require('moment');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
  freeSpeiUnpaidOrderDetails: freeSpeiUnpaidOrderDetails,
  sendUnpaidOrdersReminder: sendUnpaidOrdersReminder,
  sendExpirationOrders: sendExpirationOrders
};

function sendUnpaidOrdersReminder() {
  var currentDate = new Date();
  var ordersIds;
  var query = {
    isSpeiOrder: true,
    speiExpirationReminderStartDate: { '<=': currentDate },
    status: 'pending-payment',
    paymentReminderSent: { '!': true }
  };
  return OrderWeb.find(query)
    .populate('Store')
    .populate('Client')
    .populate('QuotationWeb')
    .then(function(orders) {
      if (!orders || orders.length <= 0) {
        return Promise.resolve();
      }

      console.log('sendUnpaidOrdersReminder', new Date());
      ordersIds = orders.map(function(order) {
        return order.id;
      });

      return Promise.map(orders, function(order) {
        var clientName = order.Client.CardName;
        var clientEmail = order.Client.E_Mail;
        var folio = order.QuotationWeb.folio;
        var store = order.Store;
        var speiExpirationPayment = order.speiExpirationPayment;
        sails.log.info('quotation folio reminder', folio);
        return Email.sendSpeiReminder(clientName, clientEmail, speiExpirationPayment, folio, store);
      });
    })
    .then(function() {
      if (ordersIds && ordersIds.length > 0) {
        return OrderWeb.update({ id: ordersIds })
          .set({ paymentReminderSent: true })
          .fetch();
      } else {
        return Promise.resolve();
      }
    });
}

function sendExpirationOrders() {
  var currentDate = new Date();
  var ordersIds;
  var query = {
    isSpeiOrder: true,
    speiExpirationPayment: { '<=': currentDate },
    status: 'pending-payment',
    paymentExpirationSent: { '!': true }
  };
  return OrderWeb.find(query)
    .populate('Store')
    .populate('Client')
    .populate('QuotationWeb')
    .then(function(orders) {
      if (!orders || orders.length <= 0) {
        return Promise.resolve();
      }

      console.log('sendExpirationOrders', new Date());
      ordersIds = orders.map(function(order) {
        return order.id;
      });

      return Promise.map(orders, function(order) {
        var clientName = order.Client.CardName;
        var clientEmail = order.Client.E_Mail;
        var folio = order.QuotationWeb.folio;
        var store = order.Store;
        sails.log.info('quotation folio expiration', folio);
        return Email.sendSpeiExpiration(clientName, clientEmail, folio, store);
      });
    })
    .then(function() {
      if (ordersIds && ordersIds.length > 0) {
        return OrderWeb.update({ id: ordersIds })
          .set({ paymentExpirationSent: true })
          .fetch();
      } else {
        return Promise.resolve();
      }
    });
}

function freeSpeiUnpaidOrderDetails() {
  var currentDate = new Date();
  var orderDetailsIds;
  var paymentsIds;
  var ordersIds;
  var query = {
    isSpeiOrder: true,
    speiExpirationPayment: { '<=': currentDate },
    status: 'pending-payment'
  };
  return OrderWeb.find(query)
    .populate('Details')
    .populate('Payments')
    .then(function(orders) {
      if (!orders || orders.length <= 0) {
        return Promise.resolve();
      }

      console.log('freeSpeiUnpaidOrderDetails', new Date());

      ordersIds = orders.map(function(order) {
        return order.id;
      });

      orderDetailsIds = orders.reduce(function(ids, order) {
        var detailsIds = (order.Details || []).map(function(detail) {
          return detail.id;
        });
        ids = ids.concat(detailsIds);
        return ids;
      }, []);

      paymentsIds = orders.reduce(function(ids, order) {
        var _auxIds = (order.Payments || []).map(function(payment) {
          return payment.id;
        });
        ids = ids.concat(_auxIds);
        return ids;
      }, []);

      sails.log.info('ordersIds spei cancelled', ordersIds);
      //sails.log.info('orderDetailsIds spei cancelled', orderDetailsIds);
      //sails.log.info('paymentsIds spei cancelled', paymentsIds);

      //return;

      return [
        OrderDetailWeb.update({ id: orderDetailsIds })
          .set({ inSapWriteProgress: false })
          .fetch(),
        OrderWeb.update({ id: ordersIds })
          .set({ status: 'canceled' })
          .fetch(),
        PaymentWeb.update({ id: paymentsIds })
          .set({ status: 'canceled' })
          .fetch()
      ];
    })
    .spread(function(orderDetailsUpdated, ordersWebUpdated, paymentsWebUpdated) {
      sails.log.info('update freeSpeiUnpaidOrderDetails done');
      return Promise.resolve();
    });
}
