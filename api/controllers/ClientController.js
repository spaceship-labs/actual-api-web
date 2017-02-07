var _       = require('underscore');
var moment  = require('moment');
var Promise = require('bluebird');
var ADDRESS_TYPE = 'S';

module.exports = {
  find: function(req, res){
    var form           = req.params.all();
    var model          = 'client';
    var extraParams = {
      searchFields: [
        'id',
        'CardName',
        'CardCode',
        'firstName',
        'lastName',
        'E_Mail',
        'phone'
      ]
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

  findBySeller: function(req, res){
    var form = req.params.all();
    var model = 'client';
    var extraParams = {
      searchFields: ['CardCode','CardName'],
      populateFields: ['Quotations']
    };
    form.filters = {SlpCode: form.seller};
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      },function(err){
        console.log(err);
        res.notFound();
      });
  },

  findById: function(req, res){
    var form        = req.params.all();
    var id          = form.id;
    var clientFound = false;
    Client.findOne({id:id}).then(function(client){
      if(!client){
        return Promise.reject(new Error('Cliente no encontrado'));
      }
      return ClientService.populateClientRelations(client);
    })
    .then(function(populatedClient){
      res.json(populatedClient);
    })
    .catch(function(err){
      console.log(err);
      return res.negotiate(err);
    });

  },

  create: function(req, res) {
    var form           = req.params.all();
    var email          = form.E_Mail;
    var actualMail     =  /@actualgroup.com$/;
    var createdClient  = false;
    var contacts       = [];
    var params         = {};

    var fiscalAddress  = {};

    if (email && email.match(actualMail)) {
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }
    form               = ClientService.mapClientFields(form);
    form.User          = req.user.id;
    contacts           = ClientService.filterContacts(form.contacts);
    contacts           = contacts.map(ClientService.mapContactFields);

    if(contacts.length > 0 && ClientService.areContactsRepeated(contacts)){
      return res.negotiate(new Error('Nombres de contactos repetidos'));
    }

    if(!email){
      return res.negotiate(new Error('Email requerido'));
    }

    if(form.LicTradNum){
      if(!ClientService.isValidRFC(form.LicTradNum)){
        var err = new Error('RFC no valido');
        return res.negotiate(err);
      }
    }
    
    if(form.fiscalAddress && ClientService.isValidFiscalAddress(form.fiscalAddress)){
      fiscalAddress  = _.clone(form.fiscalAddress);
      fiscalAddress  = ClientService.mapFiscalFields(fiscalAddress);
    }
   
    delete form.contacts;
    delete form.fiscalAddress;

    params = {
      client: form,
      fiscalAddress: fiscalAddress,
      clientContacts: contacts
    };

    Client.findOne({E_Mail:email})
      .then(function(usedEmail){
        if(usedEmail){
          return Promise.reject(new Error('Email previamente utilizado'));
        }
        return SapService.createClient(params);
      })
      .then(function(result){
        sails.log.info('result createClient', result);
        var sapData = JSON.parse(result.value);
        var isValidSapResponse = ClientService.isValidSapClientCreation(sapData, contacts, fiscalAddress);

        if( !sapData || isValidSapResponse.error  ) {
          var defualtErrMsg = 'Error al crear cliente en SAP';
          var err = isValidSapResponse.error || defualtErrMsg;
          if(err === true){
            err = defualtErrMsg;
          }
          return Promise.reject(new Error(err));
        }
        
        form.CardCode     = sapData.result;
        form.BirthDate    = moment(form.BirthDate).toDate();
        var contactCodes  = sapData.pers;
        contacts          = contacts.map(function(contact, i){
          contact.CntctCode = contactCodes[i];
          contact.CardCode  = form.CardCode;
          return contact;
        });

        sails.log.info('contacts', contacts);

        return Client.create(form);
      })
      .then(function(created){
        createdClient = created;
        var promises = [];

        if(contacts && contacts.length > 0){
          //sails.log.info('contacts', contacts);
          promises.push(ClientContact.create(contacts));
        }

        //Created automatically
        if(fiscalAddress){
          fiscalAddress           = ClientService.mapFiscalFields(fiscalAddress);
          fiscalAddress.CardCode  = createdClient.CardCode;
          fiscalAddress.AdresType = ADDRESS_TYPE;
          promises.push(FiscalAddress.create(fiscalAddress));
        }

        if(promises.length > 0){
          return promises;
        }
        else{
          //Returning empty promise
          return new Promise(function(resolve, reject){
            resolve();
          });
        
        }

      })
      .spread(function(contactsCreated, fiscalAddressCreated){
        sails.log.info('contactsCreated or fiscalAddressCreated', contactsCreated);
        sails.log.info('fiscalAddressCreated', fiscalAddressCreated);
        
        res.json(createdClient);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    var email = form.E_Mail;
    form = ClientService.mapClientFields(form);
    delete form.FiscalAddress;
    //Dont remove
    delete form.Balance;

    if(!email){
      return res.negotiate(new Error('Email requerido'));
    }

    Client.findOne({E_Mail:email, id: {'!=': form.id}})
      .then(function(usedEmail){
        if(usedEmail){
          return Promise.reject(new Error('Email previamente utilizado'));
        }
        return SapService.updateClient(CardCode, form);
      })
      .then(function(resultSap){
        sails.log.info('update client resultSap', resultSap);

        var sapData = JSON.parse(resultSap.value);
        var isValidSapResponse = ClientService.isValidSapClientUpdate(sapData);

        if( !sapData || isValidSapResponse.error  ) {
          var defualtErrMsg = 'Error al actualizar datos personales en SAP';
          var err = isValidSapResponse.error || defualtErrMsg;
          if(err === true){
            err = defualtErrMsg;
          }
          sails.log.info('err', err);
          return Promise.reject(new Error(err));
        }

        return Client.update({CardCode: CardCode}, form);

      })
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getContactsByClient: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    ClientContact.find({CardCode:CardCode})
      .then(function(contacts){
        res.json(contacts);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createContact: function(req, res){
    var form = req.params.all();
    var cardCode = form.CardCode;
    form = ClientService.mapContactFields(form);    
    SapService.createContact(cardCode, form)
      .then(function(resultSap){
        sails.log.info('response createContact', resultSap);
        var sapData = JSON.parse(resultSap.value);
        var isValidSapResponse = ClientService.isValidSapContactCreation(sapData);

        if( !sapData || isValidSapResponse.error  ) {
          var defualtErrMsg = 'Error al crear contacto en SAP';
          var err = isValidSapResponse.error || defualtErrMsg;
          if(err === true){
            err = defualtErrMsg;
          }
          return Promise.reject(new Error(err));
        } 
        var CntctCode  = sapData[0].result;       
        form.CntctCode = parseInt(CntctCode);
        return ClientContact.create(form);
      })
      .then(function(createdContact){
        res.json(createdContact);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },  

  updateContact: function(req, res){
    var form = req.params.all();
    var contactCode = form.CntctCode;
    var cardCode = form.CardCode;
    form = ClientService.mapContactFields(form);
    ClientContact.find({CardCode: cardCode, select:['CntctCode']})
      .then(function(contacts){
        var contactIndex = ClientService.getContactIndex(contacts, contactCode);
        return SapService.updateContact(cardCode ,contactIndex, form);
      })
      .then(function(resultSap){
        sails.log.info('updateContact response', resultSap);

        var sapData = JSON.parse(resultSap.value);
        var isValidSapResponse = ClientService.isValidSapContactUpdate(sapData);

        if( !sapData || isValidSapResponse.error  ) {
          var defualtErrMsg = 'Error al actualizar contacto en SAP';
          var err = isValidSapResponse.error || defualtErrMsg;
          if(err === true){
            err = defualtErrMsg;
          }
          return Promise.reject(new Error(err));
        } 

        return ClientContact.update({CntctCode: contactCode}, form);
      })
      .then(function(updatedApp){
        sails.log.info('contact updatedApp', updatedApp);
        res.json(updatedApp);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  updateFiscalAddress: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    var id = form.id;
    var fiscalAddress = ClientService.mapFiscalFields(form);
    delete form.AdresType;
    if(!form.LicTradNum || !ClientService.isValidRFC(form.LicTradNum)){
      var err = new Error('RFC no valido');
      return res.negotiate(err);
    }
    SapService.updateFiscalAddress(CardCode, fiscalAddress)
      .then(function(resultSap){
        sails.log.info('updateFiscalAddress response', resultSap);

        var sapData = JSON.parse(resultSap.value);
        var isValidSapResponse = ClientService.isValidSapFiscalClientUpdate(sapData);

        if( !sapData || isValidSapResponse.error  ) {
          var defualtErrMsg = 'Error al actualizar datos fiscales en SAP';
          var err = isValidSapResponse.error || defualtErrMsg;
          if(err === true){
            err = defualtErrMsg;
          }
          sails.log.info('err reject', err);
          return Promise.reject(new Error(err));
        }

        return [
          FiscalAddress.update({CardCode:CardCode}, fiscalAddress),
          Client.update({CardCode: CardCode}, {LicTradNum: form.LicTradNum})
        ];
      })
      .spread(function(fiscalAddressUpdated){
        sails.log.info('updated in sails fiscalAddress', fiscalAddressUpdated);
        return res.json(fiscalAddressUpdated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getEwalletByClient: function(req, res){
    var form = req.allParams();
    var id = form.id;
    Client.findOne({id:id, select:['ewallet']})
      .then(function(client){
        res.json(client.ewallet);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getClientBalance: function(req, res){
    var form = req.allParams();
    var id = form.id;
    Client.findOne({id:id, select:['Balance']})
      .then(function(client){
        var balance = client.Balance;
        res.json(balance);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }  


};

