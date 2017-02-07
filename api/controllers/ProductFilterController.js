var _ = require('underscore');

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'productfilter';
    var extraParams = {
      searchFields: ['Name']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });    
  },

  list: function(req, res){
    var form = req.params.all();
    var reading;
    var query = {};

    if(form.ids){
      query = {id: form.ids};
    }

    if(form.quickread){
      reading = ProductFilter.find(query);
    }else{
      reading = ProductFilter.find(query).populate('Values');
    }
    reading.then(function(filters){
        res.json(filters);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });    
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilter.findOne({id:id}).populate('Values').populate('Categories')
      .then(function(filter){
        res.json(filter);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

};
