const SalaryRecord = require('../models/Salary');

exports.getAllSalaries = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const salaries = await SalaryRecord.find({ tenantId })
      .populate('employeeId', 'name email')
      .sort({ year: -1, month: -1 });
    return res.json(salaries);
  } catch (e) {
    console.error('Error fetching salaries:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createSalary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const salaryData = {
      ...req.body,
      tenantId,
      processedBy: req.user.userId
    };

    const salary = new SalaryRecord(salaryData);
    await salary.save();
    res.status(201).json(salary);
  } catch (e) {
    console.error('Error creating salary:', e);
    res.status(500).json({ error: 'Server error' });
  }
};
