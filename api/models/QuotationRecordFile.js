//APP COLLECTION
module.exports = {
  attributes: {
    filename:{type:'string'},
    name:{type:'string'},
    type:{type:'string'},
    typebase:{type:'string'},
    size:{type:'integer'},
    QuotationRecord:{
      model:'QuotationRecord',
    }
  }
}
