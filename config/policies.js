/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  '*': ['isAuthenticated','setupDefaultData'],
  AuthController:{
    '*': ['setupDefaultData']
  },
  QuotationController:{
    '*': ['setupDefaultData','isAuthenticated'],
    create: ['setupDefaultData'],
    findById: ['setupDefaultData'],
    findByIdQuickRead: ['setupDefaultData'],
    getQuotationPaymentOptions: ['setupDefaultData'],
    getCurrentStock: ['setupDefaultData'],
    addDetail:['setupDefaultData'],
    update: ['setupDefaultData'],
    getQuotationZipcodeDelivery:['setupDefaultData']
  },
  PaymentController:{
    add: ['setupDefaultData','isAuthenticated']
  },
  OrderController:{
    '*': ['isAuthenticated', 'setupDefaultData'],
    'receiveSpeiNotification': ['setupDefaultData']
  },
  UserController:{
    '*': ['setupDefaultData','isAuthenticated'],
    /*
    create: ['setupDefaultData','isAuthenticated', 'isAllowed'],
    update: ['setupDefaultData','isAuthenticated', 'isAllowed'],
    */
    send_password_recovery: ['setupDefaultData'],
    update_password: ['setupDefaultData'],
    register: ['setupDefaultData']
  },
  ClientController:{
    create:['setupDefaultData']
  },
  MeController: {
    activeStore: ['setupDefaultData']
    /*
    '*': ['setupDefaultData','isAuthenticated'],
    activeStore: ['setupDefaultData']
    */
  },
  CommonController:{
    '*':['setupDefaultData']
  },  
  ShippingController:{
    '*':['setupDefaultData']
  },  
  SiteController:{
    '*':['setupDefaultData']
  },
  CompanyController:{
    '*':['setupDefaultData']
  },  
  PMPeriodController:{
    '*':['setupDefaultData']
  },  
  ProductController:{
    '*':['setupDefaultData']
  },
  ProductFilterController:{
    '*':['setupDefaultData']
  },

  CustomBrandController:{
    '*':['setupDefaultData']
  },
  ProductCategoryController:{
    '*':['setupDefaultData']
  },
  ProductSearchController:{
    '*':['setupDefaultData']
  },
  StoreController:{
    '*':['setupDefaultData']    
  }

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  // '*': true,

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
	// RabbitController: {

		// Apply the `false` policy as the default for all of RabbitController's actions
		// (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
		// '*': false,

		// For the action `nurture`, apply the 'isRabbitMother' policy
		// (this overrides `false` above)
		// nurture	: 'isRabbitMother',

		// Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
		// before letting any users feed our rabbits
		// feed : ['isNiceToAnimals', 'hasRabbitFood']
	// }
};
