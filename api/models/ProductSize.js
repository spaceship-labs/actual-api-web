//APP COLLECTION
module.exports = {
	attributes:{
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

    Product:{
      model:'product',
      columnName:'ItemCode',
      type:'string',
      size:20,
    }
	}
}
