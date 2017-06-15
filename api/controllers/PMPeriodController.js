module.exports = {
  getActive: function(req, res){
    //Today range
    var currentDate = new Date();
    var query = {
      startDate: {'<=': currentDate},
      endDate: {'>=': currentDate},
    };
    PMPeriod.findOne(query).then(function(active){
      res.json(active);
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  }

};
