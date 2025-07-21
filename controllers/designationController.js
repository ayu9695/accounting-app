const Designation = require('../models/Designation');

exports.getAllDesignations = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const desigs = await Designation.find({ tenantId }).sort({ name: 1 });
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

    const existing = await Designation.findOne({ tenantId, name });
    if (existing) return res.status(400).json({ error: 'Designation already exists' });

    const desig = new Designation({ tenantId, name, description, createdBy });
    await desig.save();
    res.status(201).json(desig);
  } catch (e) {
    console.error('Error creating designation:', e);
    res.status(500).json({ error: 'Server error' });
  }
};
