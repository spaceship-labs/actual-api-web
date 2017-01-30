//APP COLLECTION
module.exports = {
	attributes:{
		Name:{type:'string'},
		Description:{type:'text'},
    Handle:{type:'string'},
    IsMultiple: {type:'boolean'},
    ValuesOrder: {type:'string'},
    IsColor:{type:'boolean'},
    Categories:{
      collection:'productcategory',
      via: 'Filters'
    },
    Values: {
      collection:'productfiltervalue',
      via: 'Filter'
    }
	}
}
