module.exports = {
  getStates: function(req, res){
    var query = {
      Code: {'!':'DF'}
    };

    State.find(query).then(function(states){
      res.json(states);
    })
    .catch(function(err){
      res.negotiate(err);
    });
  },


  sendContact: function(req, res){
    var params = req.allParams();
    var form = params.form;
    var email = params.email;
    var name = params.name;

    if( !Common.validateEmail(email) ){
      res.negotiate(new Error('Email invalido'));
      return;
    }

    var formArr = [
      {label: 'Nombre', value: form.name},
      {label: 'Email', value: form.email},
      {label: 'Télefono', value: form.phone},
      {label: 'Mensaje', value:form.message}
    ];

    Email.sendContact(
      name,
      email,
      formArr,
      req.activeStore,
      function(){
        res.ok({success:true});
      }
    );
  }

};
