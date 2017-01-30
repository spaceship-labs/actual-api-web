//APP / SAP COLLECTION
module.exports = {
  schema: true,
  tableName: 'PersonContact',
  attributes: {

    //SAP FIELDS
    E_Mail:{
        columnName: 'E_MailL',
        type:'string'
    },
    FirstName:{type:'string'},
    LastName:{type:'string'},
    Name: {type:'string'},

    CntctCode:{type:'integer'},
    CardCode:{type:'string'},
    Tel1:{type:'string'},
    Cellolar:{type:'string'},
    Address:{type:'string'},
    U_Noexterior: {type:'string'},
    U_Nointerior: {type:'string'},
    U_Colonia: {type:'string'},
    U_Mpio: {type:'string'},
    U_Ciudad: {type:'string'},
    U_Estado: {type:'string'},
    U_CP: {type:'string'},
    U_Entrecalle: {type:'string'},
    U_Ycalle: {type:'string'},  
    U_Notes1: {type:'string'},  
    U_Latitud: {type:'string'},  
    U_Longitud: {type:'string'},  

  }
};
