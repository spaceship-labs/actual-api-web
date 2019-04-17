const mercadopago = require('mercadopago');
const moment = require('moment');

const accessToken = process.env.MP_ACCESS_TOKEN;

module.exports = {
  createOrder
};

function convertCentsToPesos(amount) {
  return amount / 100;
}

async function createOrder(orderId, payment, req) {
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
  const paymentParams = {
    transaction_amount: order.total,
    token: payment.token,
    description: 'Actual Description',
    installments: 1,
    payment_method_id: payment.payment_method_id,
    payer: {
      email: payment.email || email
    }
  };

  const { data: response, error } = await mercadopago.payment.save(paymentParams);
  if (error) {
    console.log('err mercadopago: ', error);
  }
  let mercadopagoOrder = response.toObject();
  console.log('marcadopago response ID: ', mercadopagoOrder.id);
  mercadopagoOrder.mercadoPagoId = mercadopagoOrder.id;
  mercadopagoOrder.requestData = JSON.stringify(paymentParams);
  mercadopagoOrder.responseData = JSON.stringify(mercadopagoOrder);
  mercadopagoOrder.QuotationWeb = orderId;
  mercadopagoOrder.UserWeb = userId;

  //Validar si es pago con SPEI

  mercadopagoOrder.amount = convertCentsToPesos(mercadopagoOrder.amount);
  delete mercadopagoOrder.id;
  return await MercadoPagoOrder.create(mercadopagoOrder);
}
