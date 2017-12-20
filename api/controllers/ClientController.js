var _       = require('underscore');
var moment  = require('moment');
var Promise = require('bluebird');
var ADDRESS_TYPE_S = 'S';
var ADDRESS_TYPE_B = 'B';

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
      ],
      filters: {
        'UserWeb': {'!':null}
      }      
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
    var form        = req.params.all();
    var id          = form.id;
    var populate = form.populate;
    Client.findOne({id:id}).then(function(client){
      if(!client){
        return Promise.reject(new Error('Cliente no encontrado'));
      }

      if(populate){
        return ClientService.populateClientRelations(client);
      }else{
        return Promise.resolve(client);
      }
    })
    .then(function(client){
      res.json(client);
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
    var createdUserWeb;

    if (email && email.match(actualMail)) {
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }
    form               = ClientService.mapClientFields(form);
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
      client: _.clone(form),
      fiscalAddress: fiscalAddress,
      clientContacts: contacts,
      activeStore: req.activeStore
    };

    delete params.client.password;

    ClientService.validateContactsZipcode(params.clientContacts)
    .then(function(areValid){

      if(!areValid){
        return Promise.reject(new Error('El código postal no es valido para tu dirección de entrega'));
      }
      
      return UserService.checkIfUserEmailIsTaken(email);
    })
    .then(function(isUserMailTaken){
        if(isUserMailTaken){
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
        sails.log.info('form',form);
        return [
          Client.create(form),
        ];
      })
      .spread(function(_createdClient, _createdUser){
        createdClient = _createdClient;
        form.Client = createdClient.id;
        form.id = createdClient.id;
        return UserService.createUserFromClient(form, req);
      })
      .then(function(_createdUser){
        createdUserWeb = _createdUser;
        return Client.update({id: createdClient.id},{UserWeb: createdUserWeb.id});
      })
      .then(function(_updatedClients){
        var promises = [];

        if(contacts && contacts.length > 0){
          //sails.log.info('contacts', contacts);
          promises.push(ClientContact.create(contacts));
        }

        //Created automatically
        if(fiscalAddress){
          fiscalAddress           = ClientService.mapFiscalFields(fiscalAddress);
          fiscalAddress.CardCode  = createdClient.CardCode;
          fiscalAddress.AdresType = ADDRESS_TYPE_S;
          
          var fiscalAddressTypeS = _.clone(fiscalAddress);
          var fiscalAddressTypeB = _.clone(fiscalAddress);
          fiscalAddressTypeB.AdresType = ADDRESS_TYPE_B;

          var fiscalAddresses = [
            fiscalAddressTypeS,
            fiscalAddressTypeB
          ];

          promises.push(FiscalAddress.create(fiscalAddresses));
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

        if(contactsCreated && contacts.length > 0){
          createdClient.Contacts = contactsCreated;
        }

        res.json({
          user: createdUserWeb,
          client: createdClient
        });

        Email.sendRegister(
          createdUserWeb.firstName,
          createdUserWeb.email,
          req.activeStore,
          function(){
            sails.log.info('Email de registro enviado', createdUserWeb.email);
          }
        );

      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req, res){
    var form = req.params.all();
    var CardCode = _.clone(req.user.CardCode);
    var email = form.E_Mail;
    var userId = req.user ? req.user.id : false;
    var updatedClient;
    form = ClientService.mapClientFields(form);
    delete form.FiscalAddress;
    //Dont remove
    delete form.Balance;

    if(!email){
      return res.negotiate(new Error('Email requerido'));
    }

    if(!userId){
      return res.negotiate(new Error('No autorizado'));
    }

    var promises = [
      UserService.checkIfUserEmailIsTaken(email, userId),
      Client.findOne({E_Mail:email, id: {'!=': form.id}})
    ];

    Promise.all(promises)
      .then(function(results){
        var isUserEmailTaken = results[0];
        var usedEmail = results[1];
        if(usedEmail || isUserEmailTaken){
          return Promise.reject(new Error('Email previamente utilizado'));
        }
        sails.log.info('form', form);
      
        return Client.findOne({UserWeb: userId, CardCode: CardCode});
      })
      .then(function(_client){
        if(!_client){
          return Promise.reject(new Error('No autorizado'));
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
        updateClient = updated[0];
        return UserService.updateUserFromClient(updateClient);
      })
      .then(function(updatedUser){
        res.json({
          client: updateClient,
          user: updatedUser
        });
        //res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getContactsByClient: function(req, res){
    var form = req.params.all();
    var cardCode = req.user.CardCode;

    ClientContact.find({CardCode:cardCode}).sort({createdAt:-1})
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
    var cardCode = req.user.CardCode;
    form.CardCode = cardCode;
    form = ClientService.mapContactFields(form);

    ClientService.validateContactsZipcode([form])
      .then(function(areValid){
        if(!areValid){
          return Promise.reject(new Error('El código postal no es valido para tu dirección de entrega'));
        }
        return SapService.createContact(cardCode, form);
      })
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
    var cardCode = req.user.CardCode;
    form.CardCode = cardCode;
    form = ClientService.mapContactFields(form);

    ClientService.validateContactsZipcode([form])
      .then(function(areValid){
        if(!areValid){
          return Promise.reject(new Error('El código postal no es valido para tu dirección de entrega'));
        }
        return ClientContact.find({CardCode: cardCode, select:['CntctCode']});
      })
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

        return ClientContact.update({CardCode:cardCode,CntctCode: contactCode}, form);
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

  getFiscalAddressByClient: function(req, res){
    var form = req.allParams();
    var CardCode = req.user.CardCode;
    var query = {
      CardCode: CardCode,
      AdresType: ClientService.ADDRESS_TYPE
    };

    var promises = [
      Client.findOne({CardCode:CardCode, select:['LicTradNum']}),
      FiscalAddress.findOne(query)
    ];      
    
    Promise.all(promises)
      .then(function(results){
        var client = results[0];
        var fiscalAddress = results[1];
        fiscalAddress.LicTradNum = client.LicTradNum;

        res.json(fiscalAddress);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  updateFiscalAddress: function(req, res){
    var form = req.params.all();
    var CardCode = req.user.CardCode;
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

};
