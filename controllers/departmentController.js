const Department = require('../models/Department');

exports.getAllDepartments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const depts = await Department.find({ tenantId }).sort({ name: 1 });
    return res.json(depts);
  } catch (e) {
    console.error('Error fetching departments:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const existing = await Department.findOne({ tenantId, name });
    if (existing) return res.status(400).json({ error: 'Department already exists' });

    const dept = new Department({ tenantId, name, description, createdBy });
    await dept.save();
    res.status(201).json(dept);
  } catch (e) {
    console.error('Error creating department:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

