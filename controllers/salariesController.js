const SalaryRecord = require('../models/Salary');
const { processSalaryForPeriod } = require('../services/salaryService');
const dayjs = require('dayjs');

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

exports.getMonthlySalaries = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const period = req.params.period; // Expecting "MMYYYY" format
    console.log('Requested period:', period);
    if (!period || typeof period !== 'string' || period.length !== 6) {
      return res.status(400).json({ 
        message: 'Invalid format. Please provide "period" in "MMYYYY" format (e.g., "112025").' 
      });
    }

    // 3. Parse MMYYYY
    const monthRaw = period.substring(0, 2); // "11"
    const yearRaw = period.substring(2, 6);  // "2025"

    const monthIndex = parseInt(monthRaw, 10); // Convert "11" -> 10 (0-indexed for JS dates)
    const year = parseInt(yearRaw, 10);

    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: 'Invalid month. Must be between 01 and 12.' });
    }

    // 4. Convert to Schema format (Month Name & Year Number)
    // This converts index 10 to "November"
    const monthName = dayjs().month(monthIndex).format('MMMM'); 

    console.log(`Fetching salaries for ${period} -> ${monthName}, ${year}`);

    const salaries = await SalaryRecord.find({
        tenantId: tenantId,
        month: monthName,  // <--- Added Filter
        year: year         // <--- Added Filter
     })
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

exports.manualSalaryCalculation = async (req, res) => {
  try {
    // 1. Extract input. Expecting body: { period: "112025" }
    const { period } = req.body;

    // 2. Validation
    if (!period || typeof period !== 'string' || period.length !== 6) {
      return res.status(400).json({ 
        message: 'Invalid format. Please provide "period" in "MMYYYY" format (e.g., "112025").' 
      });
    }

    // 3. Parse MMYYYY
    const monthRaw = period.substring(0, 2); // "11"
    const yearRaw = period.substring(2, 6);  // "2025"
    
    const monthIndex = parseInt(monthRaw, 10) - 1; // Convert "11" -> 10 (0-indexed for JS dates)
    const year = parseInt(yearRaw, 10);

    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: 'Invalid month. Must be between 01 and 12.' });
    }

    // 4. Convert to Schema format (Month Name & Year Number)
    // This converts index 10 to "November"
    const monthName = dayjs().month(monthIndex).format('MMMM'); 

    console.log(`[Manual Trigger] Parsing ${period} -> ${monthName}, ${year}`);

    // 5. Call the existing Service
    const result = await processSalaryForPeriod(monthName, year);

    return res.status(200).json({
      message: 'Salary calculation triggered successfully.',
      period: { month: monthName, year: year },
      data: result
    });

  } catch (error) {
    console.error('Manual Salary Trigger Error:', error);
    return res.status(500).json({ 
      message: 'Error processing salary calculation', 
      error: error.message 
    });
  }
};