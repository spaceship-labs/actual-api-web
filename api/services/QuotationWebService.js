const assignClient = async (name, email, phone, id) => {
  const unregisteredClient = await UnregisteredClient.findOne({ email });
  if (unregisteredClient) {
    return await QuotationWeb.update({ id }, { UnregisteredClient: unregisteredClient.id });
  } else {
    const { id: newUnregisteredClientId } = await UnregisteredClient.create({ name, email, phone });
    return await QuotationWeb.update({ id }, { UnregisteredClient: newUnregisteredClientId });
  }
};

module.exports = { assignClient };
