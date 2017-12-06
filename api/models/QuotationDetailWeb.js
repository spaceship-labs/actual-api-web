//APP COLLECTION
module.exports = {
  schema:true,
  tableName: 'QuotationDetailWeb',
  attributes: {
    quantity: 'integer',
    discount: 'float', //total discount
    subtotal: 'float',
    subtotal2: 'float', // includes discounts but not big ticket neither family and friends
    total: 'float',
    totalPg1: 'float',
    totalPg2: 'float',
    totalPg3: 'float',
    totalPg4: 'float',
    totalPg5: 'float',

    discountPg1: 'float',
    discountPg2: 'float',
    discountPg3: 'float',
    discountPg4: 'float',
    discountPg5: 'float',

    deliveryFee: 'float',

    financingCostPercentage: 'float',
    discountPercentPromos: 'float', //by unit (does not include big ticket or FF discount)
    discountPercent: 'float', //by unit (includes big ticket or FF discount)
    discountName: 'string',
    originalDiscountPercent: 'float',
    bigticketDiscountPercentage: {
      type: 'integer',
      enum:[0,1,2,3,4,5]
    },
    paymentGroup: 'integer',
    unitPrice: 'float',

    unitPriceWithDiscount: 'float',
    unitPriceWithDiscountPg1: 'float',
    unitPriceWithDiscountPg2: 'float',
    unitPriceWithDiscountPg3: 'float',
    unitPriceWithDiscountPg4: 'float',
    unitPriceWithDiscountPg5: 'float',

    
    ewallet: 'float',
    immediateDelivery: 'boolean',
    isFreeSale: 'boolean',
    promotionPackageRuleQuantity:{type:'integer'},

    Promotion:{
      model:'Promotion'
    },
    QuotationWeb:{
      model:'QuotationWeb',
    },    
    Product: {
      model:'Product'
    },
    User:{
      model: 'UserWeb'
    },
    Client:{
      model:'Client'
    },
    //ship
    changedShipDate:{
      type:'boolean'
    },
    creationShipDate:{
      type:'date'
    },
    shipDate: {
      type: 'date',
      required: true
    },
    originalShipDate: {
      type: 'date',
      required: true
    },       
    productDate: {
      type: 'date',
      required: true
    },
    shipCompany: {
      model: 'company',
      required: true
    },
    shipCompanyFrom:{
      model:'company',
      required: true
    },
    
    PurchaseAfter: {type:'boolean'},
    PurchaseDocument: {type:'string'},
    
    PromotionPackage:{
      model:'ProductGroup'
    },
    PromotionPackageApplied:{
      model:'ProductGroup'
    }
  },

};
