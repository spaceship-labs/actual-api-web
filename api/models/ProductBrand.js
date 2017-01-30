//SAP COLLECTION
module.exports = {
	//migrate:'alter',
	tableName:'ProductBrand',
	attributes:{
		ItmsGrpCod:{type:'integer', primaryKey:true},
		ItmsGrpNam:{type:'string'},

		Products:{
			collection:'product',
			via:'ItmsGrpCod'
		}
	}
}
