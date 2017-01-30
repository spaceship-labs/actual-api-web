//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema:true,
  tableName: 'QuotationRecord',
  attributes: {
    Quotation:{
      model:'Quotation',
      columnName: 'DocEntry'
    },
    User:{
      model:'User'
    },
    notes: {type:'text'},
    eventType: {type:'string'},
    dateTime: {type:'datetime'},
    files: {
      collection: 'QuotationRecordFile',
      via:'QuotationRecord',
    },
  },

  afterCreate: function(newVal, cb){
    return Quotation.update({id: newVal.Quotation}, {tracing: newVal.dateTime})
      .then(function(updated){
        cb();
      })
      .catch(function(err){
        console.log(err);
        cb();
      });
  }
};
