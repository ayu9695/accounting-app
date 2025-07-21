const Client = require('../models/Client');

// GET /api/contacts - fetch all contacts for tenant
exports.getAllContacts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Fetch all clients with tenantId, select only contactPerson & client details
    const clients = await Client.find({ tenantId }, 'name contactPerson');

    // Flatten contacts across all clients
    const contacts = clients.flatMap(client => 
      client.contactPerson.map(contact => ({
        clientId: client._id,
        clientName: client.name,
        ...contact.toObject()
      }))
    );

    return res.json(contacts);
  } catch (error) {
    console.error('Error fetching all contacts:', error);
    return res.status(500).json({ error: 'Server error fetching contacts' });
  }
};

// GET /api/contacts/client/:clientName - fetch contacts for one client
exports.getContactsForClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const clientName = req.params.clientName;

    const client = await Client.findOne({ name: clientName, tenantId });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    return res.json(client.contactPerson || []);
  } catch (error) {
    console.error('Error fetching contacts for client:', error);
    return res.status(500).json({ error: 'Server error fetching client contacts' });
  }
};

// POST /api/contacts/client/:clientName - add contact to client
exports.addContactToClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const clientName = req.params.clientName;
    const { name, email, phone, extension } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Contact name and email are required' });
    }

    const client = await Client.findOne({ name: clientName, tenantId });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    
    const newContact = { name, email, phone, extension };

    client.contactPerson.push(newContact);
    client.updatedAt = new Date();
    client.updateHistory.push({
      attribute: 'contactPerson',
      oldValue: null,
      newValue: newContact,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await client.save();


    return res.status(201).json({ success: 'Contact added', client });
  } catch (error) {
    console.error('Error adding contact:', error);
    return res.status(500).json({ error: 'Server error adding contact' });
  }
};

exports.updateClientContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const clientName = req.params.clientName;
    const { currentEmail, name, email, phone, extension } = req.body;

    if (!currentEmail) {
      return res.status(400).json({ error: 'currentEmail is required to identify which contact to update' });
    }

    const client = await Client.findOne({ name: clientName, tenantId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    // const contact = client.contactPerson.find(c => c.email === currentEmail);
    // if (!contact) return res.status(404).json({ error: 'Contact not found in this client' });
    const updateHistory = [];
    const contact = client.contactPerson.find(c => c.name === "Jessica Bell");
    console.log(contact.name);

    if (name && contact.name !== name) {
      updateHistory.push({
        attribute: `contactPerson.name (email: ${currentEmail})`,
        oldValue: contact.name,
        newValue: name,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      contact.name = name;
      console.log("Setting new name", contact.name);
    }

    if (email && contact.email !== email) {
         const emailExists = client.contactPerson.some(c => c.email === email && c !== contact);
        if (emailExists) {
            return res.status(400).json({ error: 'Another contact with this email already exists in this client' });
        }
      updateHistory.push({
        attribute: `contactPerson.email (email: ${currentEmail})`,
        oldValue: contact.email,
        newValue: email,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      contact.email = email;
    }

    if (phone && contact.phone !== phone) {
      updateHistory.push({
        attribute: `contactPerson.phone (email: ${currentEmail})`,
        oldValue: contact.phone,
        newValue: phone,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      contact.phone = phone;
    }

    if (extension && contact.extension !== extension) {
      updateHistory.push({
        attribute: `contactPerson.extension (email: ${currentEmail})`,
        oldValue: contact.extension,
        newValue: extension,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      contact.extension = extension;
    }

    if (updateHistory.length === 0) {
      return res.status(400).json({ error: 'No changes detected in contact' });
    }

    client.updateHistory.push(...updateHistory);
    client.updatedAt = new Date();
    await client.save();

    return res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ error: 'Server error updating client' });
  }
};