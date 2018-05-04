const baseURL = process.env.baseURL;
const baseURLFRONT = process.env.baseURLFRONT;
const surveyURL = process.env.surveyURL || 'http://cc.actualg.com/s/fc28cff';
const key = process.env.SENDGRIDAPIKEY;
const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');
const numeral = require('numeral');
const fs = require('fs');
const ejs = require('ejs');
const sendgrid = require('sendgrid').SendGrid(key);
const helper = require('sendgrid').mail;

var passwordTemplate      = fs.readFileSync(sails.config.appPath + '/views/email/password.html').toString();
var orderTemplate         = fs.readFileSync(sails.config.appPath + '/views/email/order.html').toString();
var quotationTemplate     = fs.readFileSync(sails.config.appPath + '/views/email/quotation.html').toString();
var freesaleTemplate      = fs.readFileSync(sails.config.appPath + '/views/email/freesale.html').toString();
var registerTemplate      = fs.readFileSync(sails.config.appPath + '/views/email/register.html').toString();
var fiscalDataTemplate    = fs.readFileSync(sails.config.appPath + '/views/email/fiscal-data.html').toString();
var contactTemplate       = fs.readFileSync(sails.config.appPath + '/views/email/contact.html').toString();
var quotationLogTemplate  = fs.readFileSync(sails.config.appPath + '/views/email/quotation-log.html').toString();
var speiInstructionsTemplate  = fs.readFileSync(sails.config.appPath + '/views/email/spei-instructions.html').toString();
var speiReminderTemplate  = fs.readFileSync(sails.config.appPath + '/views/email/spei-reminder.html').toString();
var speiExpirationTemplate  = fs.readFileSync(sails.config.appPath + '/views/email/spei-expiration.html').toString();
var fiscalDataClientMessageTemplate  = fs.readFileSync(sails.config.appPath + '/views/email/fiscal-data-client-message.html').toString();
var registerInvitationTemplate = fs.readFileSync(sails.config.appPath + '/views/email/register-invitation.html').toString();

passwordTemplate          = ejs.compile(passwordTemplate);
orderTemplate             = ejs.compile(orderTemplate);
quotationTemplate         = ejs.compile(quotationTemplate);
freesaleTemplate          = ejs.compile(freesaleTemplate);
registerTemplate          = ejs.compile(registerTemplate);
fiscalDataTemplate        = ejs.compile(fiscalDataTemplate);
contactTemplate           = ejs.compile(contactTemplate);
quotationLogTemplate      = ejs.compile(quotationLogTemplate);
speiInstructionsTemplate  = ejs.compile(speiInstructionsTemplate);
speiReminderTemplate      = ejs.compile(speiReminderTemplate);
speiExpirationTemplate    = ejs.compile(speiExpirationTemplate);
fiscalDataClientMessageTemplate = ejs.compile(fiscalDataClientMessageTemplate);
registerInvitationTemplate = ejs.compile(registerInvitationTemplate);


module.exports = {
  sendPasswordRecovery: password,
  sendOrderConfirmation: orderEmail,
  sendFreesale: freesaleEmail,
  sendQuotation: quotation,
  sendRegister,
  sendFiscalData,
  sendFiscalDataMessageToClient,
  sendContact,
  sendQuotationLog,
  sendSpeiInstructions,
  sendSpeiReminder,
  sendSpeiExpiration,
  sendSpeiQuotation,
  sendSuggestions,
  sendRegisterInvitation
};

function password(userName, userEmail, recoveryUrl, cb) {
  var user_name       = userName;
  var user_link       = recoveryUrl;
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var to              = new helper.Email(userEmail, userName);
  var subject         = 'Recuperar contraseña';
  var res             = passwordTemplate({
    user_name: user_name,
    user_link: user_link,
    company: {
      url: baseURL,
    },
  });
  var content         = new helper.Content("text/html", res);
  personalization.addTo(to);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve();
      } else {
        resolve(response);
      }
    });
  });
}


function sendRegisterInvitation(userName, userEmail, recoveryUrl) {
  var user_name       = userName;
  var user_link       = recoveryUrl;
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var to              = new helper.Email(userEmail, userName);
  var subject         = 'Completa tu registro en ActualGroup';
  var res             = registerInvitationTemplate({
    user_name: user_name,
    user_link: user_link,
    company: {
      url: baseURL,
    },
  });
  var content = new helper.Content("text/html", res);
  personalization.addTo(to);
  personalization.setSubject(subject);

  if(process.env.MODE !== 'production'){
    const toAux = new helper.Email("emmanuelyupit08@gmail.com", "Emmanuel");    
    personalization.addTo(toAux);

    const toAux3 = new helper.Email("luisperez@spaceshiplabs.com", "Luis");    
    personalization.addTo(toAux3);    

    const toAux4 = new helper.Email("rquijano@actualg.com", "Rene");    
    personalization.addTo(toAux4);    

  }

  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve();
      } else {
        resolve(response);
      }
    });
  });
}

function sendRegister(userName, userEmail, store, cb) {
  var user_name       = userName;
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var toAux           = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux2           = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var to              = new helper.Email(userEmail, userName);
  var subject         = '¡Bienvenido a Actual Group!';
  var res             = registerTemplate({
    clientName: user_name,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
  });
  var content         = new helper.Content("text/html", res);

  if(process.env.MODE === 'production'){	  
    personalization.addTo(to);
    personalization.addTo(toAux2);
  }

  personalization.addTo(toAux);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function sendFiscalData(form, store, cb) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();

  //var from            = new helper.Email(email, name);
  var from = getSenderByStore(store);
  var to = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux = new helper.Email('facturacionsitios@actualg.com', 'Facturacion Actual');
  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');

  var subject         = 'Datos de facturación ' + ((store || {}).name || '');
  var res             = fiscalDataTemplate({
    form: form,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store
  });
  var content         = new helper.Content("text/html", res);
  personalization.addTo(to);

  if(process.env.MODE == 'production'){
    personalization.addTo(toAux);
    personalization.addTo(toAux2);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function sendFiscalDataMessageToClient(name, email, store, cb) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();

  var from = getSenderByStore(store);
  var to = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux = new helper.Email('facturacionsitios@actualg.com', 'Facturacion Actual');
  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var toAux3 = new helper.Email(email, name);

  var subject         = 'Datos de facturación ' + ((store || {}).name || '');
  var res             = fiscalDataClientMessageTemplate({
    client_email: email,
    client_name: name,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store
  });
  var content         = new helper.Content("text/html", res);
  personalization.addTo(to);

  if(process.env.MODE == 'production'){
    personalization.addTo(toAux);
    personalization.addTo(toAux2);
    personalization.addTo(toAux3);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function sendContact(name, email, form, store, cb) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email(email, name);
  var to              = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux           = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var subject         = 'Contacto ' + ((store || {}).name || '');
  var res             = contactTemplate({
    form: form,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store
  });
  var content         = new helper.Content("text/html", res);
  personalization.addTo(to);

  if(process.env.MODE == 'production'){
    personalization.addTo(toAux);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function sendSuggestions(name, email, form, store, cb) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email(email, name);
  var to              = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux           = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var subject         = 'Quejas y sugerencias ' + ((store || {}).name || '');
  var res             = contactTemplate({
    form: form,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store
  });
  var content         = new helper.Content("text/html", res);
  personalization.addTo(to);

  if(process.env.MODE == 'production'){
    personalization.addTo(toAux);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function sendSpeiInstructions(clientName, clientEmail, quotationFolio, order, store) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var toAux = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');

  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var to              = new helper.Email(clientEmail, clientName);
  var subject         = 'Ficha de pago SPEI ' + ((store || {}).name || '');
  
  var res             = speiInstructionsTemplate({
    clientName: clientName, 
    folio: quotationFolio,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store,
    logo: store.logo || baseURL+'/logos/group.png',
    speiTransferData: {
      conektaAmount: order.conektaAmount,
      receiving_account_number: order.receiving_account_number,
      receiving_account_bank: order.receiving_account_bank
    }  
  });

  var content         = new helper.Content("text/html", res);
  personalization.addTo(toAux);

  if(process.env.MODE == 'production'){
    personalization.addTo(to);
    personalization.addTo(toAux2);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        //cb();
        resolve();
      } else {
        resolve(response);
        //cb(response);
      }
    });
  });
}

function sendSpeiReminder(clientName, clientEmail, expirationDateTime, folio, store) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var toAux = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');

  var to              = new helper.Email(clientEmail, clientName);
  var subject         = 'Cotización Recordatorio Pendiente de Pago SPEI ' + ((store || {}).name || '');
  moment.locale('es');
  var res             = speiReminderTemplate({
    clientName: clientName, 
    folio: folio,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store,
    expirationDate: moment(expirationDateTime).format('DD/MMM/YYYY'),
    expirationTime: moment(expirationDateTime).format('HH:mm a'),
    logo: store.logo || baseURL+'/logos/group.png'
  });

  var content         = new helper.Content("text/html", res);
  personalization.addTo(toAux);

  if(process.env.MODE == 'production'){
    personalization.addTo(to);
    personalization.addTo(toAux2);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        //cb();
        resolve(folio);
      } else {
        resolve(response);
        //cb(response);
      }
    });
  });
}

function sendSpeiExpiration(clientName, clientEmail, folio, store) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var toAux = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');

  var to              = new helper.Email(clientEmail, clientName);
  var subject         = 'Cotización vencimiento de tiempo límite de pago ' + ((store || {}).name || '');
  var res             = speiExpirationTemplate({
    clientName: clientName, 
    folio: folio,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store,
    logo: store.logo || baseURL+'/logos/group.png'
  });

  var content = new helper.Content("text/html", res);

  personalization.addTo(toAux);

  if(process.env.MODE == 'production'){
    personalization.addTo(to);
    personalization.addTo(toAux2);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        //cb();
        resolve();
      } else {
        resolve(response);
        //cb(response);
      }
    });
  });
}

function orderEmail(orderId) {
  return OrderWeb
    .findOne(orderId)
    .populate('Client')
    .populate('Store')
    .populate('Details')
    .populate('Payments')
    .then(function(order) {
      var client   = order.Client;
      var store    = order.Store;
      var details  = order.Details.map(function(detail) { return detail.id; });
      var payments = order.Payments.map(function(payment) { return payment.id; });
      var ewallet  = order.EwalletRecords || [];
      details      = OrderDetailWeb.find(details).populate('Product').populate('Promotion');
      payments     = PaymentWeb.find(payments);
      return [client,  order, details, payments, ewallet, store];
    })
    .spread(function(client, order, details, payments, ewallet, store) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('DD/MMM/YYYY');

        var promotionStartDate;
        var promotionEndDate;
        var promotionValidity;

        if(detail.Promotion){
          promotionStartDate  = moment(detail.Promotion.startDate);
          promotionStartDate.locale(false);
          promotionStartDate = promotionStartDate.format('DD/MMM/YYYY');

          promotionEndDate  = moment(detail.Promotion.endDate);
          promotionEndDate.locale(false);
          promotionEndDate = promotionEndDate.format('DD/MMM/YYYY');

          promotionValidity = promotionStartDate +' al ' + promotionEndDate;
        }

        return {
          id: detail.Product.id,
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: (detail.Product.DetailedColor || '').split(' ')[0],
          material: '',
          ewallet: detail.ewallet && detail.ewallet.toFixed(2),
          warranty: detail.Product.U_garantia.toLowerCase(),
          qty: detail.quantity,
          ship: date,
          price: numeral(detail.unitPrice).format('0,0.00'),
          deliveryFee: numeral(detail.deliveryFee).format('0,0.00'),
          total: numeral(detail.total).format('0,0.00'),
          discount: detail.discountPercent,
          promo: (detail.Promotion || {}).publicName,
          image: baseURL + '/uploads/products/' + detail.Product.icon_filename,
          promotionValidity: promotionValidity
        };
      });
      var payments = payments.map(function(payment) {
        var ammount =  payment.currency == 'usd' ? payment.ammount * payment.exchangeRate: payment.ammount;
        ammount = ammount.toFixed(2);
        var date    = moment(payment.createdAt);
        moment.locale('es');
        date.locale(false);
        date = date.format('DD/MMM/YYYY');
        return {
          method: paymentMethod(payment),
          date: date,
          folio: payment.folio,
          type: paymentType(payment),
          ammount: numeral(ammount).format('0,0.00'),
          currency: payment.currency
        };
      });
      var bewallet = client.ewallet;
      var pewallet = ewallet.reduce(function(acum, curr) {
        if (curr.type == 'negative') {
          return acum + curr.amount;
        }
        return acum - curr.amount;
      }, bewallet);
      var eewallet = ewallet.reduce(function(acum, curr) {
        if (curr.type == 'positive') {
          return acum + curr.amount;
        }
        return acum;
      }, 0);
      var sewallet = ewallet.reduce(function(acum, curr) {
        if (curr.type == 'negative') {
          return acum + curr.amount;
        }
        return acum;

      }, 0);
      ewallet = {
        prev: numeral(pewallet).format('0,0.00'),
        earned: numeral(eewallet).format('0,0.00'),
        spent: numeral(sewallet).format('0,0.00'),
        balance: numeral(bewallet).format('0,0.00'),
      };
      return [client, order, products, payments, ewallet, store];
    })
    .spread(function (client, order, products, payments, ewallet, store) {
      var mats = products.map(function(p) {
        return materials(p.id);
      });
      return Promise
        .all(mats)
        .then(function(mats) {
          mats.forEach(function(m, i) {
            products[i].material = m;
          });
          return sendOrder(client, order, products, payments, ewallet, store);
        });
    });
}

function sendOrder(client, order, products, payments, ewallet, store) {
    var address = 'Número interior: ' + order.U_Nointerior + '. \n';
    address += 'Número Exterior: ' + order.U_Noexterior + '. \n';
    address += 'Calle: ' + order.address + '. \n';
    address += 'Referencias: ' + order.U_Notes1 + '. \n';
    address += 'Entre calle: ' + order.U_Entrecalle + ' y calle ' + order.U_Ycalle + '. \n';
    address += 'Colonia: ' + order.U_Colonia + '. \n';
    address += 'Municipio: ' + order.U_Mpio + '. \n';
    address += 'Estado: ' + order.U_Estado + '. \n';
    address += 'C.P: ' + order.U_CP + '. \n';
    address += 'Télefono de contacto: ' + order.Tel1 + '. \n';
    address += 'Celular de contacto: ' + order.Cellolar + '. \n';
    address += 'Email de contacto: ' + order.E_Mail + '. \n';

  var emailBody = orderTemplate({
    client: {
      name: client.CardName,
      address: address,
      phone: client.Phone1,
      cel: client.Cellular,
      references: '',
      balance: numeral(client.Balance).format('0,0.00'),
    },
    order: {
      isSpeiOrder: order.isSpeiOrder,
      folio: order.folio,
      receiving_account_number: order.receiving_account_number,
      receiving_account_bank: order.receiving_account_bank,
      status: OrderService.getOrderStatusLabel(order.status),
      subtotal: numeral(order.subtotal).format('0,0.00'),
      discount: numeral(order.discount).format('0,0.00'),
      deliveryFee: numeral(order.deliveryFee).format('0,0.00'),
      total: numeral(order.total).format('0,0.00'),
      paid: numeral(order.total).format('0,0.00'),
      pending: numeral(0).format('0,0.00'),
      conektaAmount: numeral(order.conektaAmount).format('0,0.00'),      
    },
    company: {
      url: baseURL,
      logo: store.logo || baseURL+'/logos/group.png',
      survey: surveyURL,
    },
    site:{
      url: store.url || 'https://ventas.miactual.com'
    },    
    products: products,
    payments: payments,
    ewallet: {
      prev: numeral(ewallet.prev).format('0,0.00'),
      received: numeral(ewallet.earned).format('0,0.00'),
      paid: numeral(ewallet.spent).format('0,0.00'),
      balance: numeral(ewallet.balance).format('0,0.00'),
    }
  });

  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email('no-reply@actualg.com', 'Actual Group');
  var clientEmail      = client.E_Mail;
  var to               = new helper.Email(clientEmail, client.CardName);
  var subject          = 'Confirmación de compra | Folio #' + order.folio;
  var content          = new helper.Content("text/html", emailBody);

  var toAux = new helper.Email('luisperez@spaceshiplabs.com', 'Luis Perez');
  personalization.addTo(toAux);

  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var toAux3 = new helper.Email('auditoria@actualg.com', 'Auditoria ActualGroup');

  if(process.env.MODE === 'production'){
    sails.log.info('sending email order ', order.folio);
    personalization.addTo(to);
    personalization.addTo(toAux2);
    personalization.addTo(toAux3);
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve(order);
      } else {
        reject(response);
      }
    });
  });
}

function quotation(quotationId, activeStore, isCardProcessingError, lead) {
  return QuotationWeb
    .findOne(quotationId)
    .populate('Client')
    .populate('Store')
    .populate('Details')
    .then(function(quotation) {
      var client   = quotation.Client;
      var store    = quotation.Store;
      var details  = quotation.Details.map(function(detail) { return detail.id; });
      details      = QuotationDetailWeb.find(details).populate('Product').populate('Promotion');
      var payments = PaymentService.getPaymentGroupsForEmail(quotation.id, activeStore);
      var transfers = TransferService.transfers(store.group);
      return [client,  quotation, details, payments, transfers, store];
    })
    .spread(function(client, quotation, details, payments, transfers, store) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('DD/MMM/YYYY');

        var promotionStartDate;
        var promotionEndDate;
        var promotionValidity;

        if(detail.Promotion){
          promotionStartDate  = moment(detail.Promotion.startDate);
          promotionStartDate.locale(false);
          promotionStartDate = promotionStartDate.format('DD/MMM/YYYY');

          promotionEndDate  = moment(detail.Promotion.endDate);
          promotionEndDate.locale(false);
          promotionEndDate = promotionEndDate.format('DD/MMM/YYYY');

          promotionValidity = promotionStartDate +' al ' + promotionEndDate;
        }

        return {
          id: detail.Product.id,
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: (detail.Product.DetailedColor || '').split(' ')[0],
          material: '',
          ewallet: detail.ewallet && detail.ewallet.toFixed(2),
          warranty: detail.Product.U_garantia.toLowerCase(),
          qty: detail.quantity,
          ship: date,
          price: numeral(detail.unitPrice).format('0,0.00'),
          deliveryFee: numeral(detail.deliveryFee).format('0,0.00'),
          total: numeral(detail.total).format('0,0.00'),
          discount: detail.discountPercent,
          promo: (detail.Promotion || {}).publicName,
          image: baseURL + '/uploads/products/' + detail.Product.icon_filename,
          promotionValidity: promotionValidity
        };
      });
      return [client, quotation, products, payments, transfers, store];
    })
    .spread(function(client, quotation, products, payments, transfers, store) {
      var mats = products.map(function(p) {
        return materials(p.id);
      });
      return Promise
        .all(mats)
        .then(function(mats) {
          mats.forEach(function(m, i) {
            products[i].material = m;
          });

          var order = false;
          return sendQuotation(
            client, 
            quotation, 
            products, 
            payments, 
            transfers, 
            store, 
            order, 
            isCardProcessingError,
            lead
          );
        });
    });
}

function sendSpeiQuotation(quotationId, activeStore) {
  return QuotationWeb
    .findOne(quotationId)
    .populate('Client')
    .populate('Store')
    .populate('Details')
    .populate('OrderWeb')
    .then(function(quotation) {
      var client   = quotation.Client;
      var store    = quotation.Store;
      var details  = quotation.Details.map(function(detail) { return detail.id; });
      details      = QuotationDetailWeb.find(details).populate('Product').populate('Promotion');
      var payments = PaymentService.getPaymentGroupsForEmail(quotation.id, activeStore);
      var transfers = TransferService.transfers(store.group);
      var order     = quotation.OrderWeb;
      return [client,  quotation, details, payments, transfers, store, order];
    })
    .spread(function(client, quotation, details, payments, transfers, store, order) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('DD/MMM/YYYY');

        var promotionStartDate;
        var promotionEndDate;
        var promotionValidity;

        if(detail.Promotion){
          promotionStartDate  = moment(detail.Promotion.startDate);
          promotionStartDate.locale(false);
          promotionStartDate = promotionStartDate.format('DD/MMM/YYYY');

          promotionEndDate  = moment(detail.Promotion.endDate);
          promotionEndDate.locale(false);
          promotionEndDate = promotionEndDate.format('DD/MMM/YYYY');

          promotionValidity = promotionStartDate +' al ' + promotionEndDate;
        }

        return {
          id: detail.Product.id,
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: (detail.Product.DetailedColor || '').split(' ')[0],
          material: '',
          ewallet: detail.ewallet && detail.ewallet.toFixed(2),
          warranty: detail.Product.U_garantia.toLowerCase(),
          qty: detail.quantity,
          ship: date,
          price: numeral(detail.unitPrice).format('0,0.00'),
          deliveryFee: numeral(detail.deliveryFee).format('0,0.00'),
          total: numeral(detail.total).format('0,0.00'),
          discount: detail.discountPercent,
          promo: (detail.Promotion || {}).publicName,
          image: baseURL + '/uploads/products/' + detail.Product.icon_filename,
          promotionValidity: promotionValidity
        };
      });
      return [client, quotation, products, payments, transfers, store, order];
    })
    .spread(function(client, quotation, products, payments, transfers, store, order) {
      var mats = products.map(function(p) {
        return materials(p.id);
      });
      return Promise
        .all(mats)
        .then(function(mats) {
          mats.forEach(function(m, i) {
            products[i].material = m;
          });
          return sendQuotation(client, quotation, products, payments, transfers, store, order);
        });
    });
}

function sendQuotation(client, quotation, products, payments, transfers, store, order, isCardProcessingError, lead) {
  var date = moment(quotation.updatedAt);
  client = client || {};

  moment.locale('es');
  date.locale(false);

  var emailParams = {
    client: {
      name: client.CardName,
      address: '',
      phone: client.Phone1,
      cel: client.Cellular
    },
    quotation: {
      folio: quotation.folio,
      rateLimitReported: quotation.rateLimitReported,
      subtotal: numeral(quotation.subtotal).format('0,0.00'),
      discount: numeral(quotation.discount).format('0,0.00'),
      deliveryFee: numeral(quotation.deliveryFee).format('0,0.00'),
      total: numeral(quotation.total).format('0,0.00'),
      date: date.format('DD/MMM/YYYY'),
      time: date.format('LT'),
    },
    company: {
      url: baseURL,
      logo: store.logo || baseURL+'/logos/group.png',
      image: store.logo,
      name: store.name
    },
    site:{
      url: store.url || 'https://ventas.miactual.com'
    },
    products: products,
    payments: payments,
    transfers: transfers,
    /*
    ewallet: {
      balance: numeral(client.ewallet).format('0,0.00')
    },
    */
    isSpeiOrder: (order || {}).isSpeiOrder,
    isCardProcessingError: isCardProcessingError
    //speiTransferData: false
  };

  if(lead){
    emailParams.client = {
      name: lead.name,
      phone: lead.phone,
    };
  }

  var emailBody = quotationTemplate(emailParams);
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email('noreply@actualg.com', 'Actual Group');
  var clientEmail      = client.E_Mail;
  
  if(lead){
    clientEmail = lead.email;
  }

  var to               = new helper.Email(clientEmail, client.CardName);
  var subject          = 'Cotización | Folio #' + quotation.folio + ' ' + store.name;
  var content          = new helper.Content("text/html", emailBody);

  if(quotation.rateLimitReported){
    subject += ' RL';
  }
  else if(isCardProcessingError){
    subject += ' EP';    
  }
  else if((order || {}).isSpeiOrder){
    subject += ' SO';
  }

  var toAux = new helper.Email('luisperez@spaceshiplabs.com', 'Luis Perez');
  personalization.addTo(toAux);

  var toAux2 = new helper.Email('dtorres@actualg.com', 'Daniela Torres');
  var toAux3 = new helper.Email('auditoria@actualg.com', 'Auditoria ActualGroup');

  if(process.env.MODE === 'production'){
    sails.log.info('sending email quotation ', quotation.folio);
    personalization.addTo(to);
    personalization.addTo(toAux2); 
    personalization.addTo(toAux3); 
  }

  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve(quotation);
      } else {
        reject(response);
      }
    });
  });
}

function freesaleEmail(orderId) {
  return OrderWeb
    .findOne(orderId)
    .populate('Store')
    .populate('Details')
    .then(function(order) {
      var store    = order.Store;
      var details  = order.Details.map(function(detail) { return detail.id; });
      details      = OrderDetailWeb.find(details).populate('Product');
      return [ order, details, store];
    })
    .spread(function(order, details, store) {
      var products = details
        .filter(function(detail) {
          return detail.isFreeSale;
        })
        .map(function(detail) {
          var date  = moment(detail.shipDate);
          moment.locale('es');
          date.locale(false);
          date = date.format('DD/MMM/YYYY');
          return {
            id: detail.Product.id,
            name:  detail.Product.ItemName,
            code:  detail.Product.ItemCode,
            color: (detail.Product.DetailedColor || '').split(' ')[0],
            material: '',
            ewallet: detail.ewallet && detail.ewallet.toFixed(2),
            warranty: detail.Product.U_garantia.toLowerCase(),
            qty: detail.quantity,
            ship: date,
            price: numeral(detail.total).format('0,0.00'),
            image: baseURL + '/uploads/products/' + detail.Product.icon_filename
          };
        });
      return [order, products, store];
    })
    .spread(function (order, products, store) {
      var mats = products.map(function(p) {
        return materials(p.id);
      });
      return Promise
        .all(mats)
        .then(function(mats) {
          mats.forEach(function(m, i) {
            products[i].material = m;
          });
          return sendFreesale(order, products, store);
        });
    });
}

function sendFreesale(order, products, store) {
  console.log('orden ', order.folio, ' tiene ', products.length, ' articulos con freesale');
  if (!(products.length > 0)) return order;
  var emailBody = freesaleTemplate({
    order: {
      id: order.id,
      folio: order.folio,
      subtotal: numeral(order.subtotal).format('0,0.00'),
      discount: numeral(order.discount).format('0,0.00'),
      total: numeral(order.total).format('0,0.00'),
      paid: numeral(order.total).format('0,0.00'),
      pending: numeral(0).format('0,0.00'),
    },
    company: {
      url: baseURL,
      urlFront: baseURLFRONT,
      image: store.logo
    },
    products: products,
  });
  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email('no-reply@actualg.com', 'Actual Group');
  //var to               = new helper.Email(user.email, user.firstName + ' ' + user.lastName);
  var to               = new helper.Email('gmarrero@actualg.com', 'Gustavo Marrero');
  var subject          = 'Artículos freesale | Confirmación de compra Folio #' + order.folio;
  var content          = new helper.Content("text/html", emailBody);
  personalization.addTo(to);
  personalization.setSubject(subject);

  var toAux = new helper.Email('luisperez@spaceshiplabs.com', 'Luis Perez');
  personalization.addTo(toAux);

  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve(order);
      } else {
        reject(response);
      }
    });
  });
}

function sendQuotationLog(form, store, cb) {
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "Actual Group");
  var to = new helper.Email('luisperez@spaceshiplabs.com', 'Luis');
  var toAux = new helper.Email('dtorres@actualg.com', 'Daniela');
  var toAux2 = new helper.Email('eebalams@gmail.com', 'Ernesto');  

  if(process.env.MODE === 'production'){
    personalization.addTo(toAux);
    personalization.addTo(toAux2);
  }

  var subject         = 'Error en proceso de compra ' + ((store || {}).name || '');
  var res             = quotationLogTemplate({
    form: form,
    company: {
      url: baseURL,
      logo:  baseURL+'/logos/group.png',
    },
    store: store
  });
  var content         = new helper.Content("text/html", res);
  personalization.addTo(to);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST';
  request.path = '/v3/mail/send';
  request.body = requestBody;
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}


function paymentMethod(payment) {
  var payment_name;
  switch (payment.type) {
    case 'cash':
      payment_name = 'Efectivo (MXN)';
      break;
    case 'cash-usd':
      payment_name = 'Efectivo (USD)';
      break;
    case 'deposit':
      payment_name = 'Depósito';
      break;
    case 'transfer':
      payment_name = 'Transferencia';
      break;
    case 'ewallet':
      payment_name = 'Monedero electrónico';
      break;

    case 'debit-card':       
    case 'credit-card':
    case 'single-payment-terminal':
    case '3-msi':
    case '6-msi':
    case '9-msi':
    case'12-msi':
    case'18-msi':
      payment_name = 'Tarjeta';
      break;
    case 'cheque':
      payment_name = 'Cheque';
      break;
    case 'client-balance':
      payment_name = 'Saldo a favor';
      break;
    case 'client-credit':
      payment_name = 'Crédito cliente';
      break;      
    default:
      payment_name = '';
      break;
  }
  return payment_name;
}

function paymentType(payment) {
  var payment_name;
  switch (payment.type) {
    case 'cash':
    case 'cash-usd':
      payment_name = 'Contado';
      break;
    case 'deposit':
      payment_name = 'Depósito';
      break;
    case 'transfer':
      payment_name = 'Transferencia';
      break;
    case 'debit-card':
      payment_name = 'Débito ' + payment.terminal;
      break;
    case 'credit-card':
      payment_name = 'Crédito ' + payment.terminal;
      break;
    case 'single-payment-terminal':
      payment_name = 'Una sola exhibición terminal ' + payment.terminal;
      break;
    case 'ewallet':
      payment_name = 'Contado';
      break;
    case '3-msi':
    case '6-msi':
    case '9-msi':
    case'12-msi':
    case'18-msi':
      payment_name = payment.type + ' ' + payment.terminal;
      break;
    case 'cheque':
      payment_name = 'Contado';
      break;
    case 'client-balance':
      payment_name = 'Saldo a favor cliente';
      break;
    case 'client-credit':
      payment_name = 'Crédito cliente';
      break;        
    default:
      payment_name = '';
      break;
  }
  return payment_name;
}

function materials(product) {
  var material = 'Material';
  var filter = ProductFilter
    .findOne({Name: material})
    .populate('Values')
    .then(function(filter){
      return filter.Values.map(function(v) {return v.id});
    });
  var product = Product
    .findOne(product)
    .populate('FilterValues')
    .then(function(product) {
      return product.FilterValues;
    });
  return Promise
    .all([filter, product])
    .spread(function(idfilters, pfilters) {
      return pfilters
        .filter(function(f) {
          return idfilters.indexOf(f.id) != -1;
        })
        .map(function(f) {
          return f.Name;
        });
    })
    .then(function(filters){
      if (filters.length === 0) return;
      return filters[0].split(' ')[0];
    });
}

function getSenderByStore(store){
  var sender = new helper.Email('facturacion@actualstudio.com', 'Facturacion actualstudio.com');
  switch(store.name){
    case 'actualhome.com':
      sender = new helper.Email('facturacion@actualhome.com', 'Facturacion actualhome.com');
      break;
    case 'actualstudio.com':
      sender = new helper.Email('facturacion@actualstudio.com', 'Facturacion actualstudio.com');
      break;
    case 'actualkids.com':
      sender = new helper.Email('facturacion@actualkids.com', 'Facturacion actualkids.com');
      break;
  }
  return sender;
};