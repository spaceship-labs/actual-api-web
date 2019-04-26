const mercadopago = require('mercadopago');
const _ = require('underscore');
const moment = require('moment');

const accessToken = process.env.MP_ACCESS_TOKEN;

module.exports = {
  createOrder
};

function getSpeiDetails(mercadoPagoOrder) {
  var speiOrder = false;

  if (mercadoPagoOrder.charges) {
    var payment_method = mercadoPagoOrder.charges.data[0].payment_method;
    if (payment_method.receiving_account_number) {
      speiOrder = {
        receiving_account_bank: payment_method.receiving_account_bank,
        receiving_account_number: payment_method.receiving_account_number,
        speiExpirationPayment: getTransferExportationFromUnixTime(payment_method.expires_at)
      };
    }
  }
  return speiOrder;
}

function convertCentsToPesos(amount) {
  return amount / 100;
}

function formatPaymentParams(payment, order, email) {
  return payment.type === 'transfer'
    ? {
        transaction_amount: parseFloat(order.total.toFixed(2)),
        description: 'Actual Description',
        payment_method_id: payment.payment_method_id,
        // notification_url: 'url api actual',
        payer: {
          email: payment.email || email
        }
      }
    : {
        transaction_amount: parseFloat(order.total.toFixed(2)),
        token: payment.token,
        description: 'Actual Description',
        installments: payment.installments,
        payment_method_id: payment.payment_method_id,
        payer: {
          email: payment.email || email
        }
      };
}

async function createOrder(orderId, payment, req) {
  try {
    mercadopago.configurations.setAccessToken(accessToken);
    const userId = UserService.getCurrentUserId(req);
    const clientId = UserService.getCurrentUserClientId(req);
    const isValidStock = await StockService.validateQuotationStockById(orderId, req);
    if (!isValidStock) {
      throw new Error('Inventario no suficiente');
    }
    const order = await QuotationWeb.findOne({ id: orderId, Client: clientId });
    if (!order) {
      throw new Error('Asigna una dirección de envio para continuar');
    }
    const { E_Mail: email } = await Client.findOne({ id: clientId });
    const paymentParams = formatPaymentParams(payment, order, email);
    console.log('paymentParams: ', paymentParams);
    const { body: response } = await mercadopago.payment.save(paymentParams);
    sails.log.info('mercadopago response: ', response);
    const mercadoPagoAttributes = {
      mercadoPagoId: response.id,
      requestData: JSON.stringify(paymentParams),
      responseData: JSON.stringify(response),
      installments: response.installments,
      issuerId: response.issuer_id,
      QuotationWeb: orderId,
      UserWeb: userId,
      amount: convertCentsToPesos(response.transaction_amount)
    };
    let mercadopagoOrder = _.extend(response, mercadoPagoAttributes);
    // HACE FALTA ESTO
    const speiOrder = getSpeiDetails(mercadopagoOrder);
    if (speiOrder) {
      mercadopagoOrder = _.extend(mercadopagoOrder, { isSpeiOrder: true });
      mercadopagoOrder = _.extend(mercadopagoOrder, speiOrder);
    }
    delete mercadopagoOrder.id;
    return await MercadoPagoOrder.create(mercadopagoOrder);
  } catch (err) {
    console.log('error mercadopago: ', err);
    if (err.MercadoPagoError) {
      throw new Error(err.MercadoPagoError);
    } else {
      throw new Error(err);
    }
  }
}
