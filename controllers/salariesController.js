const SalaryRecord = require('../models/Salary');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');
const { processSalaryForPeriod, calculatePaymentDate, saveAllowancesDeductionsToEmployee, calculateDefaultWorkingDays } = require('../services/salaryService');
const dayjs = require('dayjs');

/**
 * Helper to parse period string (MMYYYY) to month name and year
 */
const parsePeriod = (period) => {
  if (!period || typeof period !== 'string' || period.length !== 6) {
    return { error: 'Invalid format. Please provide "period" in "MMYYYY" format (e.g., "112025").' };
  }

  const monthRaw = period.substring(0, 2);
  const yearRaw = period.substring(2, 6);
  
  const monthIndex = parseInt(monthRaw, 10) - 1; // Convert to 0-indexed
  const year = parseInt(yearRaw, 10);

  if (monthIndex < 0 || monthIndex > 11) {
    return { error: 'Invalid month. Must be between 01 and 12.' };
  }

  const monthName = dayjs().month(monthIndex).format('MMMM');
  
  return { monthName, year, monthIndex };
};

/**
 * Helper to calculate total from allowances/deductions array
 * @param {Array} items - Array of { amount, type } objects
 * @param {Number} baseSalary - Base salary for percentage calculations
 * @returns {Number} Total amount
 */
const calculateTotalFromArray = (items, baseSalary) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 0;
  }

  return items.reduce((total, item) => {
    let amount = 0;
    if (item.type === 'percentage') {
      amount = (baseSalary * (item.amount || 0)) / 100;
    } else {
      amount = item.amount || 0;
    }
    return total + amount;
  }, 0);
};

exports.getAllSalaries = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const salaries = await SalaryRecord.find({ tenantId })
      .populate('employeeId', 'name email salaryPaymentDate department position')
      .populate('paymentMethod', 'name code')
      .sort({ year: -1, month: -1 });
    
    // Calculate sum of all salaries (netSalary)
    const sum = salaries.reduce((total, salary) => {
      return total + (salary.netSalary || 0);
    }, 0);
    
    // Calculate sum of paid salaries (netSalary where status === 'paid')
    const paidSum = salaries.reduce((total, salary) => {
      if (salary.status === 'paid') {
        return total + (salary.netSalary || 0);
      }
      return total;
    }, 0);
    
    return res.json({
      salaries,
      sum,
      paidSum
    });
  } catch (e) {
    console.error('Error fetching salaries:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/salaries/unpaid - Get all unpaid salaries
exports.getUnpaidSalaries = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const salaries = await SalaryRecord.find({ 
      tenantId,
      status: { $ne: 'paid' }
    })
      .populate('employeeId', 'name email salaryPaymentDate department position')
      .populate('paymentMethod', 'name code')
      .sort({ year: -1, month: -1 });
    
    return res.json({
      salaries,
      count: salaries.length
    });
  } catch (e) {
    console.error('Error fetching unpaid salaries:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMonthlySalaries = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const period = req.params.period;
    
    const parsed = parsePeriod(period);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    // For getMonthlySalaries, we need 1-indexed month name
    const monthName = dayjs().month(parseInt(period.substring(0, 2), 10) - 1).format('MMMM');
    const year = parseInt(period.substring(2, 6), 10);

    console.log(`Fetching salaries for ${period} -> ${monthName}, ${year}`);

    const salaries = await SalaryRecord.find({
      tenantId: tenantId,
      month: monthName,
      year: year
    })
      .populate('employeeId', 'name email salaryPaymentDate department position')
      .populate('paymentMethod', 'name code')
      .sort({ year: -1, month: -1 });
    
    // Calculate sum of all salaries (netSalary)
    const sum = salaries.reduce((total, salary) => {
      return total + (salary.netSalary || 0);
    }, 0);
    
    // Calculate sum of paid salaries (netSalary where status === 'paid')
    const paidSum = salaries.reduce((total, salary) => {
      if (salary.status === 'paid') {
        return total + (salary.netSalary || 0);
      }
      return total;
    }, 0);
    
    return res.json({
      salaries,
      sum,
      paidSum
    });
  } catch (e) {
    console.error('Error fetching salaries:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createSalary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { employeeId, month, year, allowances, reimbursements, deductions, baseSalary } = req.body;

    // Get employee to copy salaryPaymentDate and baseSalary
    let salaryPaymentDate = 1;
    let employeeBaseSalary = baseSalary;
    
    if (employeeId) {
      const employee = await Employee.findOne({ _id: employeeId, tenantId });
      if (employee) {
        salaryPaymentDate = employee.salaryPaymentDate || 1;
        employeeBaseSalary = employee.baseSalary;
      }
    }

    // Calculate allowances, reimbursements, and deductions if provided
    const totalAllowances = calculateTotalFromArray(allowances, employeeBaseSalary);
    const totalReimbursements = calculateTotalFromArray(reimbursements, employeeBaseSalary);
    const totalDeductions = calculateTotalFromArray(deductions, employeeBaseSalary);

    // Calculate gross and net salary
    // Gross salary = baseSalary + allowances (stays the same)
    const grossSalary = employeeBaseSalary + totalAllowances;
    // Net salary = grossSalary + reimbursements - deductions (payable amount)
    const netSalary = grossSalary + totalReimbursements - totalDeductions;

    // Calculate paymentDate (scheduled payment date for this salary)
    const paymentDate = calculatePaymentDate(salaryPaymentDate, month, year);

    // Calculate defaultWorkingDays for this month
    const defaultWorkingDays = await calculateDefaultWorkingDays(tenantId, month, year);

    const salaryData = {
      ...req.body,
      tenantId,
      baseSalary: employeeBaseSalary,
      allowances: totalAllowances,
      reimbursements: totalReimbursements,
      deductions: totalDeductions,
      grossSalary: grossSalary,
      netSalary: netSalary,
      salaryPaymentDate,
      paymentDate,
      defaultWorkingDays,
      processedBy: req.user.userId
    };

    const salary = new SalaryRecord(salaryData);
    await salary.save();

    // Save allowances/deductions to Employee model for history/analysis (if provided)
    if ((allowances && allowances.length > 0) || (deductions && deductions.length > 0)) {
      await saveAllowancesDeductionsToEmployee(employeeId, allowances, deductions, month, year);
    }

    res.status(201).json(salary);
  } catch (e) {
    console.error('Error creating salary:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/salaries/:id - Update salary record
exports.updateSalary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const salaryId = req.params.id;
    const { allowances, reimbursements, deductions, baseSalary, ...otherUpdates } = req.body;

    const salary = await SalaryRecord.findOne({ _id: salaryId, tenantId })
      .populate('paymentMethod', 'name code');
    if (!salary) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    const updateHistory = [];
    const salaryBaseSalary = baseSalary || salary.baseSalary;

    // Calculate allowances, reimbursements, and deductions if provided
    let totalAllowances = salary.allowances || 0;
    let totalReimbursements = salary.reimbursements || 0;
    let totalDeductions = salary.deductions || 0;

    if (allowances !== undefined) {
      totalAllowances = calculateTotalFromArray(allowances, salaryBaseSalary);
      updateHistory.push({
        attribute: 'allowances',
        oldValue: salary.allowances,
        newValue: totalAllowances,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      salary.allowances = totalAllowances;
    }

    if (reimbursements !== undefined) {
      totalReimbursements = calculateTotalFromArray(reimbursements, salaryBaseSalary);
      updateHistory.push({
        attribute: 'reimbursements',
        oldValue: salary.reimbursements,
        newValue: totalReimbursements,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      salary.reimbursements = totalReimbursements;
    }

    if (deductions !== undefined) {
      totalDeductions = calculateTotalFromArray(deductions, salaryBaseSalary);
      updateHistory.push({
        attribute: 'deductions',
        oldValue: salary.deductions,
        newValue: totalDeductions,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      salary.deductions = totalDeductions;
    }

    // Recalculate defaultWorkingDays if month/year changed
    if (otherUpdates.month || otherUpdates.year) {
      const month = otherUpdates.month || salary.month;
      const year = otherUpdates.year || salary.year;
      salary.defaultWorkingDays = await calculateDefaultWorkingDays(tenantId, month, year);
    }

    // Recalculate gross and net salary if allowances/reimbursements/deductions/baseSalary changed
    if (allowances !== undefined || reimbursements !== undefined || deductions !== undefined || baseSalary !== undefined) {
      const oldGrossSalary = salary.grossSalary;
      const oldNetSalary = salary.netSalary;
      
      const newBaseSalary = baseSalary || salary.baseSalary;
      salary.baseSalary = newBaseSalary;
      // Gross salary = baseSalary + allowances (stays the same)
      const newGrossSalary = newBaseSalary + totalAllowances;
      // Net salary = grossSalary + reimbursements - deductions (payable amount)
      const newNetSalary = newGrossSalary + totalReimbursements - totalDeductions;

      salary.grossSalary = newGrossSalary;
      salary.netSalary = newNetSalary;

      updateHistory.push({
        attribute: 'grossSalary',
        oldValue: oldGrossSalary,
        newValue: newGrossSalary,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });

      updateHistory.push({
        attribute: 'netSalary',
        oldValue: oldNetSalary,
        newValue: newNetSalary,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
    }

    // Handle other updates
    Object.keys(otherUpdates).forEach((key) => {
      if (salary[key] !== otherUpdates[key] && key !== 'updateHistory' && key !== 'employeeId') {
        updateHistory.push({
          attribute: key,
          oldValue: salary[key],
          newValue: otherUpdates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        salary[key] = otherUpdates[key];
      }
    });

    if (updateHistory.length > 0) {
      salary.updateHistory.push(...updateHistory);
    }

    salary.updatedAt = new Date();
    await salary.save();

    // Save allowances/deductions to Employee model for history/analysis (if provided)
    if ((allowances && allowances.length > 0) || (deductions && deductions.length > 0)) {
      await saveAllowancesDeductionsToEmployee(salary.employeeId, allowances, deductions, salary.month, salary.year);
    }

    res.json(salary);
  } catch (e) {
    console.error('Error updating salary:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/salaries/:id/mark-paid - Mark salary as paid
exports.markSalaryAsPaid = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const salaryId = req.params.id;
    const { paidOn, paymentMethod, paymentReference, actualWorkingDays, deductions, allowances, netSalary } = req.body;

    const salary = await SalaryRecord.findOne({ _id: salaryId, tenantId })
      .populate('paymentMethod', 'name code');
    if (!salary) {
      return res.status(404).json({ error: 'Salary record not found' });
    }

    if (salary.status === 'paid') {
      return res.status(400).json({ error: 'Salary is already marked as paid' });
    }

    const updateHistory = [];
    
    // Track status change
    updateHistory.push({
      attribute: 'status',
      oldValue: salary.status,
      newValue: 'paid',
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    // Set paidOn date
    // Priority: 1) FE input, 2) Calculated from salaryPaymentDate (same month as salary)
    let paidOnDate;
    if (paidOn) {
      paidOnDate = new Date(paidOn);
    } else {
      // Default to salaryPaymentDate of the same month (e.g., December salary paid on December 1st)
      paidOnDate = calculatePaymentDate(salary.salaryPaymentDate || 1, salary.month, salary.year);
    }

    updateHistory.push({
      attribute: 'paidOn',
      oldValue: salary.paidOn,
      newValue: paidOnDate,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    // Update salary record
    salary.status = 'paid';
    salary.paidOn = paidOnDate;
    salary.paidAt = new Date();
    salary.paidBy = req.user.userId;
    
    // Also update paymentDate for dashboard filtering
    salary.paymentDate = paidOnDate;
    
    if (paymentMethod) {
      salary.paymentMethod = paymentMethod;
    }
    if (paymentReference) {
      salary.paymentReference = paymentReference;
    }

    // Set actualWorkingDays: use FE input if provided, otherwise default to defaultWorkingDays
    if (actualWorkingDays !== undefined && actualWorkingDays !== null) {
      salary.actualWorkingDays = actualWorkingDays;
      updateHistory.push({
        attribute: 'actualWorkingDays',
        oldValue: salary.actualWorkingDays,
        newValue: actualWorkingDays,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
    } else {
      // Default to defaultWorkingDays if not provided
      salary.actualWorkingDays = salary.defaultWorkingDays;
    }

    // Update deductions if provided
    if (deductions !== undefined && deductions !== null) {
      updateHistory.push({
        attribute: 'deductions',
        oldValue: salary.deductions,
        newValue: deductions,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      salary.deductions = deductions;
    }

    // Update allowances if provided
    if (allowances !== undefined && allowances !== null) {
      updateHistory.push({
        attribute: 'allowances',
        oldValue: salary.allowances,
        newValue: allowances,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      salary.allowances = allowances;
    }

    // Update netSalary if provided
    if (netSalary !== undefined && netSalary !== null) {
      updateHistory.push({
        attribute: 'netSalary',
        oldValue: salary.netSalary,
        newValue: netSalary,
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });
      salary.netSalary = netSalary;
    }

    salary.updateHistory.push(...updateHistory);
    salary.updatedAt = new Date();

    await salary.save();

    res.json({
      message: 'Salary marked as paid successfully',
      salary
    });
  } catch (e) {
    console.error('Error marking salary as paid:', e);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/salaries/bulk/mark-paid - Mark multiple salaries as paid
// Format: { salaries: [{ salaryId, paymentReference, paidOn?, paymentMethod?, actualWorkingDays?, deductions?, allowances?, netSalary? }], paymentMethod? }
// Body-level paymentMethod is default, salary-level attributes override it
// paymentReference is required for each salary
// paidOn defaults to calculated payment date (salaryPaymentDate of the salary month) if not provided
exports.bulkMarkAsPaid = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { 
      salaries,   // Array of { salaryId, paymentReference, paidOn?, paymentMethod?, actualWorkingDays?, deductions?, allowances?, netSalary? }
      paymentMethod  // Body-level default for paymentMethod
    } = req.body;

    console.log('[Bulk Mark Paid] Request received:', {
      tenantId,
      salariesCount: salaries?.length,
      paymentMethod
    });

    // Validate salaries array
    if (!salaries || !Array.isArray(salaries) || salaries.length === 0) {
      return res.status(400).json({ 
        error: 'salaries array is required and must not be empty' 
      });
    }

    // Validate each salary has required fields
    for (let i = 0; i < salaries.length; i++) {
      const salary = salaries[i];
      if (!salary.salaryId) {
        return res.status(400).json({ 
          error: `Salary at index ${i} must have a salaryId` 
        });
      }
      if (!mongoose.Types.ObjectId.isValid(salary.salaryId)) {
        return res.status(400).json({ 
          error: `Invalid salaryId format at index ${i}: ${salary.salaryId}` 
        });
      }
      if (!salary.paymentReference) {
        return res.status(400).json({ 
          error: `Salary at index ${i} must have a paymentReference` 
        });
      }
    }

    const salaryList = salaries.map(s => ({
      salaryId: s.salaryId,
      paymentReference: s.paymentReference, // Required
      paidOn: s.paidOn, // Optional, defaults to calculated payment date
      paymentMethod: s.paymentMethod, // Optional, can use body-level default
      actualWorkingDays: s.actualWorkingDays, // Optional, defaults to defaultWorkingDays
      deductions: s.deductions, // Optional
      allowances: s.allowances, // Optional
      netSalary: s.netSalary // Optional
    }));

    const results = {
      success: [],
      failed: []
    };

    for (const salaryItem of salaryList) {
      const { 
        salaryId, 
        paymentReference, 
        paidOn: salaryPaidOn, 
        paymentMethod: salaryPaymentMethod, 
        actualWorkingDays: salaryActualWorkingDays,
        deductions: salaryDeductions,
        allowances: salaryAllowances,
        netSalary: salaryNetSalary
      } = salaryItem;
      
      try {
        // Convert salaryId string to ObjectId
        let salaryObjectId;
        try {
          salaryObjectId = new mongoose.Types.ObjectId(salaryId);
        } catch (err) {
          results.failed.push({ id: salaryId, error: `Invalid salaryId format: ${err.message}` });
          continue;
        }

        // Find salary - mongoose will handle tenantId conversion automatically
        const salary = await SalaryRecord.findOne({ 
          _id: salaryObjectId, 
          tenantId: tenantId 
        }).populate('paymentMethod', 'name code');
        
        if (!salary) {
          results.failed.push({ id: salaryId, error: 'Salary not found or does not belong to your tenant' });
          continue;
        }

        if (salary.status === 'paid') {
          results.failed.push({ id: salaryId, error: 'Already paid' });
          continue;
        }

        // Capture old values for history
        const oldStatus = salary.status;
        const oldPaidOn = salary.paidOn;
        const oldPaymentMethod = salary.paymentMethod;
        const oldPaymentReference = salary.paymentReference;
        const oldActualWorkingDays = salary.actualWorkingDays;
        const oldDeductions = salary.deductions;
        const oldAllowances = salary.allowances;
        const oldNetSalary = salary.netSalary;

        // Determine values: salary-level > body-level default (for paymentMethod only)
        const finalPaymentMethod = salaryPaymentMethod || paymentMethod;
        // paymentReference is always from salary-level (required)

        // Calculate paidOn date: use provided paidOn or default to calculated payment date
        let paidOnDate;
        if (salaryPaidOn) {
          // Use explicitly provided paidOn date
          paidOnDate = new Date(salaryPaidOn);
          if (isNaN(paidOnDate.getTime())) {
            results.failed.push({ id: salaryId, error: `Invalid paidOn date format: ${salaryPaidOn}` });
            continue;
          }
        } else {
          // Default to calculated payment date (salaryPaymentDate of the salary month)
          // e.g., December salary with salaryPaymentDate=1 → December 1st
          if (!salary.month || !salary.year) {
            results.failed.push({ id: salaryId, error: 'Salary record missing month or year' });
            continue;
          }
          try {
            paidOnDate = calculatePaymentDate(salary.salaryPaymentDate || 1, salary.month, salary.year);
          } catch (err) {
            results.failed.push({ id: salaryId, error: `Error calculating payment date: ${err.message}` });
            continue;
          }
        }

        // Update salary record
        salary.status = 'paid';
        salary.paidOn = paidOnDate;
        salary.paymentDate = paidOnDate;
        salary.paymentReference = paymentReference; // Always set (required)
        salary.paidAt = new Date();
        salary.paidBy = req.user.userId;
        
        if (finalPaymentMethod) {
          salary.paymentMethod = finalPaymentMethod;
        }

        // Track update history
        const updateHistory = [{
          attribute: 'status',
          oldValue: oldStatus,
          newValue: 'paid',
          updatedAt: new Date(),
          updatedBy: req.user.userId
        }];

        // Only track paidOn in history if it was explicitly provided by user
        if (salaryPaidOn) {
          updateHistory.push({
            attribute: 'paidOn',
            oldValue: oldPaidOn,
            newValue: paidOnDate,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
        }

        if (finalPaymentMethod) {
          updateHistory.push({
            attribute: 'paymentMethod',
            oldValue: oldPaymentMethod,
            newValue: finalPaymentMethod,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
        }

        // Set actualWorkingDays: use FE input if provided, otherwise default to defaultWorkingDays
        if (salaryActualWorkingDays !== undefined && salaryActualWorkingDays !== null) {
          salary.actualWorkingDays = salaryActualWorkingDays;
          updateHistory.push({
            attribute: 'actualWorkingDays',
            oldValue: oldActualWorkingDays,
            newValue: salaryActualWorkingDays,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
        } else {
          // Default to defaultWorkingDays if not provided
          salary.actualWorkingDays = salary.defaultWorkingDays;
        }

        // Update deductions if provided
        if (salaryDeductions !== undefined && salaryDeductions !== null) {
          salary.deductions = salaryDeductions;
          updateHistory.push({
            attribute: 'deductions',
            oldValue: oldDeductions,
            newValue: salaryDeductions,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
        }

        // Update allowances if provided
        if (salaryAllowances !== undefined && salaryAllowances !== null) {
          salary.allowances = salaryAllowances;
          updateHistory.push({
            attribute: 'allowances',
            oldValue: oldAllowances,
            newValue: salaryAllowances,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
        }

        // Update netSalary if provided
        if (salaryNetSalary !== undefined && salaryNetSalary !== null) {
          salary.netSalary = salaryNetSalary;
          updateHistory.push({
            attribute: 'netSalary',
            oldValue: oldNetSalary,
            newValue: salaryNetSalary,
            updatedAt: new Date(),
            updatedBy: req.user.userId
          });
        }

        // Always track paymentReference (required field)
        updateHistory.push({
          attribute: 'paymentReference',
          oldValue: oldPaymentReference,
          newValue: paymentReference,
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });

        salary.updateHistory.push(...updateHistory);
        
        console.log(`[Bulk Mark Paid] Saving salary ${salaryId}:`, {
          status: salary.status,
          paidOn: paidOnDate.toISOString(),
          paymentMethod: finalPaymentMethod,
          paymentReference: paymentReference
        });
        
        await salary.save();
        
        console.log(`[Bulk Mark Paid] Successfully marked salary ${salaryId} as paid`);
        
        results.success.push({
          id: salaryId,
          paidOn: paidOnDate.toISOString(),
          paymentMethod: finalPaymentMethod || null,
          paymentReference: paymentReference
        });
      } catch (err) {
        console.error(`[Bulk Mark Paid] Error processing salary ${salaryId}:`, err);
        console.error(`[Bulk Mark Paid] Error details:`, {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        results.failed.push({ 
          id: salaryId, 
          error: err.message || 'Unknown error',
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    }

    console.log('[Bulk Mark Paid] Results:', {
      success: results.success.length,
      failed: results.failed.length
    });

    res.json({
      message: `${results.success.length} salaries marked as paid`,
      results
    });
  } catch (e) {
    console.error('[Bulk Mark Paid] Fatal error:', e);
    console.error('[Bulk Mark Paid] Error stack:', e.stack);
    res.status(500).json({ 
      error: 'Server error',
      message: e.message,
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};

exports.manualSalaryCalculation = async (req, res) => {
  try {
    const { period } = req.body;

    const parsed = parsePeriod(period);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const { monthName, year } = parsed;

    console.log(`[Manual Trigger] Parsing ${period} -> ${monthName}, ${year}`);

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