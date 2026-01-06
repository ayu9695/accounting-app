const Designation = require('../models/Designation');

exports.getAllDesignations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const desigs = await Designation.find({ tenantId, isActive: { $ne: false } }).sort({ name: 1 });
    return res.json(desigs);
  } catch (e) {
    console.error('Error fetching designations:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const existing = await Designation.findOne({ tenantId, name, isActive: { $ne: false } });
    if (existing) return res.status(400).json({ error: 'Designation already exists' });

    const desig = new Designation({ tenantId, name, description, createdBy });
    await desig.save();
    res.status(201).json(desig);
  } catch (e) {
    console.error('Error creating designation:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const designationId = req.params.id;
    const designation = await Designation.findOne({ _id: designationId, tenantId });
    if (!designation) return res.status(404).json({ error: 'Designation not found' });

    // Soft-delete: set isActive to false
    designation.isActive = false;
    designation.updatedAt = new Date();

    // Log to updateHistory
    designation.updateHistory.push({
      attribute: 'isActive',
      oldValue: true,
      newValue: false,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await designation.save();
    return res.json({ message: 'Designation soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    return res.status(500).json({ error: 'Server error deleting designation' });
  }
};
