const mercadopago = require('mercadopago');
const moment = require('moment');

const accessToken = process.env.MP_ACCESS_TOKEN;

module.exports = {
  createOrder
};

function isMPSpeiOrder(mercadoPagoOrder) {
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
    console.log('ORDER TOTAL: ', parseFloat(order.total.toFixed(2)));

    const paymentParams = {
      transaction_amount: parseFloat(order.total.toFixed(2)),
      token: payment.token,
      description: 'Actual Description',
      installments: payment.installments,
      payment_method_id: payment.payment_method_id,
      payer: {
        email: payment.email || email
      }
    };
    console.log('paymentParams: ', paymentParams);
    const {
      body: { response: mercadopagoOrder }
    } = await mercadopago.payment.save(paymentParams);
    sails.log.info('mercadopago response: ', mercadopagoOrder);
    let mercadopagoOrder = response.toObject();
    console.log('marcadopago response ID: ', mercadopagoOrder.id);
    mercadopagoOrder.mercadoPagoId = mercadopagoOrder.id;
    mercadopagoOrder.requestData = JSON.stringify(paymentParams);
    mercadopagoOrder.responseData = JSON.stringify(mercadopagoOrder);
    mercadopagoOrder.QuotationWeb = orderId;
    mercadopagoOrder.UserWeb = userId;

    const speiOrder = isMPSpeiOrder(mercadopagoOrder);
    if (speiOrder) {
      mercadopagoOrder.isSpeiOrder = true;
      mercadopagoOrder = _.extend(mercadopagoOrder, speiOrder);
    }

    mercadopagoOrder.amount = convertCentsToPesos(mercadopagoOrder.amount);
    delete mercadopagoOrder.id;
    return await MercadoPagoOrder.create(mercadopagoOrder);
  } catch (err) {
    console.log('error mercadopago: ', err);
    if (err.MercadoPagoError) {
      throw new Error(err.MercadoPagoError);
    }
  }
}
