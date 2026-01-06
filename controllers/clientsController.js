const Client = require('../models/Client');

exports.getAllClients = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Set by your authMiddleware ✅

        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }

    // Fetch client for the authenticated tenant
    const clients = await Client.find({ tenantId, isActive: true })
      .populate('department', 'name')
      .sort({ name: 1 }); // optional: sort by name

    if (!clients) {
      return res.status(404).json({ error: 'client not found for this tenant' });
    }

    console.log("returning clients : ",clients);
    return res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Server error fetching clients' });
  }
};

exports.addClientContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;
    const clientId = req.params.id;
    // Step 1: Normalize incoming structure
    let incoming = req.body;

    // Example incoming = [ { contactPerson: [ {...}, {...} ] } ]
    let contacts = [];

    // Flatten and extract actual contactPerson objects
    for (const entry of Array.isArray(incoming) ? incoming : [incoming]) {
      if (Array.isArray(entry.contactPerson)) {
        contacts.push(...entry.contactPerson);
      }
    }

    // Step 2: Enrich and validate
    const enrichedContacts = contacts
      .filter(c => c && c.name && c.email) // skip incomplete
      .map(c => ({
        ...c,
        createdBy,
        createdAt: new Date(),
      }));

    if (!enrichedContacts.length) {
      return res.status(400).json({ error: 'No valid contacts provided (must have name & email).' });
    }

    const client = await Client.findOne({ _id: clientId, tenantId });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    console.log("Contact body : ", contacts);
    console.log('Final contacts being pushed:', enrichedContacts);
    const existingEmails = client.contactPerson.map(p => p.email?.toLowerCase());
    const existingPhones = client.contactPerson.map(p => p.phone);
    for (const contact of enrichedContacts) {
      const emailExists = existingEmails.includes(contact.email?.toLowerCase());
      const phoneExists = contact.phone && existingPhones.includes(contact.phone);

      if (emailExists || phoneExists) {
        return res.status(409).json({
          error: `Contact with email "${contact.email}" or phone "${contact.phone}" already exists.`,
        });
      }
    }

      client.contactPerson.push(...enrichedContacts);
      await client.save(); // this enforces schema validation

    res.status(200).json({
      message: `${enrichedContacts.length} contact(s) added successfully`,
      client: client
    });
  } catch (error) {
    console.error('Error adding contact to client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getClientContacts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Set by your authMiddleware ✅
    console.log("Fetching tenant id.")
        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }
    console.log("Fetched tenant id");
    const clients = await Client.find(
      { tenantId, isActive: { $ne: false } },
      'name email contactPerson'
    );
    // console.log("client contacts fetched : ", clients);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

exports.getClientByName = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
   if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }

    const clientName = req.params.name;
    const client = await Client.findOne({ tenantId, name: clientName })
      .populate('department', 'name');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.json(client);
  } catch (error) {
    console.error('Error fetching client by name:', error);
    return res.status(500).json({ error: 'Server error fetching client' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }
    const createdBy = req.user.userId;

    const newClientData = {
      ...req.body,
      tenantId,
      createdBy
    };
    console.log("creating client:", req.user);

    const existingClient = await Client.findOne({ tenantId, name: newClientData.name });
    if (existingClient){
      console.log("Existing client.");
    if (existingClient.isActive) {
      console.log("Existing Active client, sending error");
      return res.status(400).json({ error: 'Client with this name already exists in this tenant' });
    } else if(!existingClient.isActive) {
      existingClient.isActive=true;
      await existingClient.save();
      return res.status(200).json({ success: 'Client reactivated', client: existingClient });
    }
  }

  if (Array.isArray(newClientData.contactPerson)) {
    console.log("in array");
  const validContacts = newClientData.contactPerson.filter(
    (person) => person?.email && person.email.trim() !== ''
  );

  if (validContacts.length > 0) {
    console.log("setting contacts");
    newClientData.contactPerson = validContacts;
  } else {
    console.log("deleting array");
    delete newClientData.contactPerson;  // ✅ prevents Mongo from inserting null
  }
}

console.log('Final sanitized client data:', newClientData);

    const newClient = new Client(newClientData);
    await newClient.save();

    return res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({ error: 'Server error creating client' });
  }
};

exports.updateClientContact = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, extension } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  try {
    const updated = await Client.findByIdAndUpdate(
      id,
      {
        $push: {
          contactPerson: {
            name,
            email,
            phone,
            extension,
            status: true
          }
        }
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Contact added successfully', client: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists in contactPerson' });
    }
    res.status(500).json({ error: 'Failed to add contact' });
  }
};

// PUT /api/clients/:id
exports.updateClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }
    const clientId = req.params.id;

    const client = await Client.findOne({ _id: clientId, tenantId })
      .populate('department', 'name');
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updates = req.body;
    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (client[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: client[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        client[key] = updates[key];
      }
    });

    client.updateHistory.push(...updateHistory);
    client.updatedAt = new Date();

    await client.save();
    await client.populate('department', 'name');

    return res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ error: 'Server error updating client' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
        }
    const clientId = req.params.id;

    const client = await Client.findOne({ tenantId, _id: clientId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Soft-delete: set isActive to false
    client.isActive = false;

    client.updateHistory.push({
      attribute: 'isActive',
      oldValue: true,
      newValue: false,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    client.updatedAt = new Date();

    await client.save();

    return res.json({ message: 'Client soft-deleted (isActive set to false)' });
  } catch (error) {
    console.error('Error soft-deleting client:', error);
    return res.status(500).json({ error: 'Server error soft-deleting client' });
  }
};

// POST /api/clients/:id/activate
// Reactivate a previously soft-deleted client (isActive -> true)
exports.activateClient = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }

    const clientId = req.params.id;

    const client = await Client.findOne({ _id: clientId, tenantId })
      .populate('department', 'name');
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (client.isActive) {
      return res.status(200).json({ message: 'Client is already active', client });
    }

    const previousValue = client.isActive === undefined ? null : client.isActive;
    client.isActive = true;

    client.updateHistory.push({
      attribute: 'isActive',
      oldValue: previousValue,
      newValue: true,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    client.updatedAt = new Date();

    await client.save();
    await client.populate('department', 'name');

    return res.json({ message: 'Client activated (isActive set to true)', client });
  } catch (error) {
    console.error('Error activating client:', error);
    return res.status(500).json({ error: 'Server error activating client' });
  }
};