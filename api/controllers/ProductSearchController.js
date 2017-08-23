var _  = require('underscore');
var Promise = require('bluebird');

module.exports = {
  
  searchByFilters: function(req, res){
    var form           = req.allParams();
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
    //var displayProperty = SiteService.getSiteDisplayProperty(req); 

    var populateImgs   = !_.isUndefined(form.populateImgs) ? form.populateImgs : true;    
    var filterByStore  = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;    
    var productsIds    = [];
    var activeStore    = req.activeStore;
    //var societyCodes   = SiteService.getSocietyCodesByActiveStore(activeStore);

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
    //query            = Search.applySocietiesQuery(query, societyCodes); 

    if(spotlight){
      query = Search.applySpotlightQuery(query);
    }


    query.Active     = 'Y';
    //query[displayProperty] = true;
    query.excludeWeb = {'!':true};

    return processQueryForDeliveryValidationActualKids(query, form.zipcodeDeliveryId, activeStore)
      .then(function(newQuery){
        query = newQuery;
        return Search.getProductsByFilterValue(filtervalues);        
      })
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

        //sails.log.info('query', JSON.stringify(query));

        var searchQuery = {
          $or: [
            query,
            freeSaleQuery
          ]
        };

        //sails.log.info('searchQuery', searchQuery);
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
    var form           = req.allParams();
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
    //var displayProperty = SiteService.getSiteDisplayProperty(req); 

    var query          = {};
    var productsIds    = [];
    var activeStore    = req.activeStore;
    var priceField     = 'DiscountPrice';
    //var societyCodes   = SiteService.getSocietyCodesByActiveStore(activeStore);


    query = Search.getPriceQuery(query, priceField, minPrice, maxPrice);
    query = Search.applyBrandsQuery(query, brandsIds);
    query = Search.applyDiscountsQuery(query, discounts);
    //query = Search.applySocietiesQuery(query, societyCodes);            
    //query[displayProperty] = true;

    if(spotlight){
      query = Search.applySpotlightQuery(query);
    }


    var paginate       = {
      page:  form.page  || 1,
      limit: form.limit || 10
    };

    return processQueryForDeliveryValidationActualKids(query, form.zipcodeDeliveryId, activeStore)
      .then(function(newQuery){
        return Search.getProductsByCategory({Handle:handle});
      })
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
          Active: 'Y',
          excludeWeb: {'!':true}
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

        //sails.log.info('searchQuery', searchQuery);

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
  }

};


function processQueryForDeliveryValidationActualKids(query, zipcodeDeliveryId, activeStore){
  var STATES_EXCLUDED_KIDS_PETIT_CORNIER = [
    'JALISCO',
    'QUERETARO',
    'NUEVO LEON'
  ];  

  if(activeStore.name !== 'actualkids.com'){
    return Promise.resolve(query);
  }

  return ZipcodeDelivery.findOne({id:zipcodeDeliveryId})
    .then(function(zipcodeDelivery){
      //sails.log.info('zipcodeDelivery', zipcodeDelivery);
      if(!zipcodeDelivery){
        return query;
      }

      var inExcludedStates = STATES_EXCLUDED_KIDS_PETIT_CORNIER.indexOf(zipcodeDelivery.estado) > -1;
      //sails.log.info('excluding Petit Corner');
      if(inExcludedStates){
        query.ItmsGrpNam = {'!': 'Petit Corner'};
      }

      return query;
    });
}