const Department = require('../models/Department');

exports.getAllDepartments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const depts = await Department.find({ 
      tenantId,
      isActive: { $ne: false }
    }).sort({ name: 1 });
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

    const existing = await Department.findOne({ tenantId, name, isActive: { $ne: false } });
    if (existing) return res.status(400).json({ error: 'Department already exists' });

    const dept = new Department({ tenantId, name, description, createdBy });
    await dept.save();
    res.status(201).json(dept);
  } catch (e) {
    console.error('Error creating department:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const departmentId = req.params.id;

    const department = await Department.findOne({ _id: departmentId, tenantId });
    if (!department) return res.status(404).json({ error: 'department not found' });
    console.log("department requested to update: ", department.name);

    const updates = req.body;
    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (department[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: department[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        department[key] = updates[key];
      }
    });

    await department.save();
    return res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ error: 'Server error updating department' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const departmentId = req.params.id;
    const department = await Department.findOne({ _id: departmentId, tenantId });
    if (!department) return res.status(404).json({ error: 'Department not found' });

    // Soft-delete: set isActive to false
    department.isActive = false;
    department.updatedAt = new Date();

    // Log to updateHistory
    department.updateHistory.push({
      attribute: 'isActive',
      oldValue: true,
      newValue: false,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await department.save();
    return res.json({ message: 'Department soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ error: 'Server error deleting department' });
  }
};

