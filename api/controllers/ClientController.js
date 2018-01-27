var _       = require('underscore');
var moment  = require('moment');
var Promise = require('bluebird');
var ADDRESS_TYPE_S = 'S';
var ADDRESS_TYPE_B = 'B';

module.exports = {

  async find(req, res){
    const form = req.allParams();
    const model = 'client';
    const extraParams = {
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

    try{
      const result = await Common.find(model, form, extraParams);
      res.ok(result);
    }
    catch(e){
      res.negotiate(e);
    }
  },

  async findById(req, res) {
    try {
      const id = req.param('id');
      const client = await Client.findOne({ id });
      const Contacts = await ClientContact.find({ CardCode: client.CardCode });
      const query = {
        CardCode: client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE,
      };
      const fiscalAddress = await FiscalAddress.findOne({
        CardCode: client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE,
      });
      const response = { 
        ...client,
        Contacts, 
        FiscalAddress: fiscalAddress 
      };
      res.ok(response);
    } catch (err) {
      res.negotiate(err);
    }
  },

  async create(req, res) {
    var form = req.allParams();
    var sapFiscalAddressParams;
    var sapContactsParams;
    const email = form.E_Mail;
    const actualMail = /@actualgroup.com$/;

    if(!email){
      return res.negotiate(new Error('Email requerido'));
    }

    if(email && email.match(actualMail)){
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }

    if(form.LicTradNum && !ClientService.isValidRFC(form.LicTradNum)){
      return res.negotiate(new Error('RFC no valido'));
    }

    const createParams = ClientService.mapClientFields(form);
    const filteredContacts = ClientService.filterContacts(createParams.contacts)
    sapContactsParams = filteredContacts.map(ClientService.mapContactFields);
    
    if(sapContactsParams.length > 0 && ClientService.areContactsRepeated(sapContactsParams)){
      return res.negotiate(new Error('Nombres de contactos repetidos'));
    }

    if(form.fiscalAddress && ClientService.isValidFiscalAddress(form.fiscalAddress)){
      const fiscalAddressAux  = _.clone(form.fiscalAddress);
      sapFiscalAddressParams  = ClientService.mapFiscalFields(fiscalAddressAux);
    }

    const sapClientParams = _.clone(form);
    var sapCreateParams = {
      client: sapClientParams,
      fiscalAddress: sapFiscalAddressParams || {},
      clientContacts: sapContactsParams,
      activeStore: req.activeStore
    };

    const password = _.clone(sapCreateParams.client.password);
    delete sapCreateParams.client.password;

    try{
      const areValidZipcodes = await ClientService.validateContactsZipcode(sapCreateParams.clientContacts);
      if(!areValidZipcodes){
        return res.negotiate(new Error('El código postal no es valido para tu dirección de entrega'));
      }

      const isUserEmailTaken = await UserService.checkIfUserEmailIsTaken(email);
      if(isUserEmailTaken){
        return res.negotiate(new Error('Email previamente utilizado'));
      }      
      
      const sapResult = await SapService.createClient(sapCreateParams);
      sails.log.info('SAP result createClient', sapResult);
      const sapData = JSON.parse(sapResult.value);
      const isValidSapResponse = ClientService.isValidSapClientCreation(
        sapData, 
        sapContactsParams, 
        sapFiscalAddressParams
      );
    
      if(!sapData || isValidSapResponse.error) {
        const defualtErrMsg = 'Error al crear cliente en SAP';
        const err = isValidSapResponse.error || defualtErrMsg;
        if(err === true){
          err = defualtErrMsg;
        }
        return res.negotiate(new Error(err));      
      }

      const clientCreateParams = Object.assign(sapClientParams,{
        CardCode: sapData.result,
        BirthDate: moment(sapClientParams.BirthDate).toDate()
      });

      const contactCodes = sapData.pers;
      const contactsParams = sapContactsParams.map(function(c, i){
        c.CntctCode = contactCodes[i];
        c.CardCode = clientCreateParams.CardCode
      });

      sails.log.info('contacts app', contactsParams);
      sails.log.info('client app', clientCreateParams);
      
      const createdClient = await Client.create(clientCreateParams);
      const createdUser = await UserService.createUserFromClient(createdClient, password, req);
      const updatedClients = await Client.update({id: createdClient.id},{UserWeb: createdUser.id});
      const updatedClient = updatedClients[0];

      if(contactsParams && contactsParams.length > 0){
        const contactsCreated = await ClientContact.create(contactsParams);
      }

      //Created automatically, do we need the if validation?
      if(sapFiscalAddressParams){
        var fiscalAddressParams = ClientService.mapFiscalFields(fiscalAddress);
        fiscalAddressParams = Object.assign(fiscalAddressParams, {
          CardCode: createdClient.CardCode,
          AdresType: ClientService.ADDRESS_TYPE_S
        });

        var fiscalAddressParams2 = Object.assign(fiscalAddressParams,{
          AdresType: ClientService.ADDRESS_TYPE_B
        });

        const fiscalAddressesCreated = await FiscalAddress.create([
          fiscalAddressParams,
          fiscalAddressParams2
        ]);
      }

      if(fiscalAddressesCreated){
        sails.log.info('fiscal adresses created', fiscalAddressesCreated);
      }

      if(contacts.created && contactsCreated.length > 0){
        sails.log.info('contacts created', contactsCreated);
        const clientWithContacts = Object.assign(createdClient ,{
          Contacts: contactsCreated
        });

        return res.json({
          user: createdUser,
          client: clientWithContacts
        })
      }
      else{
        return res.json({
          user: createdUser,
          client: createdClient
        })
      }
    }
    catch(e){
      return res.negotiate(e);
    }
  },

  async update(req, res){
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
      Client.findOne({CardCode:CardCode, select:['LicTradNum', 'cfdiUse']}),
      FiscalAddress.findOne(query)
    ];      
    
    Promise.all(promises)
      .then(function(results){
        var client = results[0];
        var fiscalAddress = results[1];
        fiscalAddress.LicTradNum = client.LicTradNum;
        fiscalAddress.cfdiUse = client.cfdiUse;

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
          Client.update({CardCode: CardCode}, {LicTradNum: form.LicTradNum, cfdiUse: form.cfdiUse})
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
