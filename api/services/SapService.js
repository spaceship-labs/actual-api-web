var baseUrl = process.env.SAP_URL; //'http://sapnueve.homedns.org:8080'
//var baseUrl = 'http://189.149.131.100:8080';
var request = require('request-promise');
var Promise = require('bluebird');
var buildUrl = require('build-url');
var _ = require('underscore');
var moment = require('moment');

var SAP_DATE_FORMAT       = 'YYYY-MM-DD';
var CLIENT_CARD_TYPE      = 1;//1.Client, 2.Proveedor, 3.Lead
var CREATE_CONTACT_ACTION = 0;
var UPDATE_CONTACT_ACTION = 1;
var CLIENT_BALANCE_TYPE = 'client-balance';


var COMPANY_STUDIO_CODE   = '001';
var COMPANY_HOME_CODE     = '002';
var COMPANY_BOTH_CODE     = '003';
var COMPANY_KIDS_CODE     = '004';

var STUDIO_GROUP          = 'studio';
var HOME_GROUP            = 'home';
var KIDS_GROUP            = 'kids';



var reqOptions = {
  method: 'POST',
  json: true
};

module.exports = {
  createContact       : createContact,
  createSaleOrder     : createSaleOrder,
  createClient        : createClient,
  updateClient        : updateClient,
  updateContact       : updateContact,
  updateFiscalAddress : updateFiscalAddress,
  syncProduct         : syncProduct,
  buildSaleOrderRequestParams: buildSaleOrderRequestParams,
};

function syncProduct(itemCode){
  var path = 'Syncswsws';
  var requestParams = {
    ItemCode: itemCode
  };
  var endPoint = buildUrl(baseUrl,{
    path: path,
    queryParams: requestParams
  });  
  sails.log.info('endPoint syncProduct', endPoint);
  reqOptions.uri = endPoint;
  return request(reqOptions);  
}

function createClient(params){
  var path           = 'Contact';
  var client         = params.client;
  var fiscalAddress  = params.fiscalAddress || {};
  var clientContacts = params.clientContacts || [];
  delete client.Currency;

  client.LicTradNum  = client.LicTradNum || 'XAXX010101000';

  return User.findOne({id:client.User}).populate('Seller')
    .then(function(user){
      client.SlpCode = -1;//Assigns seller code from SAP
      if(user.Seller){
        client.SlpCode = user.Seller.SlpCode || -1;
      }
      return getSeriesNum(user.activeStore);
    })
    .then(function(seriesNum){
      client.Series = seriesNum; //Assigns seriesNum number depending on activeStore
      var requestParams = {
        Client: encodeURIComponent(JSON.stringify(client)),
        address: encodeURIComponent(JSON.stringify(fiscalAddress)),
        person: encodeURIComponent(JSON.stringify(clientContacts))
      };
      var endPoint = buildUrl(baseUrl,{
        path: path,
        queryParams: requestParams
      });
      sails.log.info('createClient');
      sails.log.info(decodeURIComponent(endPoint));
      reqOptions.uri = endPoint;
      return request(reqOptions);
    });

}

function updateClient(cardcode, form){
  form = _.omit(form, _.isUndefined);

  //Important: DONT UPDATE BALANCE IN SAP
  delete form.Balance;
  delete form.Currency;

  var path = 'Contact';
  var params = {
    Client: encodeURIComponent(JSON.stringify(form))
  };
  var endPoint = buildUrl(baseUrl, {
    path: path,
    queryParams: params
  });
  sails.log.info('updateClient');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}


function createContact(cardCode, form){
  var path = 'PersonContact';
  form = _.omit(form, _.isUndefined);
  form.CardCode = cardCode;
  form.action   = CREATE_CONTACT_ACTION;
  var params = {
    contact: encodeURIComponent(JSON.stringify({CardCode: cardCode})),
    person: encodeURIComponent(JSON.stringify([form]))
  };
  var endPoint = buildUrl(baseUrl,{
    path: path,
    queryParams: params
  });
  sails.log.info('createContact');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}


function updateContact(cardCode, contactIndex, form){
  var path = 'PersonContact';
  form = _.omit(form, _.isUndefined);
  form.Line = contactIndex;
  form.action = UPDATE_CONTACT_ACTION;
  var params = {
    contact: encodeURIComponent(JSON.stringify({CardCode: cardCode})),
    person: encodeURIComponent(JSON.stringify([form]))
  };
  var endPoint = buildUrl(baseUrl,{
    path: path,
    queryParams: params
  });
  sails.log.info('updateContact');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}


function updateFiscalAddress(cardcode, form){
  form.Address = form.companyName;
  var endPoint = buildAddressContactEndpoint(form, cardcode);
  sails.log.info('updateFiscalAddress');
  sails.log.info(decodeURIComponent(endPoint));  
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

/*
  @param params object properties
    quotationId,
    groupCode,
    cardCode,
    slpCode,
    cntctCode,
    quotationDetails, //Populated with products
    payments,
    exchangeRate,
    currentStore
*/
function createSaleOrder(params){
  var endPoint;
  return buildSaleOrderRequestParams(params)
    .then(function(requestParams){
      endPoint = baseUrl + requestParams;
      sails.log.info('createSaleOrder');
      sails.log.info(decodeURIComponent(endPoint));
      reqOptions.uri = endPoint;
      return request(reqOptions);
    })
    .then(function(response){
      return {
        endPoint: endPoint,
        response: response
      };
    });
}

function buildSaleOrderRequestParams(params){
  var requestParams = '/SalesOrder?sales=';
  var products = [];

  var saleOrderRequest = {
    QuotationId: params.quotationId,
    GroupCode: params.groupCode,
    ContactPersonCode: params.cntctCode,
    Currency: 'MXP',
    ShipDate: moment(getFarthestShipDate(params.quotationDetails))
      .format(SAP_DATE_FORMAT),
    SalesPersonCode: params.slpCode || -1,
    CardCode: params.cardCode,
    DescuentoPDocumento: calculateUsedEwalletByPayments(params.payments),
    WhsCode: "02",
    Group: params.currentStore.group
  };

  if(saleOrderRequest.SalesPersonCode === []){
    saleOrderRequest.SalesPersonCode = -1;
  }

  return getAllWarehouses()
    .then(function(warehouses){
      products = params.quotationDetails.map(function(detail){
        var product = {
          ItemCode: detail.Product.ItemCode,
          OpenCreQty: detail.quantity,
          WhsCode: getWhsCodeById(detail.shipCompanyFrom, warehouses),
          ShipDate: moment(detail.shipDate).format(SAP_DATE_FORMAT),
          DiscountPercent: detail.discountPercent,
          Company: getCompanyCode(detail.Product.U_Empresa, params.currentStore.group),
          Price: detail.total,
          ImmediateDelivery: isImmediateDelivery(detail.shipDate),
          DetailId: detail.id
          //unitPrice: detail.Product.Price
        };
        return product;
      });

      saleOrderRequest.WhsCode = getWhsCodeById(params.currentStore.Warehouse, warehouses);
      requestParams += encodeURIComponent(JSON.stringify(saleOrderRequest));
      requestParams += '&products=' + encodeURIComponent(JSON.stringify(products));
      requestParams += '&payments=' + encodeURIComponent(JSON.stringify(mapPaymentsToSap(params.payments, params.exchangeRate)));

      return requestParams;
    });
}

function getCompanyCode(code, storeGroup){
  var companyCode = code;
  if(companyCode === COMPANY_BOTH_CODE){
    switch (storeGroup){
      case STUDIO_GROUP:
        companyCode = COMPANY_STUDIO_CODE;
        break;
      case HOME_GROUP:
        companyCode = COMPANY_HOME_CODE;
        break;
    }
  }
  return companyCode;
}

function isImmediateDelivery(shipDate){
  var currentDate = moment().format(SAP_DATE_FORMAT);
  shipDate = moment(shipDate).format(SAP_DATE_FORMAT);
  return currentDate === shipDate;
}

function mapPaymentsToSap(payments, exchangeRate){

  payments = payments.filter(function(p){
    return p.type != CLIENT_BALANCE_TYPE;
  });


  var paymentsTopSap = payments.map(function(payment){
    var paymentSap = {
      TypePay: payment.type,
      PaymentAppId: payment.id,
      amount: payment.ammount
    };
    if(payment.currency === 'usd'){
      paymentSap.rate = exchangeRate;
    }
    if(payment.terminal){
      paymentSap.Terminal = payment.terminal;
      paymentSap.DateTerminal = moment().format(SAP_DATE_FORMAT);
      paymentSap.ReferenceTerminal = payment.verificationCode;
    }
    if(payment.msi || payment.type === 'single-payment-terminal'){
      paymentSap.CardNum = '4802';
      paymentSap.CardDate = '05/16'; //MM/YY
    }

    return paymentSap;
  });

  return paymentsTopSap;
}

function getWhsCodeById(whsId, warehouses){
  var warehouse = _.findWhere(warehouses, {id: whsId});
  if(warehouse){
    return warehouse.WhsCode;
  }
  return false;
}

function getFarthestShipDate(quotationDetails){
  var farthestShipDate = false;
  for(var i=0; i<quotationDetails.length; i++){
    if(
      (
        farthestShipDate &&
        new Date(quotationDetails[i].shipDate) >= farthestShipDate
      ) ||
      i === 0
    ){
      farthestShipDate = quotationDetails[i].shipDate;
    }
  }
  return farthestShipDate;
}

function applyExchangeRateToPayments(payments){
  var mapped = payments.map(function(payment){
    if(currency === 'usd'){
      payment.ammount = payment.ammount * payment.exchangeRate;
    }
    return payment;
  });
}


function calculateUsedEwalletByPayments(payments){
  var ewallet = 0;
  ewallet = payments.reduce(function(amount, payment){
    if(payment.type === 'ewallet'){
      amount += payment.ammount;
    }
    return amount;
  },0);
  return ewallet;
}

function getAllWarehouses(){
  return Company.find({});
}


function getSeriesNum(storeId){
  return Store.findOne({id:storeId}).populate('Warehouse')
    .then(function(store){
      return mapWhsSeries(store.Warehouse.WhsName);
    })
    .catch(function(err){
      console.log(err);
      return err;
    });
}


function mapWhsSeries(whsName){
  var series = 209;
  switch (whsName){
    case 'STUDIO MALECON':
      series = 182;
      break;
    case 'STUDIO PLAYA':
      series = 183;
      break;
    case 'STUDIO CUMBRES':
      series = 185;
      break;
    case 'STUDIO CARMEN':
      series = 181;
      break;
    case 'STUDIO MERIDA':
      series = 184;
      break;
    case 'STUDIO CHETUMAL':
      series = 186;
      break;
    case 'HOME XCARET':
      series = 209;
      break;
    case 'HOME MERIDA':
      series = 210;
      break;
    default:
      series = 209;
      break;
  }

  return series;
}

function buildAddressContactEndpoint(fields, cardcode){
  var path = '/AddressContact';
  var contact = {
    CardCode: cardcode,
    U_Correos: fields.U_Correos,
    LicTradNum: fields.LicTradNum
  };
  field = _.omit(fields, _.isUndefined);
  path += '?address=' + encodeURIComponent(JSON.stringify(fields));
  path += '&contact='+ encodeURIComponent(JSON.stringify(contact));
  return baseUrl + path;
}

