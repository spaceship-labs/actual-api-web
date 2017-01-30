module.exports = {
  getStates: function(req, res){
    State.find({}).then(function(states){
      res.json(states);
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },
};
