//APP COLLECTION
module.exports = {
  //migrate:'alter',
  attributes:{
    Name:{type:'string'},
    Description: {type:'text'},
    Handle: {type:'string'},
    Products:{
      collection:'product',
      via:'CustomBrand'
    },
    Promotions:{
      collection:'promotion',
      via:'CustomBrands'
    }
  }
}
