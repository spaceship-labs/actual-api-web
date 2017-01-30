module.exports.tables = {
	usersap:{
		tableName: 'usersap',
		tableNameSqlServer: 'OUSR',
		attributes:{
			USERID:{type:'integer', primaryKey:true},
			INTERNAL_K:{type:'integer'},
			USER_CODE:{type:'string',size:8},
			U_NAME:{type:'string',size:155},
			SUPERUSER:{type:'string',size:1}
		}
	},

	/*
	color: {
		tableName: 'Color',
		tableNameSqlServer: '@COLOR',
		attributes: {
			Code:{type:'string', size:30, primaryKey: true},
			Name:{type:'string', size: 30},
		}

	},
	*/

	invoice: {
		tableName: 'Invoice',
		tableNameSqlServer: 'INV1',
		attributes: {
			DocEntry:{type:'integer', primaryKey: true},
			LineNum:{type:'integer'},
			LineStatus:{type:'integer',size:1},
			ItemCode:{type:'string',size:20},
			Dscription:{type:'string',size:100},
			Quantity:{type:'float'},
			ShipDate:{type:'datetime'},
			Price:{type:'float'},
			Currency:{type:'string',size:3},
			DiscPrcnt:{type:'float'},
			LineTotal:{type:'float'},
			OpenSum:{type:'float'},
			WhsCode:{type:'string',size:8},
			SlpCode:{type:'integer'},
			AcctCode:{type:'string'},
			DocDate:{type:'datetime'},
			BaseCard:{type:'string',size:15},
			CodeBars:{type:'string',size:254},
			unitMsr:{type:'string',size:100},
			Text:{type:'text'},
			StockPrice:{type:'float'},
			ShipToCode:{type:'string',size:50},
			ShipToDesc:{type:'string',size:254}
		}
	},

	/*
	itemprice:{
		tableName: 'ItemPrice',
		tableNameSqlServer: 'ITM1',
    	compositeKeys: ['ItemCode','PriceList'],
		attributes: {
			ItemCode: {type:'string',size:20},
			PriceList:{type:'integer', size: 4},
			Price:{type:'float'},
			Currency:{type:'string',size:3}
		},
	},
	*/


	itemwarehouse:{
		tableName: 'ItemWarehouse',
		tableNameSqlServer: 'OITW',
    	compositeKeys: ['ItemCode','WhsCode'],
		attributes: {
			ItemCode:{type:'string', size:20},
			WhsCode:{type:'string', size:20},
			OnHand:{type:'float'},
			IsCommited:{type:'float'},
			OnOrder:{type:'float'}

		}
	},


	line:{
		tableName: 'Line',
		tableNameSqlServer: '@LINEA',
		attributes: {
			Code:{type:'string', size:30,primaryKey:true},
			Name:{type:'string', size: 30},
		}
	},

	payment:{
		tableName: 'Payments',
		tableNameSqlServer: 'OVPM',
    	compositeKeys: ['DocEntry','DocNum'],
		attributes: {
			DocEntry:{type:'integer'},
			DocNum:{type:'integer'},
			DocType:{type:'string',size:1},
			Canceled:{type:'string',size:1},
			Handwrtten:{type:'string',size:1},
			Printed:{type:'string',size:1},
			DocDate:{type:'datetime'},
			DocDueDate:{type:'datetime'},
			CardCode:{type:'string',size:15},
			CardName:{type:'string',size:100},
			Address:{type:'string',size:254},
			DdctPrcnt:{type:'float'},
			DdctSum:{type:'float'},
			DocTotal:{type:'float'},
			DocTotalFC:{type:'float'},
			Comments:{type:'string',size:254},
			JrnlMemo:{type:'string',size:50},
			TransId: {type:'integer'},
			UpdateDate: {type:'datetime'},
			CreateDate: {type:'datetime'},
			TaxDate: {type:'datetime'},
			Confirmed: {type:'strig',size:1},
			PayToCode: {type:'strig',size:50},
			CancelDate: {type:'datetime'},
			U_UUID:{type:'string',size:50},
			U_SAT_SERIECFD:{type:'string',size:20},
			U_SAT_FPAGO:{type:'string',size:30},
			U_SAT_BENEFICIARIO:{type:'string',size:100},
			U_SAT_LICTRADNUM:{type:'string',size:13}
		},
	},

	/*
	pricelist:{
		tableName: 'PriceList',
		tableNameSqlServer: 'OPLN',
		attributes: {
			ListNum:{type:'integer', size:30, primaryKey: true},
			ListName:{type:'string', size: 32},
		},
	},
	*/

	/*
	product:{
		tableName: 'Product',
		tableNameSqlServer: 'OITM',
		attributes: {
	  		ItemCode:{
	      		type:'string',
	      		primaryKey:true
	    	},
   			ItemName:{type:'string'},
			CodeBars:{type:'string'},
			OnHand:{type:'string'},
			IsCommited:{type:'float'},
			BuyUnitMsr:{type:'string'},
			SalUnitMsr:{type:'string'},
			PicturName:{type:'string'},
			PurPackMsr:{type:'string'},
			PurPackUn:{type:'float'},
			SalPackMsr:{type:'string'},
			U_LINEA:{type:'string',size:60},
			U_PRODUCTO:{type:'string',size:60},
			U_COLOR:{type:'string',size:60},
			U_garantia:{type:'string',size:60},
		},
	},
	*/
	
	/*
	productcategory:{
		tableName: 'ProductCategory',
		tableNameSqlServer: '@PRODUCTO',
		attributes: {
			Code:{type:'string', size:30, primaryKey:true},
			Name:{type:'string', size: 30},
		}
	},
	*/

	/*
	quotation: {
		tableName: 'Quotation',
		tableNameSqlServer: 'QUT1',
    	compositeKeys: ['DocEntry','LineNum'],
		attributes: {
			DocEntry:{type:'integer'},
			LineNum:{type:'integer'},
			ItemCode:{type:'string', size:20},
			Dscription:{type:'string', size: 100},
			Quantity:{type:'float'},
			ShipDate:{type:'datetime'},
			Price:{type:'float'},
			Currency:{type:'string',size:3},
			DiscPrcnt:{type:'float'},
			LineTotal:{type:'float'},
			OpenSum:{type:'float'},
			VendorNum:{type:'string',size:17},
			WhsCode:{type:'string',size:8},
			DocDate:{type:'datetime'},
			ShipToCode:{type:'string',size:50},
			ShipToDesc:{type:'string',size:254}
		},
	},
	*/

	saleopportunity:{
		tableName: 'SaleOpportunity',
		tableNameSqlServer: 'OOPR',
		attributes: {
			OpprId:{type:'integer',primaryKey:true},
			CardCode:{type:'string', size: 15},
			OpenDate:{type:'datetime'},
			Memo:{type:'text'},
			Status:{type:'string',size:1},
			CardName:{type:'string',size:100}
		},
	},


	warehouse:{
		tableName: 'Warehouse',
		tableNameSqlServer: 'OWHS',
		attributes: {
			WhsCode:{type:'string', size:8,primaryKey:true},
			WhsName:{type:'string', size: 100},
			IntrnalKey:{type:'integer'},
			U_Calle:{type:'string',size:150},
			U_noExterior:{type:'string', size:15},
			U_noInterior:{type:'string',size:15},
			U_Colonia:{type:'string',size:150},
			U_Localidad:{type:'string',size:150},
			U_Municipio:{type:'string',size:150},
			U_Estado:{type:'string',size:50},
			U_Pais:{type:'string',size:50},
			U_CodigoPostal:{type:'string',size:10},
			U_Serie_FCP:{type:'string',size:25},
			U_Serie_ND:{type:'string',size:25},
			U_Serie_NC:{type:'string',size:25},
			U_Serie_FR:{type:'string',size:25},
			U_Serie_FA:{type:'string',size:25},
			U_EsTransito:{type:'integer'},
			U_Bodega:{type:'integer'},
			U_InfoWhs:{type:'integer'},
			U_Procesado:{type:'integer'}
		}
	},

	productbrand:{
		tableName:'ProductBrand',
		tableNameSqlServer: 'OITB',
		attributes:{
			ItmsGrpCod:{type:'integer', primaryKey:true},
			ItmsGrpNam:{type:'string'},			
		}
	}	

};
