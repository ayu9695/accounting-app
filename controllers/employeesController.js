const Employee = require('../models/Employee');

// GET /api/employees - fetch all employees for tenant
exports.getAllEmployees = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employees = await Employee.find({ 
      tenantId,
      isActive: { $ne: false }
    })
      .sort({ name: 1 });
    return res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({ error: 'Server error fetching employees' });
  }
};

// GET /api/employees/:id - fetch single employee
exports.getEmployeeByEmail = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employeeEmail = req.params.email;
    const employee = await Employee.findOne({ 
      email: employeeEmail, 
      tenantId,
      isActive: { $ne: false }
    })
      .populate('department', 'name')
      .populate('designation', 'name');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    return res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return res.status(500).json({ error: 'Server error fetching employee' });
  }
};

// POST /api/employees - create employee
exports.createEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const employeeData = {
      ...req.body,
      tenantId,
      createdBy
    };

    const employee = new Employee(employeeData);
    console.log(employee);
    await employee.save();

    return res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({ error: 'Server error creating employee' });
  }
};

// PUT /api/employees/:id - update employee
exports.updateEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id,  ...updates } = req.body;

    if (!id) {
    return res.status(400).json({ error: "Employee ID (id) is required" });
  }

    const employee = await Employee.findOne({ _id: id, tenantId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    console.log("employee email: ", employee.email, " employee body received : ", req.body);

    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (employee[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: employee[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user?.userId || "system" // fallback if no user info
        });
        employee[key] = updates[key];
      }
    });

    if (updateHistory.length > 0) {
      employee.updateHistory.push(...updateHistory);
    }

    await employee.save();
    res.status(200).json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ error: 'Server error updating employee' });
  }
};

// DELETE /api/employees/:id - delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const employeeId = req.body.id;
    const employee = await Employee.findOne({ _id: employeeId, tenantId });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Soft-delete: set isActive to false
    employee.isActive = false;
    employee.updatedAt = new Date();

    // Log to updateHistory
    employee.updateHistory.push({
      attribute: 'isActive',
      oldValue: true,
      newValue: false,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await employee.save();
    return res.json({ message: 'Employee soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({ error: 'Server error deleting employee' });
  }
};
