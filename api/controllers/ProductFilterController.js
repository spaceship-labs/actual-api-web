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

  //TODO: check why .add() doesnt work on categories.
  create: function(req, res){
    var form = req.params.all();
    //Creating filter
    ProductFilter.create(form)
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },


  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    sails.log.debug(form);
    ProductFilter.update({id:id},form)
      .then(function(updatedFilter){
        res.json(updatedFilter);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },



  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;

    ProductFilter.destroy({id:id})
      .then(function(){
        res.json({destroyed:true});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  }
};
