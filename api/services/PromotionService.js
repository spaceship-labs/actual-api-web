var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
var Promise = require('bluebird');
var _ = require('underscore');
var STUDIO_CODE = '001';
var AMBAS_CODE = '003';

module.exports ={
	getProductMainPromo: getProductMainPromo,
  getProductActivePromotions: getProductActivePromotions,
  getPromotionWithHighestDiscount: getPromotionWithHighestDiscount,
  STUDIO_CODE: STUDIO_CODE,
  AMBAS_CODE: AMBAS_CODE
};

function getProductMainPromo(productId){
  var currentDate = new Date();	
	var promotionsQuery = {
    startDate: {'$lte': currentDate},
    endDate: {'$gte': currentDate},		
	};
	var productFind = Common.nativeFindOne({_id: ObjectId(productId)}, Product);
	var promotionsFind = Common.nativeFind(promotionsQuery, Promotion);

	return Promise.join(productFind, promotionsFind)
		.then(function(results){
			var product = results[0];
			var activePromotions = results[1];

      if(!product){
        return Promise.reject(new Error('Producto no encontrado'));
      }

			var promotions = getProductActivePromotions(product, activePromotions);
			return getPromotionWithHighestDiscount(promotions);
		});
}


function getProductActivePromotions(product, activePromotions){
  var productActivePromotions = activePromotions.filter(function(promotion){
    var isValid = false;
    if(promotion.sa){
      var productSA = product.U_Empresa;
      if(productSA === AMBAS_CODE){
        productSA = STUDIO_CODE;
      }

      if(promotion.sa === productSA){
        isValid = true;
      } 
    }

    return isValid;
  });

  productActivePromotions = filterByHighestRegisteredPromotion(productActivePromotions);
  productActivePromotions = mapRelatedPromotions(productActivePromotions, product);

  return productActivePromotions;
}

function filterByHighestRegisteredPromotion(productActivePromotions){
  if(productActivePromotions.length === 0){
    return [];
  }
  var highestDiscountPromo = getPromotionWithHighestDiscount(productActivePromotions);
  var highestDiscount = highestDiscountPromo.discountPg1;

  return productActivePromotions.filter(function(promotion){
    return promotion.discountPg1 === highestDiscount;
  });
}

function mapRelatedPromotions(promotions, product){
  var mappedPromotions = promotions.map(function(promotion){
    var auxPromotion = {
      discountPg1: product.Discount,
      discountPg2: getRelatedPromotionGroupDiscount(2, promotion, product), 
      discountPg3: getRelatedPromotionGroupDiscount(3, promotion, product), 
      discountPg4: getRelatedPromotionGroupDiscount(4, promotion, product), 
      discountPg5: getRelatedPromotionGroupDiscount(5, promotion, product) 
    };

    promotion = _.extend(promotion, auxPromotion);
    return promotion;
  });

  return mappedPromotions;
}

function getRelatedPromotionGroupDiscount(group, promotion, product){
  var originalCashDiscount = promotion.discountPg1;
  var originalGroupDiscount = promotion['discountPg' + group];
  var difference = originalCashDiscount - originalGroupDiscount;
  var groupDiscount = product.Discount - difference;

  return groupDiscount;
}

function getPromotionWithHighestDiscount(promotions){
	if(promotions.length <= 0){
		return false;
	}

  var highestDiscountPromo;
  var indexMaxPromo = 0;
  var maxDiscount = 0;
  promotions = promotions || [];
  promotions.forEach(function(promo, index){
    if(promo.discountPg1 >= maxDiscount){
      maxDiscount   = promo.discountPg1;
      indexMaxPromo = index;
    }
  });	
  highestDiscountPromo = promotions[indexMaxPromo];
  return highestDiscountPromo;
}