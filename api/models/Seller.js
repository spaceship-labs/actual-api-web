//SAP COLLECTION
module.exports = {
  tableName:'Seller',
  attributes:{
    /*
    id : {
      type:'integer',
      primaryKey: true,
      columnName: 'SlpCode'
    }*/
    SlpCode:{
      type:'integer'
    },
    SlpName: {
      type:'string'
    },
    Users: {
      collection: 'User',
      via: 'Seller'
    }
  }
}
