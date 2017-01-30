//APP/SAP COLLECTION
module.exports = {
    schema: true,
    migrate: 'alter',
    tableName: 'Product',
    attributes: {
      /*----------------/
          #SAP FIELDS
      /*---------------*/
      ItemCode:{
        type:'string',
        //primaryKey:true
      },
      ItemName:{type:'string'},
      ItmsGrpCod:{ //Brand
          type:'integer',
          model:'productbrand'
      },
      SuppCatNum:{type:'string',size:17},
      CodeBars:{type:'string'},
      OnHand:{type:'float'},
      IsCommited:{type:'float'},
      OnOrder:{type:'float'},
      Available:{type:'float'},
      PicturName:{type:'string'},
      SalUnitMsr:{type:'string'},
      U_LINEA:{type:'string',size:60},
      U_PRODUCTO:{type:'string',size:60},
      U_COLOR:{type:'string',size:60},
      U_garantia:{type:'string',size:60},
      U_disenado_en:{type:'string',size:60},
      U_ensamblado_en:{type:'string',size:60},
      U_importador: {type:'string',size:60},
      U_pctPuntos:{type:'float'},
      U_FAMILIA:{type:'string', size:30},
      U_Empresa:{type:'string'},
      nameSA: {type:'string',columnName:'EmpresaName'},

      //FIELDS FROM PRICE TABLE
      PriceList:{type:'integer', size: 4},
      Price:{type:'float'},
      Currency:{type:'string',size:3},

      /*----------------/
          #EXTRA FIELDS
      /*---------------*/
      Name:{type:'string'},
      Handle:{type:'string'},
      Description:{type:'text'},
      //CHECAR Model:{type:'string'},

      Brand:{ //BrandExtra
          type:'integer',
          model:'productbrand'
      },

      Grouper:{type:'string',size:17},
      SA:{type:'text'},
      MainFeatures:{type:'text'},
      Restrictions:{type:'text'},
      Color: {type:'string'},
      DetailedColor:{type:'string'},
      GuaranteeText:{type:'text'},
      GuaranteeUnit:{type:'integer'},
      GuaranteeUnitMsr: {type:'string',size:30},
      Seats:{type:'string'},
      DesignedInCountry:{type:'string'},
      MadeInCountry:{type:'string'},
      EnsembleTime:{type:'string'},
      Ensemble:{type:'string'},
      PackageContent:{type:'text'},
      CommercialPieces:{type:'integer'},
      DeliveryPieces:{type:'integer'},
      Length:{type:'float'},
      LengthUnitMsr:{type:'string'},
      Width:{type:'float'},
      WidthUnitMsr:{type:'string'},
      Height:{type:'float'},
      HeightUnitMsr:{type:'string'},
      Volume:{type:'float'},
      VolumeUnitMsr:{type:'string'},
      Weight:{type:'float'},
      WeightUnitMsr:{type:'string'},
      icon_filename:{type:'string'},
      icon_name:{type:'string'},
      icon_type:{type:'string'},
      icon_typebase:{type:'string'},
      icon_size:{type:'integer'},
      icon_description:{type:'string'},
      Video:{type:'text'},
      Characteristics:{type:'text'},
      OnOffline:{type:'boolean'},
      OnStudio:{type:'boolean'},
      OnHome:{type:'boolean'},
      OnKids:{type:'boolean'},
      OnAmueble:{type:'boolean'},
      ImagesOrder:{type:'string'},
      Conservation: {type:'text'},

      CheckedPhotos : {type:'boolean'},
      CheckedStructure : {type:'boolean'},
      CheckedDescription : {type:'boolean'},
      CheckedPackage : {type:'boolean'},
      CheckedFeatures: {type: 'boolean'},

      ChairBackHeight: {type:'float'},
      ChairBackHeightUnitMsr: {type:'string'},
      SeatHeight: {type:'float'},
      SeatHeightUnitMsr: {type:'string'},
      ArmRestHeight:{type:'float'},
      ArmRestHeightUnitMsr:{type:'string'},
      Depth:{type:'float'},
      DepthUnitMsr:{type:'string'},

      freeSale: {type:'boolean'},
      freeSaleStock: {
        type:'integer',
        defaultsTo: 0
      },
      freeSaleDeliveryDays: {
        type:'integer',
        defaultsTo: 0
      },
      slowMovement:{type:'boolean'},
      seenTimes: {type:'integer'},
      immediateDelivery:{type:'boolean'},

      actual_studio_merida:{type:'integer'},
      actual_studio_malecon:{type:'integer'},
      actual_studio_playa_del_carmen:{type:'integer'},
      actual_studio_cumbres:{type:'integer'},
      actual_home_xcaret:{type:'integer'},
      actual_home_merida:{type:'integer'},
      proyectos:{type:'integer'},
      actual_proyect:{type:'integer'},


      //CACHE DISCOUNT PRICES BY STORE
      discountPrice_actual_studio_merida:{type:'float'},
      discountPrice_actual_studio_malecon:{type:'float'},
      discountPrice_actual_studio_playa_del_carmen:{type:'float'},
      discountPrice_actual_studio_cumbres:{type:'float'},
      discountPrice_actual_home_xcaret:{type:'float'},
      discountPrice_actual_home_merida:{type:'float'},
      discountPrice_proyectos:{type:'float'},
      discountPrice_actual_proyect:{type:'float'},

      //RELATIONS
      files: {
        collection: 'productfile',
        via:'Product',
        //excludeSync: true
      },
      Sizes: {
        collection: 'productsize',
        via:'Product',
      },
      Categories:{
        collection: 'ProductCategory',
        via: 'Products',
        dominant: true
      },
      FilterValues:{
        collection:'ProductFilterValue',
        via: 'Products',
        dominant: true
      },
      Groups: {
        collection: 'ProductGroup',
        via: 'Products'
      },
      CustomBrand: {
        model: 'CustomBrand'
      },
      QuotationDetails:{
        collection:'QuotationDetail',
        via:'Product'
      },
      Promotions:{
        collection: 'Promotion',
        via:'Products'
      },
      PackageRules:{
        collection:'PackageRule',
        via:'Product'
      }

    },

}
