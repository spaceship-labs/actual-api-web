module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'custombrand';
    var extraParams = {
      searchFields: ['Name']
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    })
    .catch(function(err){
      console.log(err);
      res.notFound();
    });
  },

  getAll: function(req, res){
    CustomBrand.find({}).limit(1000).then(function(results){
      return res.ok(results);
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },

  create: function(req, res){
    var form = req.params.all();
    CustomBrand.create(form).then(function(created){
      res.json(created);
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },

  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    CustomBrand.destroy({id:id}).then(function(){
      res.json({destroyed:true});
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    CustomBrand.update({id:id},form).then(function(updated){
      res.json(updated);
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    CustomBrand.findOne({id:id}).then(function(brand){
      res.json(brand);
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },

};
