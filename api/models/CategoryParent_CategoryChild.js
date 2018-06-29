module.exports = {
  tableName: 'productcategory_childs__productcategory_parents',
  attributes: {
    parent: {
      columnName: 'productcategory_Childs',
      model: 'productCategory'
    },
    child: {
      columnName: 'productcategory_Parents',
      model: 'productCategory'
    },
    position: {
      type: 'integer'
    }
  }
};
