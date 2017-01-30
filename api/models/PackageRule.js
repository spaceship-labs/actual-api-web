module.exports = {
  schema: true,
  migrate:'alter',
  attributes:{
    quantity: {type:'integer', required:true},
    discountPg1: {type:'float', required:true},
    discountPg2: {type:'float', required:true},
    discountPg3: {type:'float', required:true},
    discountPg4: {type:'float', required:true},
    discountPg5: {type:'float', required:true},

    Product:{
      model:'Product'
    },
    PromotionPackage:{
      model:'ProductGroup'
    }
  }
};
