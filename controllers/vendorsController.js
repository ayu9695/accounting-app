const Vendor = require('../models/Vendor');

// GET /api/vendors
exports.getAllVendors = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendors = await Vendor.find({ tenantId, isActive: true }).sort({ name: 1 });
    return res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ error: 'Server error fetching vendors' });
  }
};

// GET /api/vendors/:id
exports.getVendorById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorId = req.params.id;
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    return res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor by ID:', error);
    return res.status(500).json({ error: 'Server error fetching vendor' });
  }
};

exports.getVendorContacts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Set by your authMiddleware ✅
    console.log("Fetching tenant id.")
        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }
    console.log("Fetched tenant id");
    const vendors = await Vendor.find(
      { tenantId, isActive: { $ne: false } },
      'name email contactPerson'
    );
    // console.log("Vendor contacts fetched : ", vendors);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// GET /api/vendors/:name
exports.getVendorByName = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorName = req.params.name;
    const vendor = await Vendor.findOne({ name: vendorName, tenantId });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    return res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor by ID:', error);
    return res.status(500).json({ error: 'Server error fetching vendor' });
  }
};


// GET /api/vendors/:id
exports.getVendorByBillNumber = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorBillNumber = req.params.billNumber;
    const vendor = await Vendor.findOne({ billNumber: vendorBillNumber, tenantId });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    return res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor by ID:', error);
    return res.status(500).json({ error: 'Server error fetching vendor' });
  }
};

// POST /api/vendors
exports.createVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const newVendorData = {
      ...req.body,
      tenantId,
      createdBy,
      isActive: true
    };

    // Check for duplicates on unique keys: email, name, billNumber
    const existingVendor = await Vendor.findOne({
      tenantId,
      $or: [
        { email: newVendorData.email },
        { name: newVendorData.name }
      ]
    });

    if (existingVendor && existingVendor.isActive) {
      return res.status(400).json({ error: 'Vendor with this email, name, or bill number already exists in this tenant' });
    } else if (existingVendor && !existingVendor.isActive) {
      // Reactivate vendor
      existingVendor.isActive = true;
      existingVendor.status = 'active';
      existingVendor.updatedAt = new Date();
      existingVendor.updateHistory.push({
        attribute: 'isActive',
        oldValue: false,
        newValue: true,
        updatedAt: new Date(),
        updatedBy: createdBy
      });
      await existingVendor.save();
      return res.status(200).json({ success: 'Vendor reactivated', vendor: existingVendor });
    }

    const newVendor = new Vendor(newVendorData);
    await newVendor.save();

    return res.status(201).json(newVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({ error: 'Server error creating vendor' });
  }
};

// PUT /api/vendors/:id
exports.updateVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorId = req.params.id;
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const updates = req.body;
    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (vendor[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: vendor[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        vendor[key] = updates[key];
      }
    });

    vendor.updateHistory.push(...updateHistory);
    vendor.updatedAt = new Date();

    await vendor.save();

    return res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({ error: 'Server error updating vendor' });
  }
};

exports.addVendorContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;
    const vendorId = req.params.id;
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

    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    const existingEmails = vendor.contactPerson.map(p => p.email?.toLowerCase());
    const existingPhones = vendor.contactPerson.map(p => p.phone);

    for (const contact of enrichedContacts) {
      const emailExists = existingEmails.includes(contact.email?.toLowerCase());
      const phoneExists = contact.phone && existingPhones.includes(contact.phone);

      if (emailExists || phoneExists) {
        return res.status(409).json({
          error: `Contact with email "${contact.email}" or phone "${contact.phone}" already exists.`,
        });
      }
    }
      vendor.contactPerson.push(...enrichedContacts);
      await vendor.save(); // this enforces schema validation

    res.status(200).json({
      message: `${enrichedContacts.length} contact(s) added successfully`,
      vendor: vendor
    });
  } catch (error) {
    console.error('Error adding contact to vendor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/vendors/:id (soft-delete)
exports.deleteVendor = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const vendorId = req.params.id;
    const vendor = await Vendor.findOne({ _id: vendorId, tenantId });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    vendor.isActive = false;
    vendor.status = 'inactive';
    vendor.updatedAt = new Date();
    vendor.updateHistory.push({
      attribute: 'isActive',
      oldValue: true,
      newValue: false,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await vendor.save();

    return res.json({ message: 'Vendor soft-deleted (isActive set to false)' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return res.status(500).json({ error: 'Server error deleting vendor' });
  }
};
