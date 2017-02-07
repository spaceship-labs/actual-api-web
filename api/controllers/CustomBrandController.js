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
