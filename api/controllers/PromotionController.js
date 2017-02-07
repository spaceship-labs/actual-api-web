module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'promotion';
    var extraParams = {
      searchFields: ['name','code'],
      selectFields: form.fields
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
  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Promotion.findOne({id:id})
      .populate('FilterValues')
      .populate('CustomBrands')
      .populate('Groups')
      .populate('Stores')
      .populate('Categories')
      .populate('Products')
      .then(function(promo){
        res.json(promo);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },
};
