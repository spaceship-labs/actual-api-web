/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
   * etc. depending on your default view engine) your home page.              *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  /*
  'OPTIONS /*': function (req, res) {
    res.send(200);
  },
  */

  '/': {
    controller: 'auth',
    action: 'homeStatus'
  },

  '/auth/signin': {
    controller: 'auth',
    action: 'signin'
  },

  '/user/findbyid/:id': {
    controller: 'user',
    action: 'findById'
  },

  '/user/find/:page': {
    controller: 'user',
    action: 'find'
  },

  '/user/register': {
    controller: 'user',
    action: 'register'
  },

  '/product/find/:page': {
    controller: 'product',
    action: 'find'
  },

  '/product/multiplefindbyids': {
    controller: 'product',
    action: 'multipleFindByIds'
  },

  '/product/search': {
    controller: 'product',
    action: 'search'
  },

  '/product/findbyid/:id': {
    controller: 'product',
    action: 'findById'
  },

  'GET /product/findbyslug/:slug': {
    controller: 'product',
    action: 'findBySlug'
  },

  '/product/addseen/:ItemCode': {
    controller: 'product',
    action: 'addSeenTime'
  },

  '/product/mainpromo/:id': {
    controller: 'product',
    action: 'getProductMainPromo'
  },

  '/productcategory/find/:page': {
    controller: 'productcategory',
    action: 'find'
  },

  '/productcategory/findbyid/:id': {
    controller: 'productcategory',
    action: 'findById'
  },

  '/productcategory/findbyhandle/:handle': {
    controller: 'productcategory',
    action: 'findByHandle'
  },

  '/productcategory/getcategoriestree': {
    controller: 'productcategory',
    action: 'getCategoriesTree'
  },

  '/productfilter/find/:page': {
    controller: 'productfilter',
    action: 'find'
  },

  '/productfilter/list': {
    controller: 'productfilter',
    action: 'list'
  },

  '/productfilter/findbyid/:id': {
    controller: 'productfilter',
    action: 'findById'
  },

  '/productbrand/getall': {
    controller: 'productbrand',
    action: 'getAll'
  },

  '/custombrand/find/:page': {
    controller: 'custombrand',
    action: 'find'
  },

  '/custombrand/getall': {
    controller: 'custombrand',
    action: 'getAll'
  },

  '/custombrand/findbyid/:id': {
    controller: 'custombrand',
    action: 'findById'
  },

  '/productgroup/find/:page': {
    controller: 'productgroup',
    action: 'find'
  },

  '/productgroup/findbyid/:id': {
    controller: 'productGroup',
    action: 'findById'
  },

  '/productgroup/search': {
    controller: 'productgroup',
    action: 'search'
  },

  '/client/:id/ewallet': {
    controller: 'client',
    action: 'getEwalletByClient'
  },

  '/quotation/create': {
    controller: 'quotation',
    action: 'create'
  },

  '/quotation/update/:id': {
    controller: 'quotation',
    action: 'update'
  },

  '/quotation/updatedetails/:id': {
    controller: 'quotation',
    action: 'updateDetails'
  },

  '/quotation/findbyid/:id': {
    controller: 'quotation',
    action: 'findById'
  },

  '/quotation/findbyidquickread/:id': {
    controller: 'quotation',
    action: 'findByIdQuickRead'
  },

  '/quotation/find/:page': {
    controller: 'quotation',
    action: 'find'
  },
  '/quotation/all/find/:page': {
    controller: 'quotation',
    action: 'findAll'
  },

  '/quotation/adddetail/:id': {
    controller: 'quotation',
    action: 'addDetail'
  },

  '/quotation/addmultipledetails/:id': {
    controller: 'quotation',
    action: 'addMultipleDetails'
  },

  '/quotation/removedetailsgroup/:quotation': {
    controller: 'quotation',
    action: 'removeDetailsGroup'
  },

  'DELETE /quotation/:quotation/removedetail/:detailId': {
    controller: 'quotation',
    action: 'removeDetail'
  },

  'DELETE /quotation/:quotation/removealldetails': {
    controller: 'quotation',
    action: 'removeAllDetails'
  },

  '/quotation/totals/:id': {
    controller: 'quotation',
    action: 'getQuotationTotals'
  },

  '/quotation/sendemail/:id': {
    controller: 'quotation',
    action: 'sendEmail'
  },

  '/quotation/:id/validatestock': {
    controller: 'quotation',
    action: 'validateStock'
  },

  '/quotation/:id/paymentoptions': {
    controller: 'quotation',
    action: 'getQuotationPaymentOptions'
  },

  '/quotation/:id/payments': {
    controller: 'quotation',
    action: 'getQuotationPayments'
  },

  'GET /quotation/:id/paymentattempts': {
    controller: 'quotation',
    action: 'getQuotationPaymentsAttempts'
  },

  'GET /quotation/:id/zipcodedelivery': {
    controller: 'quotation',
    action: 'getQuotationZipcodeDelivery'
  },

  '/quotation/:id/saporderconnectionlogs': {
    controller: 'quotation',
    action: 'getQuotationSapLogs'
  },

  'GET /quotation/:quotationId/leads': {
    controller: 'quotation',
    action: 'getQuotationLeads'
  },

  'GET /quotation/:id/address': {
    controller: 'quotation',
    action: 'getQuotationAddress'
  },

  'PUT /quotation/:id/address': {
    controller: 'quotation',
    action: 'updateQuotationAddress'
  },

  '/quotation/addrecord/:id': {
    controller: 'quotationrecord',
    action: 'create'
  },

  '/quotation/:id/records': {
    controller: 'quotationrecord',
    action: 'index'
  },

  '/payment/add/:quotationid': {
    controller: 'payment',
    action: 'add'
  },

  '/product/searchbyfilters': {
    controller: 'productsearch',
    action: 'searchByfilters'
  },

  '/product/searchbycategory': {
    controller: 'productsearch',
    action: 'searchByCategory'
  },

  '/order/find/:page': {
    controller: 'order',
    action: 'find'
  },

  '/order/all/find/:page': {
    controller: 'order',
    action: 'findAll'
  },

  '/order/invoicelogs/:orderId': {
    controller: 'order',
    action: 'getInvoicesLogs'
  },

  '/order/createfromquotation/:quotationId': {
    controller: 'order',
    action: 'createFromQuotation',
    skipAssets: true
  },

  '/order/findbyid/:id': {
    controller: 'order',
    action: 'findById'
  },

  '/order/user/:userId/totals': {
    controller: 'order',
    action: 'getTotalsByuser'
  },

  '/order/user/:userId/count': {
    controller: 'order',
    action: 'getCountByUser'
  },

  'POST /order/:id/ordersap': {
    controller: 'order',
    action: 'generateSapOrder'
  },

  'PUT /me/update': {
    controller: 'client',
    action: 'update'
  },

  'GET /me': {
    controller: 'me',
    action: 'getCurrentUser'
  },

  'GET /me/client': {
    controller: 'me',
    action: 'getClient'
  },

  'GET /me/client/contacts': {
    controller: 'client',
    action: 'getContactsByClient'
  },

  'POST /me/client/contacts': {
    controller: 'client',
    action: 'createContact'
  },

  'PUT /me/client/contacts/:CntctCode': {
    controller: 'client',
    action: 'updateContact'
  },

  'GET /me/client/fiscaladdress': {
    controller: 'client',
    action: 'getFiscalAddressByClient'
  },

  'PUT /me/client/fiscaladdress': {
    controller: 'client',
    action: 'updateFiscalAddress'
  },

  'POST /client/create': {
    controller: 'client',
    action: 'create'
  },

  '/client/find': {
    controller: 'client',
    action: 'find'
  },

  '/promotion/find/:page': {
    controller: 'promotion',
    action: 'find'
  },

  '/promotion/findbyid/:id': {
    controller: 'promotion',
    action: 'findById'
  },

  '/pmperiod/getactive': {
    controller: 'pmperiod',
    action: 'getActive'
  },

  '/site/findbyhandle/:handle': {
    controller: 'site',
    action: 'findByHandle'
  },

  '/site/banners/:handle': {
    controller: 'site',
    action: 'findBannersByHandle'
  },

  '/store/find': {
    controller: 'store',
    action: 'find'
  },

  '/store/:id/promotions': {
    controller: 'store',
    action: 'getPromosByStore'
  },

  '/store/packages': {
    controller: 'store',
    action: 'getPackagesByCurrentStore'
  },

  '/common/states': {
    controller: 'common',
    action: 'getStates'
  },

  '/packages/find/:page': {
    controller: 'package',
    action: 'findPackages'
  },

  '/packages/:id/products': {
    controller: 'package',
    action: 'getProducts'
  },

  '/packages/details/:id': {
    controller: 'package',
    action: 'getDetailedPackage'
  },

  '/quotation/getcurrentstock/:quotationId': {
    controller: 'quotation',
    action: 'getCurrentStock'
  },

  '/paymentgroups': {
    controller: 'payment',
    action: 'getPaymentGroups'
  },

  'GET /payment/types': {
    controller: 'payment',
    action: 'getPaymentTypes'
  },

  'GET /shipping/zipcodedelivery': {
    controller: 'shipping',
    action: 'getZipcodeDelivery'
  },

  'GET /shipping/zipcodedelivery/:id': {
    controller: 'shipping',
    action: 'getZipcodeDeliveryById'
  },

  '/spei-webhook': {
    controller: 'order',
    action: 'receiveSpeiNotification'
  },

  '/sendfiscaldata': {
    controller: 'invoice',
    action: 'sendFiscalData'
  },

  '/sendcontact': {
    controller: 'common',
    action: 'sendContact'
  },

  '/sendsuggestions': {
    controller: 'common',
    action: 'sendSuggestions'
  },

  'POST /lead/quotation/:quotationId': {
    controller: 'lead',
    action: 'createLeadAndSendQuotation'
  },
  'GET /featuredproduct/:site': {
    controller: 'featuredproduct',
    action: 'index'
  }

  /*
  '/fixorders':{
    controller:'sync',
    action:'fixOrders'
  }
  */
  /***************************************************************************
   *                                                                          *
   * Custom routes here...                                                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the custom routes above, it   *
   * is matched against Sails route blueprints. See `config/blueprints.js`    *
   * for configuration options and examples.                                  *
   *                                                                          *
   ***************************************************************************/
};
