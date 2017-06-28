module.exports = {
  migrate:'alter',
  schema: true,
  attributes:{
    conektaId:{type:'string'},
    created_at:{type:'string'},
    currency:{type:'string'}, 
    amount:{type:'float'},
    payment_status:{type:'string'},

    QuotationWeb:{
      model:'QuotationWeb'
    },
    OrderWeb:{
      model:'OrderWeb'
    }  
  }
};