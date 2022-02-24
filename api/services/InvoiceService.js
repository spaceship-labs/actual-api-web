var _ = require('underscore');
var moment = require('moment');
var request = require('request-promise');
var Promise = require('bluebird');
var ALEGRAUSER = process.env.ALEGRAUSER;
var ALEGRATOKEN = process.env.ALEGRATOKEN;
var token = new Buffer(ALEGRAUSER + ':' + ALEGRATOKEN).toString('base64');
var promiseDelay = require('promise-delay');
var alegraIVAID = 2;
var alegraACCOUNTID = 1;
var RFCPUBLIC = 'XAXX010101000';
var DEFAULT_CFDI_USE = 'P01';

module.exports = {
  createOrderInvoice,
  send,
  getUnitTypeByProduct,
  getPaymentMethodBasedOnPayments,
  prepareClientParams,
  RFCPUBLIC,
  DEFAULT_CFDI_USE
};

function createOrderInvoice(orderId, req) {
  if (req) {
    var userId = UserService.getCurrentUserId(req);
    var clientId = UserService.getCurrentUserClientId(req);
  }

  return new Promise(function(resolve, reject) {
    var orderFound;
    var errInvoice;
    var invoiceCreated;

    if (process.env.MODE !== 'production') {
      resolve({});
      return;
    }

    OrderWeb.findOne(orderId)
      .populate('Client')
      .populate('Details')
      .populate('Payments')
      .then(function(order) {
        orderFound = order;

        /*
        if(order.status === 'pending-payment'){
          return Promise.resolve('Pedido pendiente por pagar');
        }
        */

        var client = order.Client;
        var details = order.Details.map(function(d) {
          return d.id;
        });
        var payments = order.Payments;
        return [
          order,
          payments,
          OrderDetailWeb.find(details).populate('Product'),
          FiscalAddress.findOne({
            CardCode: client.CardCode,
            AdresType: ClientService.ADDRESS_TYPE
          }),
          client
        ];
      })
      .spread(function(order, payments, details, address, client) {
        return [
          order,
          payments,
          prepareClient(order, client, address),
          prepareItems(details, order)
        ];
      })
      .spread(function(order, payments, client, items) {
        return prepareInvoice(order, payments, client, items);
      })
      .then(function(alegraInvoice) {
        var invoiceToCreate = {
          alegraId: alegraInvoice.id,
          OrderWeb: orderId,
          UserWeb: userId || null,
          Client: clientId || null
        };

        /*
        resolve(
          InvoiceWeb.create(invoiceToCreate)
        );
        */
        return InvoiceWeb.create(invoiceToCreate);
      })
      .then(function(result) {
        invoiceCreated = result;
        console.log('create invoice result', result);
        return send(orderId);
      })
      .then(function(sendResult) {
        console.log('send invoice result', sendResult);
        resolve(invoiceCreated);
      })
      .catch(function(err) {
        errInvoice = err;

        var log = {
          UserWeb: userId,
          Client: orderFound.Client.id,
          OrderWeb: orderId,
          Store: orderFound ? orderFound.Store : null,
          responseData: JSON.stringify(errInvoice),
          isError: true
        };

        return AlegraLogWeb.create(log);
      })
      .then(function(logCreated) {
        reject(errInvoice);
      });
  });
}

function send(orderID) {
  var order;
  return OrderWeb.findOne(orderID)
    .populate('Client')
    .then(function(_order) {
      order = _order;

      return [
        InvoiceWeb.findOne({ order: orderID }),
        FiscalAddress.findOne({
          CardCode: order.Client.CardCode,
          AdresType: ClientService.ADDRESS_TYPE
        })
      ];
    })
    .spread(function(invoice, address) {
      var client = (order || {}).Client;
      if (!invoice || (client || {}).LicTradNum === RFCPUBLIC) {
        return false;
      }

      var emails = [];
      sails.log.info('address', address.U_Correos);

      if (process.env.MODE === 'production') {
        emails = [
          address.U_Correos,
          'sergiocan@spaceshiplabs.com',
          'cgarcia@actualg.com',
          'facturacion@actualg.com'
        ];
      } else {
        emails = ['sergiocan@spaceshiplabs.com'];
      }

      var id = invoice.alegraId;
      return { id: id, emails: emails };
    })
    .then(function(data) {
      if (!data) {
        return Promise.resolve({});
      }

      var options = {
        method: 'POST',
        uri: 'https://app.alegra.com/api/v1/invoices/' + data.id + '/email',
        body: data,
        headers: {
          Authorization: 'Basic ' + token
        },
        json: true
      };
      return request(options);
    });
}

function prepareInvoice(order, payments, client, items) {
  var date = moment(order.createdAt).format('YYYY-MM-DD');
  var dueDate = moment(order.createdAt)
    .add(7, 'days')
    .format('YYYY-MM-DD');
  var data = {
    date: date,
    dueDate: dueDate,
    client: client,
    items: items,
    cfdiUse: client.cfdiUse,
    paymentMethod: getPaymentMethodBasedOnPayments(payments),
    anotation: order.folio + '-web',
    stamp: {
      generateStamp: true
    },
    orderObject: order
  };
  return createInvoice(data);
}

function getPaymentMethodBasedOnPayments(payments) {
  if (payments.length > 1) {
    if (payments[0].OrderWeb === '5bf4c9a1990c266d4b096111') {
      return 'credit-card';
    }
    return 'other';
  }

  var paymentMethod = 'other';
  var uniquePaymentMethod = payments[0];

  switch (uniquePaymentMethod.type) {
    case 'transfer':
      paymentMethod = 'transfer';
      break;

    case 'ewallet':
      paymentMethod = 'electronic-wallet';
      break;

    case 'credit-card':
    case '3-msi':
    case '3-msi-banamex':
    case '6-msi':
    case '6-msi-banamex':
    case '9-msi':
    case '9-msi-banamex':
    case '12-msi':
    case '12-msi-banamex':
    case '13-msi':
    case '18-msi':
      paymentMethod = 'credit-card';
      break;

    case 'debit-card':
      paymentMethod = 'debit-card';
      break;

    default:
      paymentMethod = 'other';
      break;
  }

  return paymentMethod;
}

function createInvoice(data) {
  var orderObject = _.clone(data.orderObject);
  delete data.orderObject;

  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/invoices',
    body: data,
    headers: {
      Authorization: 'Basic ' + token
    },
    json: true
  };

  //sails.log.info('orderObject', JSON.stringify(orderObject));

  var log = {
    Client: orderObject.Client.id,
    OrderWeb: orderObject.id,
    Store: orderObject.Store,
    requestData: JSON.stringify(data),
    url: options.uri
  };

  var resultAlegra;
  var requestError;

  return new Promise(function(resolve, reject) {
    AlegraLogWeb.create(log)
      .then(function(logCreated) {
        log.id = logCreated.id;
        return request(options);
      })
      .then(function(result) {
        resultAlegra = result;
        return AlegraLogWeb.update({ id: log.id }, { responseData: JSON.stringify(result) });
      })
      .then(function(logUpdated) {
        resolve(resultAlegra);
      })
      .catch(function(err) {
        requestError = err;
        return AlegraLogWeb.update(
          { id: log.id },
          {
            responseData: JSON.stringify(err),
            isError: true
          }
        );
      })
      .then(function(logUpdated) {
        reject(requestError);
      });
  });
}

function prepareClientParams(order, client, address) {
  const generic = !client.LicTradNum || client.LicTradNum == RFCPUBLIC;
  var data;
  console.log('generic prepareClientParams', generic);
  if (!generic) {
    data = {
      name: address.companyName,
      identification: (client.LicTradNum || '').toUpperCase(),
      email: address.U_Correos,
      cfdiUse: client.cfdiUse || DEFAULT_CFDI_USE,
      address: {
        street: address.Street,
        exteriorNumber: address.U_NumExt,
        interiorNumber: address.U_NumInt,
        colony: address.Block,
        country: 'México',
        state: address.State,
        municipality: address.U_Localidad,
        localitiy: address.City,
        zipCode: address.ZipCode
      }
    };
  } else {
    data = {
      name: order.CardName,
      identification: (RFCPUBLIC || '').toUpperCase(),
      email: order.E_Mail,
      cfdiUse: DEFAULT_CFDI_USE,
      //email: order.E_Mail,
      address: {
        country: 'México',
        state: order.U_Estado || 'Quintana Roo'
        //TODO; Check default Inovice data for GENERAL PUBLIC
      }
    };
  }
  return data;
}

function prepareClient(order, client, address) {
  const data = prepareClientParams(order, client, address);
  return createClient(data);
}

function createClient(client) {
  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/contacts',
    body: client,
    headers: {
      Authorization: 'Basic ' + token
    },
    json: true
  };
  return request(options);
}

function prepareItems(details, order) {
  var items = details.map(function(detail) {
    var discount = detail.discountPercent ? detail.discountPercent : 0;
    var product = detail.Product;
    discount = Math.abs(discount);
    const alegraDesc = product.ItemCode + ' ' + product.ItemName;
    return {
      id: detail.id,
      name: product.ItemName,
      price: detail.unitPriceWithDiscount / 1.16,
      discount: 0,
      description: alegraDesc,
      tax: [{ id: alegraIVAID }],
      productKey: product.U_ClaveProdServ == '1010101' ? '01010101' : product.U_ClaveProdServ,
      quantity: detail.quantity,
      inventory: {
        //unit:'piece',
        unit: getUnitTypeByProduct(product),
        unitCost: detail.unitPriceWithDiscount,
        initialQuantity: detail.quantity
      }
    };
  });

  /*
  var deliveryServiceItem = {
    name: 'Gastos de envío',
    price: order.deliveryFee,
    discount: 0,
    tax: [ {id: alegraIVAID} ],
    quantity: 1,
    inventory: {
      unit:'service',
      unitCost: order.deliveryFee,
      initialQuantity: 1
    }
  };

  items.push(deliveryServiceItem);
  */

  return Promise.mapSeries(items, function(item) {
    return createItemWithDelay(item);
  });

  //Uncomment to use instant requests instead of delaying the requests
  //return Promise.all(createItems(items));
}

function getUnitTypeByProduct(product) {
  var unitType = 'piece';
  if (product.Service === 'Y') {
    return 'service';
  }

  switch (product.U_ClaveUnidad) {
    case 'H87':
      unitType = 'piece';
      break;
    case 'SET':
      unitType = 'piece';
      break;
    case 'E48':
      unitType = 'service';
      break;
  }

  return unitType;
}

function createItemWithDelay(item) {
  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/items',
    body: item,
    headers: {
      Authorization: 'Basic ' + token
    },
    json: true
  };
  return promiseDelay(600, request(options)).then(function(ic) {
    //console.log('item delayed ' + item.name, new Date());
    return _.assign({}, item, { id: ic.id });
  });
}

function createItems(items) {
  return items.map(function(item) {
    var options = {
      method: 'POST',
      uri: 'https://app.alegra.com/api/v1/items',
      body: item,
      headers: {
        Authorization: 'Basic ' + token
      },
      json: true
    };
    return request(options).then(function(ic) {
      return _.assign({}, item, { id: ic.id });
    });
  });
}

function preparePayments(payments) {
  return payments.map(function(payment) {
    var date = moment(payment.createdAt).format('YYYY-MM-DD');
    return {
      date: date,
      account: { id: alegraACCOUNTID },
      amount: payment.ammount,
      bankAccount: { id: 1 },
      type: 'in',
      paymentMethod: 'cash'
    };
  });
}
