const Tenant = require('../models/Tenant');
const getNextSequence = require('../utils/getNextSequence');

// 1. CREATE: Add a new Tenant
exports.createTenant = async (req, res) => {
  try {
    const { name, id, email, subdomain } = req.body;

    // Basic Validation
    if (!name || !email || !subdomain) {
      return res.status(400).json({ message: 'Name, Email, and Subdomain are required.' });
    }

    // Auto-generate ID if not provided
    let tenantId = id;
    if (!tenantId) {
      tenantId = await getNextSequence('Tenant');
    }

    // Check for duplicates (Email, ID, or Subdomain)
    const existingTenant = await Tenant.findOne({
      $or: [{ email }, { id: tenantId }, { subdomain }]
    });

    if (existingTenant) {
      return res.status(409).json({ message: 'Tenant with this Email, ID, or Subdomain already exists.' });
    }

    const newTenant = new Tenant({
      name,
      id: tenantId,
      email,
      subdomain
    });

    const savedTenant = await newTenant.save();
    return res.status(201).json(savedTenant);

  } catch (error) {
    console.error('Create Tenant Error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// 2. READ: Get Tenant by Custom ID (Number)
exports.getTenantById = async (req, res) => {
  try {
    const { id } = req.params; // This is the numeric custom ID, e.g., 1001

    const tenant = await Tenant.findOne({ id: id });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    return res.json(tenant);
  } catch (error) {
    console.error('Get Tenant Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// 3. UPDATE: Update Tenant details & Log History
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?._id; // Assuming you have middleware setting req.user

    // Find existing tenant first to compare values
    const tenant = await Tenant.findOne({ id: id });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Fields to exclude from history tracking
    const excludedFields = ['_id', 'createdAt', 'updatedAt', 'updateHistory', '__v'];

    // Track Changes
    Object.keys(updates).forEach((key) => {
      // Check if field exists in schema, isn't excluded, and value has actually changed
      if (tenant[key] !== undefined && !excludedFields.includes(key) && tenant[key] !== updates[key]) {
        
        // Push to updateHistory
        tenant.updateHistory.push({
          attribute: key,
          oldValue: tenant[key],
          newValue: updates[key],
          updatedBy: userId // can be null if not logged in
        });

        // Update the actual field
        tenant[key] = updates[key];
      }
    });

    tenant.updatedAt = new Date();
    const updatedTenant = await tenant.save();

    return res.json(updatedTenant);

  } catch (error) {
    console.error('Update Tenant Error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// 4. DELETE: Soft Delete (Set isActive: false)
// Hard deleting tenants is usually dangerous for data integrity
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const tenant = await Tenant.findOne({ id: id });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Log the status change in history
    tenant.updateHistory.push({
      attribute: 'isActive',
      oldValue: tenant.isActive,
      newValue: false,
      updatedBy: userId
    });

    tenant.isActive = false;
    tenant.updatedAt = new Date();
    
    await tenant.save();

    return res.json({ message: `Tenant ${id} has been deactivated successfully.` });

  } catch (error) {
    console.error('Delete Tenant Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};