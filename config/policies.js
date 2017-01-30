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


  '*': ['isAuthenticated'],
  AuthController:{
    '*': true
  },
  UserController:{
    '*': ['isAuthenticated'],
    find: ['isAuthenticated', 'isAllowed'],
    create: ['isAuthenticated', 'isAllowed'],
    update: ['isAuthenticated', 'isAllowed'],
    send_password_recovery: true,
    update_password: true,
    stores: true
  },
  MeController: {
    '*': ['isAuthenticated'],
  },
  ProductController:{
    find: ['isAuthenticated', 'isAllowed'],
    update: ['isAuthenticated', 'isAllowed'],
    findById: true,
    search: true,
  },
  ProductCategoryController:{
    getCategoriesGroups: true,
    getCategoriesTree: true,
    findByHandle: true
  },
  ProductFilterController:{
    list: true
  },
  ProductGroupController:{
    getGroupVariants: true,
    getVariantGroupProducts: true
  },
  ImportController:{
    importImagesSap: ['isAdmin']
  },
  ProductFilterValueController:{
    getProducts: true
  },
  ProductSearchController:{
    /*
    advancedSearch: true,
    searchByFilters: true,
    searchByCategory: true,
    searchByFilterValues: true
    */
  },
  LoggingController: {
    find: true,
    create: true
  },
  PermissionController: {
    find: true
  },
  ShippingController: {
    product: true
  },
  /*
  LocalController:{
    '*':true
  }
  */


  //Por ahora
  //SyncController:{'*':true}

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
