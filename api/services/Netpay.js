const axios = require('axios');
const _ = require('underscore');

const NetPayInstance = axios.create({
  // Dev
  //baseURL: 'https://gateway-154.netpaydev.com/gateway-ecommerce/v3',
  // Production
  baseURL: 'https://suite.netpay.com.mx/gateway-ecommerce'
  //params: { access_token: process.env.NETPAY_ACCESS_TOKEN },
});

// Alter defaults after instance has been created
NetPayInstance.defaults.headers.common['secretKey'] = process.env.NETPAY_ACCESS_TOKEN;
NetPayInstance.defaults.headers.common['Authorization'] = process.env.NETPAY_ACCESS_TOKEN; //`Bearer ${AuthData.token}`; // secretKey

const formatPaymentParams = (payment, order, email) => {
  let fullName = payment.tokenData.cardName.split(" ");
  const size = fullName.length;
  const lastName =size > 2 ? fullName.slice(-2).join(" ") : fullName[0];
  const firstName =size > 2 ? fullName.slice(0,size-2).join(" ") : fullName[1];

  return ({
  amount: parseFloat(order.total.toFixed(2)),
  source: payment.tokenData.token,
  description: 'Actual Description',
  currency: 'MXN',
  merchantReferenceCode:"actual-online-shopping",
  // installments: payment.installments,
  paymentMethod: payment.paymentMethod,
  billing: {
    email: payment.email || email,
    firstName: firstName,
    lastName: lastName,
    address: payment.tokenData.address,
  },
  redirect3dsUri: 'https://api.actualstudio.com/process3dSecure?website='+payment.tokenData.siteUrl,
  //redirect3dsUri: 'http://localhost:1337/process3dSecure?website='+payment.tokenData.siteUrl,
  saveCard: false
});
}

// obtener las ordenes con status pendiente
// obtener los ids de las ordenes de mercado pago pendientes
// pedir los estatus de cada id
// validar el status actual de la orden de mercado pago
// si el status sigue como en proceso, no hacer nada
// si cancelado pasar los staus de pago y orden web a cancelado y en la orden poner el detalle de cancelacion
// si completado para el status de pago y orden web a pagado

// const getEmailParams = async id => {
//   const {
//     Client: { CardCode, E_Mail },
//     total
//   } = await OrderWeb.findOne({ id }).populate('Client');
//   return { order_id: id, user_name: CardCode, email: E_Mail, total };
// };

// const getInProcessOrders = async () => await OrderWeb.find({ status: 'pending-payment' });
// 
// const getMercadoPagoIds = orders =>
//   orders.map(order => ({ marcagoPagoId: order.MercadoPagoOrderId, orderId: order.id }));
// 
// const getCurrentStatus = async idsArray => {
//   const promises = idsArray.map(({ orderId, marcagoPagoId }) => {
//     const { status, status_detail } = mercadoPagoInstance.get(`/payments/${marcagoPagoId}`);
//     return { status, status_detail, orderId };
//   });
//   return await Promise.all(promises);
// };

//const changeOrderCurrentStatus = async orders => {
//  const promises = orders.map(({ status, status_detail, orderId }) => {
//    match(status)
//      .on(status => status === 'in_process', () => false)
//      .on(
//        status => status === 'canceled',
//        async () => [
//          await OrderWeb.update(
//            { id: orderId },
//            { status: 'canceled', statusDetails: status_detail }
//          ),
//          await PaymentWeb.update({ OrderWeb: orderId }, { status: 'canceled' }),
//          await Email.sendRejectedPaymentEmail(
//            await getEmailParams(orderId),
//            statusMessages[statusDetail]
//          )
//        ]
//      )
//      .on(
//        status => status === 'approved',
//        async () => [
//          await OrderWeb.update({ id: orderId }, { status: 'paid', statusDetails: status_detail }),
//          await PaymentWeb.update({ OrderWeb: orderId }, { status: 'paid' })
//        ]
//      );
//  });
//  await Promise.all(promises);
//};

// const checkMercadoPagoOrdersStatus = async () => {
//   const ordersInProcess = await getInProcessOrders();
//   const mercadoPagoOrders = await getCurrentStatus(getMercadoPagoIds(ordersInProcess));
//   await changeOrderCurrentStatus(mercadoPagoOrders);
// };

async function process3dSecure(transactionTokenId){
  const {data} = await NetPayInstance.get(`/transactions/${transactionTokenId}`);
  const webOrder = await OrderWeb.findOne({transactionTokenId:transactionTokenId})
  //console.log({webOrder})
  console.log(data)
  if(data.status == "CHARGEABLE"){
    await NetpayOrder.update({transactionTokenId:transactionTokenId}, {status:"success"})
    await OrderWeb.update({id:webOrder.id}, {status:"pending-sap", NetpayOrderStatus:"success"})
    const { data: newCharge } = await NetPayInstance.post(`/charges/${transactionTokenId}/confirm`);
    await NetpayOrder.update({transactionTokenId:transactionTokenId}, {responseData:JSON.stringify(newCharge)})
    return { 
      returnURI: `/checkout/order/${webOrder.id}`,
    }  
  } else {
    await NetpayOrder.update({transactionTokenId:transactionTokenId}, {status:"failed"})
    await OrderWeb.update({id:webOrder.id}, {status:"canceled", NetpayOrderStatus:"failed"})
    return { 
      returnURI: `/checkout/order/${webOrder.id}`,
      error: `Error ${data.responseCode}: ${data.responseMsg ? data.responseMsg: 'Payment Server Error'}`
    }
  }
}
async function getNetpayError(transactionTokenId) {
  const {data} = await NetPayInstance.get(`/transactions/${transactionTokenId}`);
  return `Error ${data.responseCode}: ${data.responseMsg ? data.responseMsg: 'Payment Server Error'}`;
}
module.exports = {
  createOrder,
  process3dSecure
  //checkMercadoPagoOrdersStatus
};

async function createOrder(orderId, payment, req) {
  try {
    const userId = UserService.getCurrentUserId(req);
    const clientId = UserService.getCurrentUserClientId(req);
    const isValidStock = await StockService.validateQuotationStockById(orderId, req);
    if (!isValidStock) throw new Error('Inventario no suficiente');
    const order = await QuotationWeb.findOne({ id: orderId, Client: clientId });
    if (!order) throw new Error('Asigna una dirección de envio para continuar');
    const { E_Mail: email } = await Client.findOne({ id: clientId });
    const paymentParams = formatPaymentParams(payment, order, email);
    console.log('paymentParams: ', paymentParams);
    const { data: response }  = await NetPayInstance.post('/charges', paymentParams)
    sails.log.info({netpayresponse:response});
    const {
      source,
      amount,
      description,
      status,
      transactionTokenId,
      paymentMethod,
      currency,
      createdAt,
      returnUrl
    } = response;
    const NetpayAttributes = {
      source,
      returnUrl,
      amount,
      description,
      status,
      transactionTokenId,
      paymentMethod,
      currency,
      createdAt,
      responseData: JSON.stringify(response),
      QuotationWeb: orderId,
      UserWeb: userId,
    }
    if(status == 'failed'){
      throw await getNetpayError(transactionTokenId);
    }
    let netpayOrder = _.extend(response, NetpayAttributes);
    delete netpayOrder.id;
    return await NetpayOrder.create(netpayOrder);
  } catch (err) {
    console.log('error Netpay: ', err);
    throw new Error(err);
    //if (err.MercadoPagoError) {
    //  throw new Error(err.MercadoPagoError);
    //} else {
    //}
  }
}
