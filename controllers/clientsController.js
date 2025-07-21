const Client = require('../models/Client');

exports.getAllClients = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Set by your authMiddleware ✅

        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }
    console.log("Fetched tenant id");

    // Fetch client for the authenticated tenant
    const clients = await Client.find({ tenantId, isActive: true }).sort({ name: 1 }); // optional: sort by name

    if (!clients) {
      return res.status(404).json({ error: 'client not found for this tenant' });
    }

    return res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Server error fetching clients' });
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
      { tenantId },
      'name email contactPerson'
    );
    console.log("client contacts fetched : ", clients);
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
    const client = await Client.findOne({ tenantId, name: clientName });

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
    if (existingClient.isActive) {
      return res.status(400).json({ error: 'Client with this name already exists in this tenant' });
    } else if(!existingClient.isActive) {
      existingClient.isActive=true;
      await existingClient.save();
      return res.status(200).json({ success: 'Client reactivated', client: existingClient });
    }
  }

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

    const client = await Client.findOne({ _id: clientId, tenantId });
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
    const clientName = req.params.name;

    const client = await Client.findOne({ tenantId, name: clientName });
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