//SAP COLLECTION
module.exports = {
  //migrate:'alter',
  tableName: 'ProductBrand',
  primaryKey: 'ItmsGrpCod',
  attributes: {
    ItmsGrpCod: { type: 'integer' },
    ItmsGrpNam: { type: 'string' },

    Products: {
      collection: 'product',
      via: 'ItmsGrpCod'
    }
  }
};
