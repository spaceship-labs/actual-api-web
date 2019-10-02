const assignClient = async (name, email, phone, id) => {
  // Validar is ya existe un cliente registrado
  const client = await Client.findOne({ E_Mail: email });
  const unregisteredClient = await UnregisteredClient.findOne({ email });
  if (client || unregisteredClient) {
    return await QuotationWeb.update(
      { id },
      client ? { Client: client.id } : { UnregisteredClient: unregisteredClient.id }
    );
  } else {
    const { id: newUnregisteredClientId } = await UnregisteredClient.create({ name, email, phone });
    return await QuotationWeb.update({ id }, { UnregisteredClient: newUnregisteredClientId });
  }
};

module.exports = { assignClient };
