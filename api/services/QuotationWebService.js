const assignClient = async (name, email, phone, id) => {
  const unregisteredClient = await UnregisteredClient.findOne({ email });
  if (unregisteredClient) {
    return await QuotationWeb.update({ id })
      .set({ UnregisteredClient: unregisteredClient.id })
      .fetch();
  } else {
    const { id: newUnregisteredClientId } = await UnregisteredClient.create({
      name,
      email,
      phone
    }).fetch();
    return await QuotationWeb.update({ id })
      .set({ UnregisteredClient: newUnregisteredClientId })
      .fetch();
  }
};

module.exports = { assignClient };
