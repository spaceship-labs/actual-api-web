module.exports = {
  getAll: function(req, res){
    ProductBrand.find({}).limit(1000)
      .then(function(results){
        return res.ok(results);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }
};
