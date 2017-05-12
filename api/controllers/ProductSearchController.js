var _  = require('underscore');
var Promise = require('bluebird');

module.exports = {
  
  searchByFilters: function(req, res){
    var form           = req.params.all();
    var terms          = [].concat(form.keywords || []);
    var filtervalues   = [].concat(form.ids || []);
    var minPrice       = form.minPrice;
    var maxPrice       = form.maxPrice;
    var stockRanges    = form.stockRanges;
    var brandsIds      = form.brandsIds;
    var discounts      = form.discounts;
    var sortOption     = form.sortOption;
    var slowMovement   = form.slowMovement;
    var spotlight      = form.spotlight;
    var societyCodes   = form.societyCodes;
    var displayProperty = SiteService.getSiteDisplayProperty(req); 

    var queryPromos    = Search.getPromotionsQuery();
    var activeStoreId  = req.activeStore.id || false;
    var populateImgs   = !_.isUndefined(form.populateImgs) ? form.populateImgs : true;    
    var filterByStore  = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;    
    var warehouses     = [];
    var productsIds    = [];
    var promotions     = [];
    var activeStore    = req.activeStore;
    var paginate     = {
      page:  form.page  || 1,
      limit: form.items || 10
    };
    var query        = {};
    var priceField   = 'DiscountPrice';

    query            = Search.queryTerms(query, terms);
    query            = Search.getPriceQuery(query, priceField, minPrice, maxPrice);
    query            = Search.applyBrandsQuery(query, brandsIds);
    query            = Search.applyDiscountsQuery(query, discounts);
    query            = Search.applySocietiesQuery(query, societyCodes); 

    if(spotlight){
      query = Search.applySpotlightQuery(query);
    }

    if(slowMovement){
      query = Search.applySlowMovementQuery(query);      
    }

    query.Active     = 'Y';
    query[displayProperty] = true;           
    
    Search.getProductsByFilterValue(filtervalues)
      .then(function(result) {
        productsIds = result;

        if (filtervalues.length > 0) {
          query = Search.queryIdsProducts(query, productsIds);
        }
        if(filterByStore && activeStore.code){
          query[activeStore.code] = {'>':0};
        }

        if(stockRanges && _.isArray(stockRanges) && stockRanges.length > 0 ){
          delete query[activeStore.code];
          query = Search.applyStockRangesQuery(query, activeStore.code, stockRanges);
        }

        var freeSaleQuery = _.clone(query);
        freeSaleQuery = _.extend(freeSaleQuery, {
          freeSale: true,
          freeSaleStock: {'>':0}
        });
        delete freeSaleQuery[activeStore.code];

        var searchQuery = {
          $or: [
            query,
            freeSaleQuery
          ]
        };

        var find = Product.find(searchQuery);
        var sortValue = 'DiscountPrice ASC';

        if(populateImgs){
          //find = find.populate('files');
        }

        if(sortOption){
          sortValue = Search.getSortValueBySortOption(sortOption, activeStore);
        }

        return [
          Product.count(searchQuery),
          find.paginate(paginate).sort(sortValue)
        ];        
      })
      .spread(function(total, products) {
        return res.json({total: total, products: products});
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },


  searchByCategory: function(req, res) {
    var form           = req.params.all();
    var handle         = [].concat(form.category);
    var filtervalues   = _.isArray(form.filtervalues) ? [].concat(form.filtervalues) : [];
    var queryPromos    = Search.getPromotionsQuery();
    var activeStoreId  = req.activeStore.id || false;
    var filterByStore  = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;   
    var minPrice       = form.minPrice;
    var maxPrice       = form.maxPrice;
    var stockRanges    = form.stockRanges;
    var brandsIds      = form.brandsIds;
    var discounts      = form.discounts;
    var sortOption     = form.sortOption;
    var slowMovement   = form.slowMovement;
    var spotlight      = form.spotlight;
    var societyCodes   = form.societyCodes;
    var displayProperty = SiteService.getSiteDisplayProperty(req); 

    var query          = {};
    var productsIds    = [];
    var promotions     = [];
    var activeStore    = req.activeStore;
    var priceField     = 'DiscountPrice';

    query = Search.getPriceQuery(query, priceField, minPrice, maxPrice);
    query = Search.applyBrandsQuery(query, brandsIds);
    query = Search.applyDiscountsQuery(query, discounts);
    query = Search.applySocietiesQuery(query, societyCodes);            
    query[displayProperty] = true;

    if(spotlight){
      query = Search.applySpotlightQuery(query);
    }

    if(slowMovement){
      query = Search.applySlowMovementQuery(query);      
    }

    var paginate       = {
      page:  form.page  || 1,
      limit: form.limit || 10
    };
    var productsIdsAux = [];

    Search.getProductsByCategory({Handle:handle})
      .then(function(results) {
        var categoryProducts = results;
        return [
          categoryProducts, 
          Search.getProductsByFilterValue(filtervalues)
        ];
      })
      .spread(function(categoryProducts, filterprods) {

        if (!handle || handle.length === 0) {
          return filterprods;
        } else if(!filtervalues || filtervalues.length === 0) {
          return categoryProducts;
        } else {
          return _.intersection(categoryProducts, filterprods);
        }

      })
      .then(function(productsIdsResult) {
        productsIds = productsIdsResult;
        
        query = _.extend(query,{
          id: productsIds,
          Active: 'Y'
        });

        if(filterByStore && activeStore.code){
          query[activeStore.code] = {'>':0};
        } 

        if(stockRanges && _.isArray(stockRanges) && stockRanges.length > 0 ){
          delete query[activeStore.code];
          query = Search.applyStockRangesQuery(query, activeStore.code, stockRanges);
        }        

        var freeSaleQuery = _.clone(query);
        freeSaleQuery = _.extend(freeSaleQuery, {
          freeSale: true,
          freeSaleStock: {'>':0}
        });
        delete freeSaleQuery[activeStore.code];

        var searchQuery = {
          $or: [
            query,
            freeSaleQuery
          ]
        };

        var sortValue = 'DiscountPrice ASC';

        if(sortOption){
          sortValue = Search.getSortValueBySortOption(sortOption, activeStore);
        }

        return [
          Product.count(searchQuery),
          Product.find(searchQuery)
            .paginate(paginate)
            .sort(sortValue)
            //.populate('files')
        ];
      })
      .spread(function(total, products) {

        return res.json({
          products: products,
          total: total
        });
      })
      .catch(function(err) {
        console.log(err);
        return res.negotiate(err);
      });
  },

  advancedSearch: function(req, res) {
    var form               = req.params.all();
    var categories         = [].concat(form.categories);
    var filtervalues       = [].concat(form.filtervalues);
    var groups             = [].concat(form.groups);
    var sas                = [].concat(form.sas);
    var populateImgs       = !_.isUndefined(form.populateImgs) ? form.populateImgs : true;
    var populatePromotions = !_.isUndefined(form.populatePromotions) ? form.populatePromotions : true;
    var queryPromos        = Search.getPromotionsQuery();
    var activeStoreId      = req.activeStore.id || false;
    var filterByStore      = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;
    var displayProperty    = SiteService.getSiteDisplayProperty(req); 
    var query              = {};
    var products           = [];
    var productsIds        = [];
    var priceField         = 'Price';
    var price        = {
      '>=': form.minPrice || 0,
      '<=': form.maxPrice || Infinity
    };

    var paginate     = {
      page:  form.page  || 1,
      limit: form.limit || 10
    };
    var filters = [
      {key: priceField, value: price},
      {key:'Active', value: 'Y'},
      {key:'OnStudio', value: form.OnStudio},
      {key:'OnHome', value: form.OnHome},
      {key:'OnKids', value: form.OnKids},
      {key:'OnAmueble', value: form.OnAmueble},
      {key:'ItemCode', value: form.itemCode}
    ];
    var orFilters = [
      {key: 'CustomBrand', values: [].concat(form.customBrands)},
      {key: 'U_Empresa', values: sas},
    ];

    Search.getProductsByCategories(
      categories, 
      {excludedCategories: form.excludedCategories}
    )
      .then(function(catprods) {
        return [
          catprods, 
          Search.getProductsByFilterValue(filtervalues), 
          Search.getProductsByGroup(groups)
        ];
      })
      .spread(function(catprods, filterprods, groupsprods) {
        return Search.getMultiIntersection([catprods, filterprods, groupsprods]);
      })
      .then(function(productsIdsResult) {
        productsIds = productsIdsResult;
        if(filterByStore && activeStoreId){
          return Store.findOne({id:activeStoreId});
        }
        return false;
      })
      .then(function(activeStore){
        if(filterByStore && activeStore.code){
          filters.push(
            {key:activeStore.code, value: {'>':0} }
          );
        }

        if( Search.areFiltersApplied(categories, filtervalues, groups) && productsIds.length > 0 ){
          filters.push({key:'id', value: productsIds});
        }
        else if( Search.areFiltersApplied(categories, filtervalues, groups) && productsIds.length === 0 ){
          return [
            Promise.resolve(0), //total products number
            Promise.resolve([])  //products
          ];
        }
        query = Search.applyFilters({},filters);
        query = Search.applyOrFilters(query,orFilters);
        
        var freeSaleQuery = _.clone(query);
        freeSaleQuery = _.extend(freeSaleQuery, {
          freeSale: true,
          freeSaleStock: {'>':0}
        });
        delete freeSaleQuery[activeStore.code];
        var searchQuery = {
          $or: [
            query,
            freeSaleQuery
          ]
        };

        products = Product.find(searchQuery);
        
        if(populateImgs){
          //products.populate('files')
        }
        products = products
          .paginate(paginate)
          .sort( priceField  + ' ASC');

        return [
          Product.count(query),
          products
        ];
      })
      .spread(function(total, products) {
        return res.json({
          total: total,
          products: products
        });
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }

};
