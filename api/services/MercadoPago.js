const mercadopago = require('mercadopago');
const moment = require('moment');

const accessToken = process.env.MP_ACCESS_TOKEN;

module.exports = {
  createOrder
};

function getTotalLinesAmount(lineItems, { amount }) {
  let totalLines = lineItems.reduce((acum, lineItem) => {
    acum += lineItem.unit_price * lineItem.quantity;
    return acum;
  }, 0);
  totalLines = totalLines - amount;
  return totalLines;
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
  const customerInfo = await getOrderCustomerInfo(payment, clientId);
  const customerAddress = await getOrderCustomerAddress(order.Address);
  const lineItems = await getOrderLineItems(order.id);
  const payments = [payment];
  const charges = getOrderCharges(order, payments);
  const discountLine = getOrderDiscountLine(order, payments);
  const paymentGroup = OrderService.getGroupByQuotationPayments(payments);
  let totalLinesAmount = getTotalLinesAmount(lineItems, discountLine);
  if (charges.length > 0) {
    //Adding shipping fee
    charges[0].amount = totalLinesAmount + convertToCents(order['deliveryFeePg' + paymentGroup]);
  }
  const cardCode = _.clone(customerInfo.CardCode);
  delete customerInfo.CardCode;

  const paymentParams = {
    //Hace falta arreglar el objeto charge para que sea un monto y no un objeto
    transaction_amount: charges[0].amount,
    token: payment.token,
    description: 'Synergistic Granite Shirt',
    installments: 1,
    payment_method_id: payment.payment_method_id,
    payer: {
      email: 'salvador@hotmail.com'
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
}
