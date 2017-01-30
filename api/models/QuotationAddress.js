//APP COLLECTION
module.exports = {
  attributes:{
    Quotation:{
      model:'Quotation',
    },
    name:{type:'string'},
    lastName:{type:'string'},
    dialCode: {type:'string'},
    phone:{type:'string'},
    email:{type:'string'},
    mobileDialCode:{type:'string'},
    mobilePhone: {type:'string'},
    street:{type:'string'},
    externalNumber:{type:'string'},
    internalNumber:{type:'string'},
    neighborhood: {type:'string'},
    municipality: {type:'string'},
    city:{type:'string'},
    entity:{type:'string'},
    zipCode: {type:'string'},
    street: {type:'string'},
    street2: {type:'string'},
    references:{type:'text'}
  }
}
