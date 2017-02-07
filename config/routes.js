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

  '/auth/signin':{
    controller: 'auth',
    action: 'signin'
  },

  '/auth/manager':{
    controller:'auth',
    action:'authorizeManager'
  },

  '/user/create':{
    controller: 'user',
    action: 'create'
  },

  '/user/findbyid/:id':{
    controller: 'user',
    action: 'findById'
  },

  '/user/find/:page':{
    controller: 'user',
    action: 'find'
  },

  '/user/update/:id':{
    controller: 'user',
    action: 'update'
  },

  '/product/find/:page':{
    controller: 'product',
    action: 'find'
  },

  '/product/multiplefindbyids':{
    controller: 'product',
    action: 'multipleFindByIds'
  },

  '/product/search':{
    controller: 'product',
    action: 'search'
  },

  '/product/addfiles':{
    controller: 'product',
    action: 'addFiles'
  },

  '/product/removefiles':{
    controller: 'product',
    action: 'removeFiles'
  },

  '/product/updateicon':{
    controller: 'product',
    action: 'updateIcon'
  },

  '/product/removeicon':{
    controller: 'product',
    action: 'removeIcon'
  },


  '/product/findbyid/:id':{
    controller: 'product',
    action: 'findById'
  },

  '/product/syncproductbyitemcode/:id':{
    controller: 'sync',
    action: 'syncProductByItemCode'
  },

  '/product/update/:id':{
    controller: 'product',
    action: 'update'
  },

  '/product/getproductsbysuppcatnum/:id':{
    controller: 'product',
    action: 'getProductsbySuppCatNum'
  },

  '/product/addseen/:ItemCode':{
    controller:'product',
    action:'addSeenTime'
  },

  /*
  '/product/sync/:ItemCode':{
    controller:'product',
    action:'syncProduct'
  },
  */

  '/invoice/find/:page':{
    controller: 'invoice',
    action: 'find'
  },


  '/productcategory/find/:page':{
    controller: 'productcategory',
    action: 'find'
  },

  '/productcategory/create':{
    controller: 'productcategory',
    action: 'create'
  },

  '/productcategory/getallcategories':{
    controller: 'productcategory',
    action: 'getAllCategories'
  },

  '/productcategory/getcategoriesgroups':{
    controller: 'productcategory',
    action: 'getCategoriesGroups'
  },

  '/productcategory/getmaincategories':{
    controller: 'productcategory',
    action: 'getMainCategories'
  },

  '/productcategory/findbyid/:id':{
    controller: 'productcategory',
    action: 'findById'
  },

  '/productcategory/findbyhandle/:handle':{
    controller: 'productcategory',
    action: 'findByHandle'
  },

  '/productcategory/destroy/:id':{
    controller: 'productcategory',
    action: 'destroy'
  },

  '/productcategory/update/:id':{
    controller: 'productcategory',
    action: 'update'
  },

  '/productcategory/getcategoriestree':{
    controller: 'productcategory',
    action: 'getCategoriesTree'
  },

  '/productfilter/find/:page':{
    controller: 'productfilter',
    action: 'find'
  },

  '/productfilter/list':{
    controller:'productfilter',
    action: 'list'
  },

  '/productfilter/create':{
    controller: 'productfilter',
    action: 'create'
  },

  '/productfilter/findbyid/:id':{
    controller: 'productfilter',
    action: 'findById'
  },

  '/productfilter/destroy/:id':{
    controller: 'productfilter',
    action: 'destroy'
  },

  '/productfiltervalue/create':{
    controller: 'productfiltervalue',
    action:'create'
  },

  '/productfiltervalue/update/:id':{
    controller: 'productfiltervalue',
    action:'update'
  },

  '/productfiltervalue/destroy/:id':{
    controller: 'productfiltervalue',
    action:'destroy'
  },


  '/productbrand/getall':{
    controller: 'productbrand',
    action:'getAll'
  },

  '/custombrand/find/:page':{
    controller: 'custombrand',
    action:'find'
  },

  '/custombrand/getall':{
    controller: 'custombrand',
    action:'getAll'
  },

  '/custombrand/create':{
    controller: 'custombrand',
    action:'create'
  },

  '/custombrand/update/:id':{
    controller: 'custombrand',
    action:'update'
  },

  '/custombrand/findbyid/:id':{
    controller: 'custombrand',
    action:'findById'
  },

  '/custombrand/destroy/:id':{
    controller: 'custombrand',
    action:'destroy'
  },


  '/productsize/create':{
    controller: 'productsize',
    action:'create'
  },

  '/productsize/update/:id':{
    controller: 'productsize',
    action:'update'
  },

  '/productsize/destroy/:id':{
    controller: 'productsize',
    action:'destroy'
  },

  '/productgroup/find/:page':{
    controller: 'productgroup',
    action: 'find'
  },

  '/productgroup/findbyid/:id':{
    controller: 'productGroup',
    action: 'findById'
  },

  '/productgroup/findbyid/:id':{
    controller: 'productGroup',
    action: 'findById'
  },

  '/productgroup/create':{
    controller: 'productgroup',
    action:'create'
  },

  '/productgroup/update/:id':{
    controller: 'productgroup',
    action:'update'
  },

  '/productgroup/destroy/:id':{
    controller: 'productgroup',
    action:'destroy'
  },

  '/productgroup/addproducttogroup':{
    controller: 'productgroup',
    action:'addProductToGroup'
  },


  '/productgroup/removeproductfromgroup':{
    controller: 'productgroup',
    action:'removeProductFromGroup'
  },

  '/productgroup/search':{
    controller: 'productgroup',
    action: 'search'
  },

  '/productgroup/updateicon':{
    controller: 'productgroup',
    action: 'updateIcon'
  },

  '/productgroup/removeicon':{
    controller: 'productgroup',
    action: 'removeIcon'
  },

  /*
  '/import/importimagessap': {
    controller: 'import',
    action: 'importImagesSap'
  },

  '/import/importbrokers': {
    controller: 'import',
    action: 'importBrokersToUsers'
  },
  */

  '/seller/getall':{
    controller: 'seller',
    action:'getAll'
  },

  '/client/find':{
    controller: 'client',
    action:'find'
  },

  '/client/findbyid/:id':{
    controller: 'client',
    action:'findById'
  },

  '/client/:CardCode/contacts':{
    controller:'client',
    action:'getContactsByClient'
  },

  '/client/:CardCode/update/contact/:CntctCode':{
    controller:'client',
    action:'updateContact'
  },

  '/client/:CardCode/contact/create':{
    controller:'client',
    action:'createContact'
  },

  /*
  '/client/:CardCode/fiscaladdress/create':{
    controller:'client',
    action:'createFiscalAddress'
  },
  */

  '/client/update/fiscaladdress/:id/:CardCode':{
    controller:'client',
    action:'updateFiscalAddress'
  },

  '/client/:id/ewallet':{
    controller:'client',
    action:'getEwalletByClient'
  },

  '/client/:id/balance':{
    controller:'client',
    action:'getClientBalance'
  },

  '/quotation/create':{
    controller: 'quotation',
    action: 'create'
  },

  '/quotation/update/:id':{
    controller: 'quotation',
    action: 'update'
  },

  '/quotation/findbyid/:id':{
    controller: 'quotation',
    action:'findById'
  },

  '/quotation/findbyidquickread/:id':{
    controller: 'quotation',
    action:'findByIdQuickRead'
  },


  '/quotation/findbyclient/:page':{
    controller: 'quotation',
    action:'findByClient'
  },

  '/quotation/find/:page':{
    controller: 'quotation',
    action:'find'
  },

  '/quotation/user/:userId/totals':{
    controller: 'quotation',
    action:'getTotalsByuser'
  },

  '/quotation/user/:userId/count':{
    controller: 'quotation',
    action:'getCountByUser'
  },

  '/quotation/:id/records':{
    controller:'quotation',
    action:'getRecords'
  },


  '/quotation/addrecord/:id':{
    controller:'quotation',
    action:'addRecord'
  },

  '/quotation/adddetail/:id':{
    controller:'quotation',
    action:'addDetail'
  },

  '/quotation/addmultipledetails/:id':{
    controller:'quotation',
    action:'addMultipleDetails'
  },


  '/quotation/removedetailsgroup/:quotation':{
    controller:'quotation',
    action:'removeDetailsGroup'
  },

  '/quotation/totals/:id':{
    controller: 'quotation',
    action: 'getQuotationTotals'
  },

  '/quotation/sendemail/:id':{
    controller:'quotation',
    action:'sendEmail'
  },

  '/quotation/:id/source':{
    controller:'quotation',
    action: 'updateSource'
  },

  '/quotation/:id/broker':{
    controller:'quotation',
    action: 'updateBroker'
  },

  '/quotation/:id/validatestock':{
    controller:'quotation',
    action: 'validateStock'
  },  

  '/quotation/:id/close':{
    controller: 'quotation',
    action: 'closeQuotation'
  },

  '/quotation/:id/paymentoptions':{
    controller: 'quotation',
    action:'getQuotationPaymentOptions'
  },

  '/quotation/:id/saporderconnectionlogs':{
    controller:'quotation',
    action:'getQuotationSapLogs'
  },

  '/payment/add/:quotationid':{
    controller: 'payment',
    action:'add'
  }, 

  '/payment/cancel/:quotationId/:paymentId':{
    controller: 'payment',
    action:'cancel'
  },

  '/client/update/:CardCode':{
    controller: 'client',
    action: 'update'
  },

  '/product/advancedsearch':{
    controller: 'productsearch',
    action:'advancedSearch'
  },

  '/product/searchbyfilters':{
    controller: 'productsearch',
    action:'searchByfilters'
  },

  '/product/searchbycategory':{
    controller: 'productsearch',
    action:'searchByCategory'
  },

  '/order/find/:page':{
    controller:'order',
    action:'find'
  },

  '/order/createfromquotation/:quotationId':{
    controller:'order',
    action:'createFromQuotation',
    skipAssets: true
  },

  '/order/findbyid/:id':{
    controller:'order',
    action:'findById'
  },

  '/order/user/:userId/totals':{
    controller: 'order',
    action:'getTotalsByuser'
  },

  '/order/user/:userId/count':{
    controller: 'order',
    action:'getCountByUser'
  },

  '/me/update':{
    controller:'me',
    action:'update'
  },

  '/me/cashreport':{
    controller:'me',
    action:'generateCashReport'
  },

  '/promotion/create':{
    controller: 'promotion',
    action:'create'
  },

  '/promotion/find/:page':{
    controller: 'promotion',
    action:'find'
  },

  '/promotion/findbyid/:id':{
    controller: 'promotion',
    action:'findById'
  },

  '/promotion/update/:id':{
    controller: 'promotion',
    action:'update'
  },

  '/pmperiod/create':{
    controller: 'pmperiod',
    action:'create'
  },

  '/pmperiod/update/:id':{
    controller: 'pmperiod',
    action:'update'
  },

  '/pmperiod/find/:page':{
    controller: 'pmperiod',
    action:'find'
  },

  '/pmperiod/findbyid/:id':{
    controller: 'pmperiod',
    action:'findById'
  },

  '/pmperiod/getactive':{
    controller: 'pmperiod',
    action:'getActive'
  },

  '/site/update/:handle':{
    controller:'site',
    action:'update'
  },

  '/site/findbyhandle/:handle':{
    controller:'site',
    action:'findByHandle'
  },

  '/sites':{
    controller: 'site',
    action: 'getAll'
  },

  '/store/find':{
    controller:'store',
    action:'find'
  },

  '/store/:id/promotions':{
    controller:'store',
    action:'getPromosByStore'
  },

  '/store/:id/packages':{
    controller:'store',
    action:'getPackagesByStore'
  },

  '/store/:id/sellers':{
    controller:'store',
    action:'getSellersByStore'
  },

  '/common/states':{
    controller:'common',
    action:'getStates'
  },

  '/packages/find/:page':{
    controller:'package',
    action:'findPackages'
  },

  '/packages/:id/products':{
    controller:'package',
    action:'getProducts'
  },

  '/packages/update/:id':{
    controller:'package',
    action:'update'
  },

  '/packages/details/:id':{
    controller: 'package',
    action:'getDetailedPackage'
  },

  '/quotation/getcurrentstock/:quotationId':{
    controller:'quotation',
    action: 'getCurrentStock'
  },

  '/paymentgroups':{
    controller:'payment',
    action:'getPaymentGroups'
  },

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
