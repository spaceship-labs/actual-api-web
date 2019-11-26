const mercadopago = require('mercadopago');
const _ = require('underscore');
const accessToken = process.env.MP_ACCESS_TOKEN;
const statusMessages = {
  pending_contingency:
    'Estamos procesando el pago. En menos de 2 días hábiles te enviaremos por e-mail el resultado.',
  pending_review_manual:
    'Estamos procesando el pago. En menos de 2 días hábiles te diremos por e-mail si se acreditó o si necesitamos más información.',
  cc_rejected_bad_filled_card_number: 'Revisa el número de tarjeta.',
  cc_rejected_bad_filled_date: 'Revisa la fecha de vencimiento.',
  cc_rejected_bad_filled_other: 'Revisa los datos.',
  cc_rejected_bad_filled_security_code: 'Revisa el código de seguridad.',
  cc_rejected_blacklist: 'No pudimos procesar tu pago.',
  cc_rejected_call_for_authorize: 'Debes autorizar ante tu banco el pago a Mercado Pago',
  cc_rejected_card_disabled: 'Llama a banco para que active tu tarjeta.',
  cc_rejected_card_error: 'No pudimos procesar tu pago.',
  cc_rejected_duplicated_payment:
    'Ya hiciste un pago por ese valor. Si necesitas volver a pagar usa otra tarjeta u otro medio de pago.',
  cc_rejected_high_risk:
    'Tu pago fue rechazado. Elige otro de los medios de pago, te recomendamos con medios en efectivo.',
  cc_rejected_insufficient_amount: 'Tu tarjeta no tiene fondos suficientes.',
  cc_rejected_max_attempts:
    'Llegaste al límite de intentos permitidos. Elige otra tarjeta u otro medio de pago.',
  cc_rejected_other_reason: 'Tu banco no procesó el pago.'
};

const convertCentsToPesos = amount => amount / 100;

const formatPaymentParams = (payment, order, email) => ({
  transaction_amount: parseFloat(order.total.toFixed(2)),
  token: payment.token,
  description: 'Actual Description',
  installments: payment.installments,
  payment_method_id: payment.payment_method_id,
  payer: {
    email: payment.email || email
  }
});

const validateResponseStatus = (status, statusDetail) => {
  if (status === 'approved' || status === 'in_process') {
    return true;
  } else {
    throw new Error(statusMessages[statusDetail]);
  }
};

module.exports = {
  createOrder
};

async function createOrder(orderId, payment, req) {
  try {
    mercadopago.configurations.setAccessToken(accessToken);
    const userId = UserService.getCurrentUserId(req);
    const clientId = UserService.getCurrentUserClientId(req);
    const isValidStock = await StockService.validateQuotationStockById(orderId, req);
    if (!isValidStock) throw new Error('Inventario no suficiente');
    const order = await QuotationWeb.findOne({ id: orderId, Client: clientId });
    if (!order) throw new Error('Asigna una dirección de envio para continuar');
    const { E_Mail: email } = await Client.findOne({ id: clientId });
    const paymentParams = formatPaymentParams(payment, order, email);
    console.log('paymentParams: ', paymentParams);
    const { body: response } = await mercadopago.payment.save(paymentParams);
    sails.log.info('mercadopago response: ', response);
    validateResponseStatus(response.status, response.status_detail);
    const mercadoPagoAttributes = {
      mercadoPagoId: response.id,
      requestData: JSON.stringify(paymentParams),
      responseData: JSON.stringify(response),
      installments: response.installments,
      issuerId: response.issuer_id,
      status: response.status,
      status_detail: response.status_detail,
      total_paid_amount: response.total_paid_amount,
      QuotationWeb: orderId,
      UserWeb: userId,
      amount: convertCentsToPesos(response.transaction_amount)
    };
    let mercadopagoOrder = _.extend(response, mercadoPagoAttributes);
    delete mercadopagoOrder.id;
    return await MercadoPagoOrder.create(mercadopagoOrder).fetch();
  } catch (err) {
    console.log('error mercadopago: ', err);
    if (err.MercadoPagoError) {
      throw new Error(err.MercadoPagoError);
    } else {
      throw new Error(err);
    }
  }
}
