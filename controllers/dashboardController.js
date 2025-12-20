const Invoice = require('../models/Invoice');
const VendorBill = require('../models/VendorBill');
const SalaryRecord = require('../models/Salary');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

/**
 * Helper function to get month names between two dates
 * Only returns months that are FULLY contained within the date range
 * Returns an array of { month: "January", year: 2024 } objects
 */
const getMonthsInRange = (startDate, endDate) => {
  const months = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Start from the first day of start month
  let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  
  while (current <= end) {
    const monthStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    
    // Only include month if the ENTIRE month falls within the date range
    if (start <= monthStart && end >= monthEnd) {
      months.push({
        month: monthNames[current.getUTCMonth()],
        year: current.getUTCFullYear()
      });
    }
    
    current.setUTCMonth(current.getUTCMonth() + 1);
  }
  
  return months;
};

/**
 * Helper to parse date string as UTC start of day
 */
const parseStartDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Helper to parse date string as UTC end of day
 */
const parseEndDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
};

/**
 * GET /api/dashboard/summary
 * Query params: startDate, endDate (both required, inclusive)
 * 
 * Returns:
 * - totalRevenue: sum of 'total' from invoices (filtered by issueDate)
 * - totalExpenses: sum of vendorBills.payableAmount + salaries.netSalary + expenses.amount
 * - taxLiability: invoices.taxAmount - vendorBills.tdsAmount
 * - breakdown of each expense category
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const { startDate, endDate } = req.query;

    console.log('=== DASHBOARD SUMMARY DEBUG ===');
    console.log('Raw query params:', { startDate, endDate });
    console.log('TenantId (string):', tenantId);
    console.log('TenantId (ObjectId):', tenantObjectId);

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    // Parse dates as UTC to avoid timezone issues
    const start = parseStartDate(startDate);
    const end = parseEndDate(endDate);

    console.log('Parsed dates (UTC):');
    console.log('  Start:', start.toISOString());
    console.log('  End:', end.toISOString());

    // I. Total Revenue - sum of 'total' in invoices filtered by issueDate
    // Separate INR invoices from foreign currency (EUR, USD) invoices
    console.log('\n--- INVOICES QUERY ---');
    
    // First, let's check what invoices exist for this tenant
    const allInvoices = await Invoice.find({ tenantId: tenantObjectId }).select('invoiceNumber issueDate total taxAmount currency').lean();
    console.log('All invoices for tenant:', allInvoices.length);
    console.log('Sample invoices:', allInvoices.slice(0, 5).map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      total: inv.total,
      taxAmount: inv.taxAmount,
      currency: inv.currency
    })));

    // Debug: Check all unique currencies in the database
    const uniqueCurrencies = await Invoice.distinct('currency', { tenantId: tenantObjectId });
    console.log('Unique currencies in DB:', uniqueCurrencies);

    // INR Revenue (main calculation) - handle case variations
    const inrRevenueResult = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          issueDate: { $gte: start, $lte: end },
          $or: [
            { currency: 'INR' },
            { currency: 'inr' },
            { currency: { $exists: false } },
            { currency: null }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalTaxAmount: { $sum: '$taxAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('INR Invoice aggregation result:', inrRevenueResult);

    // Foreign currency revenue (EUR, USD, etc.) - excluded from main calculation
    // Handle both uppercase and lowercase currency codes
    const foreignRevenueResult = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          issueDate: { $gte: start, $lte: end },
          currency: { 
            $nin: ['INR', 'inr', null], 
            $exists: true 
          }
        }
      },
      {
        $group: {
          _id: { $toUpper: '$currency' }, // Normalize to uppercase
          totalRevenue: { $sum: '$total' },
          totalTaxAmount: { $sum: '$taxAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Foreign currency Invoice aggregation result:', foreignRevenueResult);

    const totalRevenue = inrRevenueResult[0]?.totalRevenue || 0;
    const invoiceTaxAmount = inrRevenueResult[0]?.totalTaxAmount || 0;

    // Build foreign revenue object by currency
    const foreignRevenue = {};
    foreignRevenueResult.forEach(item => {
      foreignRevenue[item._id] = {
        totalRevenue: Math.round((item.totalRevenue || 0) * 100) / 100,
        taxAmount: Math.round((item.totalTaxAmount || 0) * 100) / 100,
        count: item.count || 0
      };
    });

    // II.1 Expenses from VendorBills - sum of payableAmount filtered by billDate
    console.log('\n--- VENDOR BILLS QUERY ---');
    
    const allVendorBills = await VendorBill.find({ tenantId: tenantObjectId, isActive: true, deletedStatus: false })
      .select('billNumber billDate payableAmount tdsAmount').lean();
    console.log('All vendor bills for tenant:', allVendorBills.length);
    console.log('Sample vendor bills:', allVendorBills.slice(0, 3).map(bill => ({
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      payableAmount: bill.payableAmount,
      tdsAmount: bill.tdsAmount
    })));

    const vendorBillsResult = await VendorBill.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          billDate: { $gte: start, $lte: end },
          isActive: true,
          deletedStatus: false
        }
      },
      {
        $group: {
          _id: null,
          totalPayable: { $sum: '$payableAmount' },
          totalTds: { $sum: '$tdsAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('VendorBills aggregation result:', vendorBillsResult);

    const vendorBillsExpense = vendorBillsResult[0]?.totalPayable || 0;
    const vendorTdsAmount = vendorBillsResult[0]?.totalTds || 0;

    // II.2 Expenses from Salaries - sum of netSalary filtered by paymentDate or month/year
    console.log('\n--- SALARIES QUERY ---');
    const monthsInRange = getMonthsInRange(start, end);
    console.log('Months fully in range:', monthsInRange);
    
    // Build OR conditions for each month/year combination (only for full months)
    const salaryMatchConditions = monthsInRange.map(({ month, year }) => ({
      month: month,
      year: year,
      paymentDate: { $exists: false } // Only match if paymentDate doesn't exist
    }));

    // Also add condition for salaries with paymentDate within range
    const paymentDateCondition = {
      paymentDate: { $gte: start, $lte: end }
    };

    const allSalaries = await SalaryRecord.find({ tenantId: tenantObjectId })
      .select('employeeName month year netSalary paymentDate').lean();
    console.log('All salaries for tenant:', allSalaries.length);
    console.log('Sample salaries:', allSalaries.slice(0, 3).map(sal => ({
      employeeName: sal.employeeName,
      month: sal.month,
      year: sal.year,
      netSalary: sal.netSalary,
      paymentDate: sal.paymentDate
    })));

    let salariesExpense = 0;
    let salariesResult = [];
    
    // Build the final match conditions
    const finalSalaryConditions = [];
    
    // Add paymentDate condition (always check this first)
    finalSalaryConditions.push(paymentDateCondition);
    
    // Add month/year conditions only for full months and when paymentDate is null
    if (salaryMatchConditions.length > 0) {
      salaryMatchConditions.forEach(condition => {
        finalSalaryConditions.push({
          month: condition.month,
          year: condition.year,
          $or: [
            { paymentDate: { $exists: false } },
            { paymentDate: null }
          ]
        });
      });
    }

    if (finalSalaryConditions.length > 0) {
      salariesResult = await SalaryRecord.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            $or: finalSalaryConditions
          }
        },
        {
          $group: {
            _id: null,
            totalSalaries: { $sum: '$netSalary' },
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('Salaries aggregation result:', salariesResult);
      salariesExpense = salariesResult[0]?.totalSalaries || 0;
    }

    // II.3 Expenses from Expenses model - sum of amount filtered by expenseDate
    // Only include INR expenses in main calculation
    console.log('\n--- EXPENSES QUERY ---');
    
    const allExpenses = await Expense.find({ tenantId: tenantObjectId })
      .select('category expenseDate amount currency').lean();
    console.log('All expenses for tenant:', allExpenses.length);
    console.log('Sample expenses:', allExpenses.slice(0, 5).map(exp => ({
      category: exp.category,
      expenseDate: exp.expenseDate,
      amount: exp.amount,
      currency: exp.currency
    })));

    // INR expenses only (main calculation)
    const expensesResult = await Expense.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          expenseDate: { $gte: start, $lte: end },
          $or: [
            { currency: 'INR' },
            { currency: { $exists: false } },
            { currency: null }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('INR Expenses aggregation result:', expensesResult);

    const otherExpenses = expensesResult[0]?.totalExpenses || 0;

    // Calculate total expenses
    const totalExpenses = vendorBillsExpense + salariesExpense + otherExpenses;

    // III. Tax Liability = Invoice taxAmount - VendorBill tdsAmount
    const taxLiability = invoiceTaxAmount - vendorTdsAmount;

    console.log('\n--- FINAL SUMMARY ---');
    console.log('Total Revenue (INR):', totalRevenue);
    console.log('Foreign Revenue:', foreignRevenue);
    console.log('Total Expenses (INR):', totalExpenses);
    console.log('  - Vendor Bills:', vendorBillsExpense);
    console.log('  - Salaries:', salariesExpense);
    console.log('  - Other Expenses:', otherExpenses);
    console.log('Tax Liability (INR):', taxLiability);
    console.log('  - Invoice Tax:', invoiceTaxAmount);
    console.log('  - Vendor TDS:', vendorTdsAmount);
    console.log('=== END DEBUG ===\n');

    // Prepare response
    const summary = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      taxLiability: Math.round(taxLiability * 100) / 100,
      breakdown: {
        vendorBillsExpense: Math.round(vendorBillsExpense * 100) / 100,
        salariesExpense: Math.round(salariesExpense * 100) / 100,
        otherExpenses: Math.round(otherExpenses * 100) / 100,
        invoiceTaxAmount: Math.round(invoiceTaxAmount * 100) / 100,
        vendorTdsAmount: Math.round(vendorTdsAmount * 100) / 100
      },
      foreignRevenue: foreignRevenue, // EUR, USD, GBP invoices excluded from main totals
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    };

    return res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Server error fetching dashboard summary' });
  }
};

/**
 * GET /api/dashboard/revenue
 * Query params: startDate, endDate (both required, inclusive)
 * 
 * Returns total revenue from invoices
 */
exports.getTotalRevenue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const result = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantId,
          issueDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          invoiceCount: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      totalRevenue: Math.round((result[0]?.totalRevenue || 0) * 100) / 100,
      invoiceCount: result[0]?.invoiceCount || 0,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    return res.status(500).json({ error: 'Server error fetching total revenue' });
  }
};

/**
 * GET /api/dashboard/expenses
 * Query params: startDate, endDate (both required, inclusive)
 * 
 * Returns total expenses breakdown
 */
exports.getTotalExpenses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // VendorBills expense
    const vendorBillsResult = await VendorBill.aggregate([
      {
        $match: {
          tenantId: tenantId,
          billDate: { $gte: start, $lte: end },
          isActive: true,
          deletedStatus: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payableAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Salaries expense
    const monthsInRange = getMonthsInRange(start, end);
    const salaryMatchConditions = monthsInRange.map(({ month, year }) => ({
      month: month,
      year: year
    }));

    let salariesResult = [{ total: 0, count: 0 }];
    if (salaryMatchConditions.length > 0) {
      salariesResult = await SalaryRecord.aggregate([
        {
          $match: {
            tenantId: tenantId,
            $or: salaryMatchConditions
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netSalary' },
            count: { $sum: 1 }
          }
        }
      ]);
    }

    // Other expenses
    const expensesResult = await Expense.aggregate([
      {
        $match: {
          tenantId: tenantId,
          expenseDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const vendorBills = {
      amount: Math.round((vendorBillsResult[0]?.total || 0) * 100) / 100,
      count: vendorBillsResult[0]?.count || 0
    };

    const salaries = {
      amount: Math.round((salariesResult[0]?.total || 0) * 100) / 100,
      count: salariesResult[0]?.count || 0
    };

    const otherExpenses = {
      amount: Math.round((expensesResult[0]?.total || 0) * 100) / 100,
      count: expensesResult[0]?.count || 0
    };

    const totalExpenses = vendorBills.amount + salaries.amount + otherExpenses.amount;

    return res.json({
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      breakdown: {
        vendorBills,
        salaries,
        otherExpenses
      },
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching total expenses:', error);
    return res.status(500).json({ error: 'Server error fetching total expenses' });
  }
};

/**
 * GET /api/dashboard/tax-liability
 * Query params: startDate, endDate (both required, inclusive)
 * 
 * Returns tax liability (invoice taxAmount - vendorBill tdsAmount)
 */
exports.getTaxLiability = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Invoice tax amount (filtered by issueDate)
    const invoiceTaxResult = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantId,
          issueDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalTaxAmount: { $sum: '$taxAmount' }
        }
      }
    ]);

    // VendorBill TDS amount (filtered by billDate)
    const vendorTdsResult = await VendorBill.aggregate([
      {
        $match: {
          tenantId: tenantId,
          billDate: { $gte: start, $lte: end },
          isActive: true,
          deletedStatus: false
        }
      },
      {
        $group: {
          _id: null,
          totalTdsAmount: { $sum: '$tdsAmount' }
        }
      }
    ]);

    const invoiceTaxAmount = invoiceTaxResult[0]?.totalTaxAmount || 0;
    const vendorTdsAmount = vendorTdsResult[0]?.totalTdsAmount || 0;
    const taxLiability = invoiceTaxAmount - vendorTdsAmount;

    return res.json({
      taxLiability: Math.round(taxLiability * 100) / 100,
      breakdown: {
        invoiceTaxAmount: Math.round(invoiceTaxAmount * 100) / 100,
        vendorTdsCredit: Math.round(vendorTdsAmount * 100) / 100
      },
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching tax liability:', error);
    return res.status(500).json({ error: 'Server error fetching tax liability' });
  }
};

/**
 * Helper to determine granularity based on date range
 */
const determineGranularity = (start, end) => {
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 31) return 'daily';     // Show each day (up to 1 month)
  if (diffDays <= 90) return 'weekly';    // Aggregate by week (up to 3 months)
  if (diffDays <= 365) return 'monthly';  // Aggregate by month (up to 1 year)
  return 'quarterly';                      // Aggregate by quarter (> 1 year)
};

/**
 * Helper to get MongoDB date grouping based on granularity
 */
const getDateGrouping = (granularity, dateField) => {
  switch (granularity) {
    case 'daily':
      return {
        year: { $year: dateField },
        month: { $month: dateField },
        day: { $dayOfMonth: dateField }
      };
    case 'weekly':
      return {
        year: { $isoWeekYear: dateField },
        week: { $isoWeek: dateField }
      };
    case 'monthly':
      return {
        year: { $year: dateField },
        month: { $month: dateField }
      };
    case 'quarterly':
      return {
        year: { $year: dateField },
        quarter: { $ceil: { $divide: [{ $month: dateField }, 3] } }
      };
    default:
      return {
        year: { $year: dateField },
        month: { $month: dateField }
      };
  }
};

/**
 * Helper to format label based on granularity
 */
const formatLabel = (groupId, granularity) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  switch (granularity) {
    case 'daily':
      return `${groupId.day} ${monthNames[groupId.month - 1]} ${groupId.year}`;
    case 'weekly':
      return `Week ${groupId.week}, ${groupId.year}`;
    case 'monthly':
      return `${monthNames[groupId.month - 1]} ${groupId.year}`;
    case 'quarterly':
      return `Q${groupId.quarter} ${groupId.year}`;
    default:
      return `${monthNames[groupId.month - 1]} ${groupId.year}`;
  }
};

/**
 * Helper to create ISO date string from group ID
 */
const getDateFromGroupId = (groupId, granularity) => {
  switch (granularity) {
    case 'daily':
      return new Date(Date.UTC(groupId.year, groupId.month - 1, groupId.day)).toISOString();
    case 'weekly':
      // Get the first day of the ISO week
      const jan4 = new Date(Date.UTC(groupId.year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7;
      const firstMonday = new Date(jan4);
      firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
      const weekStart = new Date(firstMonday);
      weekStart.setUTCDate(firstMonday.getUTCDate() + (groupId.week - 1) * 7);
      return weekStart.toISOString();
    case 'monthly':
      return new Date(Date.UTC(groupId.year, groupId.month - 1, 1)).toISOString();
    case 'quarterly':
      const quarterStartMonth = (groupId.quarter - 1) * 3;
      return new Date(Date.UTC(groupId.year, quarterStartMonth, 1)).toISOString();
    default:
      return new Date(Date.UTC(groupId.year, groupId.month - 1, 1)).toISOString();
  }
};

/**
 * Helper to create a sort key from group ID
 */
const getSortKey = (groupId, granularity) => {
  switch (granularity) {
    case 'daily':
      return `${groupId.year}-${String(groupId.month).padStart(2, '0')}-${String(groupId.day).padStart(2, '0')}`;
    case 'weekly':
      return `${groupId.year}-W${String(groupId.week).padStart(2, '0')}`;
    case 'monthly':
      return `${groupId.year}-${String(groupId.month).padStart(2, '0')}`;
    case 'quarterly':
      return `${groupId.year}-Q${groupId.quarter}`;
    default:
      return `${groupId.year}-${String(groupId.month).padStart(2, '0')}`;
  }
};

/**
 * GET /api/dashboard/chart
 * Query params: 
 *   - startDate: string (YYYY-MM-DD) - required
 *   - endDate: string (YYYY-MM-DD) - required
 *   - granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'auto'
 * 
 * Returns data for revenue vs expenses chart
 */
exports.getChartData = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const { startDate, endDate, granularity: requestedGranularity } = req.query;

    console.log('=== DASHBOARD CHART DEBUG ===');
    console.log('Query params:', { startDate, endDate, granularity: requestedGranularity });

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }

    // Parse dates as UTC
    const start = parseStartDate(startDate);
    const end = parseEndDate(endDate);

    console.log('Parsed dates (UTC):', { start: start.toISOString(), end: end.toISOString() });

    // Determine granularity
    const granularity = (requestedGranularity && requestedGranularity !== 'auto') 
      ? requestedGranularity 
      : determineGranularity(start, end);

    console.log('Using granularity:', granularity);

    // Get date grouping for aggregation
    const dateGrouping = getDateGrouping(granularity, '$issueDate');
    const expenseDateGrouping = getDateGrouping(granularity, '$expenseDate');
    const billDateGrouping = getDateGrouping(granularity, '$billDate');

    // Revenue aggregation (INR only)
    const revenueData = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          issueDate: { $gte: start, $lte: end },
          $or: [
            { currency: 'INR' },
            { currency: 'inr' },
            { currency: { $exists: false } },
            { currency: null }
          ]
        }
      },
      {
        $group: {
          _id: dateGrouping,
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1, '_id.quarter': 1 } }
    ]);

    console.log('Revenue data points:', revenueData.length);

    // Vendor Bills expenses aggregation
    const vendorBillsData = await VendorBill.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          billDate: { $gte: start, $lte: end },
          isActive: true,
          deletedStatus: false
        }
      },
      {
        $group: {
          _id: billDateGrouping,
          expenses: { $sum: '$payableAmount' }
        }
      }
    ]);

    console.log('VendorBills data points:', vendorBillsData.length);

    // Other expenses aggregation (INR only)
    const otherExpensesData = await Expense.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          expenseDate: { $gte: start, $lte: end },
          $or: [
            { currency: 'INR' },
            { currency: { $exists: false } },
            { currency: null }
          ]
        }
      },
      {
        $group: {
          _id: expenseDateGrouping,
          expenses: { $sum: '$amount' }
        }
      }
    ]);

    console.log('Other expenses data points:', otherExpensesData.length);

    // Salaries - for monthly/quarterly, we can include them
    // For daily/weekly, salaries are paid monthly so we distribute or exclude
    let salariesData = [];
    if (granularity === 'monthly' || granularity === 'quarterly') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      
      const monthsInRange = getMonthsInRange(start, end);
      
      if (monthsInRange.length > 0) {
        const salaryConditions = monthsInRange.map(({ month, year }) => ({
          month: month,
          year: year
        }));

        const rawSalaries = await SalaryRecord.aggregate([
          {
            $match: {
              tenantId: tenantObjectId,
              $or: salaryConditions
            }
          },
          {
            $group: {
              _id: { month: '$month', year: '$year' },
              expenses: { $sum: '$netSalary' }
            }
          }
        ]);

        // Convert month name to number for consistent grouping
        salariesData = rawSalaries.map(item => ({
          _id: {
            year: item._id.year,
            month: monthNames.indexOf(item._id.month) + 1,
            quarter: Math.ceil((monthNames.indexOf(item._id.month) + 1) / 3)
          },
          expenses: item.expenses
        }));
      }
    }

    console.log('Salaries data points:', salariesData.length);

    // Merge all data into a single map keyed by period
    const dataMap = new Map();

    // Add revenue data
    revenueData.forEach(item => {
      const key = getSortKey(item._id, granularity);
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          groupId: item._id,
          revenue: 0,
          expenses: 0
        });
      }
      dataMap.get(key).revenue += item.revenue || 0;
    });

    // Add vendor bills expenses
    vendorBillsData.forEach(item => {
      const key = getSortKey(item._id, granularity);
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          groupId: item._id,
          revenue: 0,
          expenses: 0
        });
      }
      dataMap.get(key).expenses += item.expenses || 0;
    });

    // Add other expenses
    otherExpensesData.forEach(item => {
      const key = getSortKey(item._id, granularity);
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          groupId: item._id,
          revenue: 0,
          expenses: 0
        });
      }
      dataMap.get(key).expenses += item.expenses || 0;
    });

    // Add salaries (for monthly/quarterly)
    if (granularity === 'monthly') {
      salariesData.forEach(item => {
        const key = getSortKey({ year: item._id.year, month: item._id.month }, granularity);
        if (!dataMap.has(key)) {
          dataMap.set(key, {
            groupId: { year: item._id.year, month: item._id.month },
            revenue: 0,
            expenses: 0
          });
        }
        dataMap.get(key).expenses += item.expenses || 0;
      });
    } else if (granularity === 'quarterly') {
      // Aggregate salaries by quarter
      const quarterlyMap = new Map();
      salariesData.forEach(item => {
        const key = `${item._id.year}-Q${item._id.quarter}`;
        if (!quarterlyMap.has(key)) {
          quarterlyMap.set(key, { year: item._id.year, quarter: item._id.quarter, expenses: 0 });
        }
        quarterlyMap.get(key).expenses += item.expenses || 0;
      });
      
      quarterlyMap.forEach((value, key) => {
        if (!dataMap.has(key)) {
          dataMap.set(key, {
            groupId: { year: value.year, quarter: value.quarter },
            revenue: 0,
            expenses: 0
          });
        }
        dataMap.get(key).expenses += value.expenses || 0;
      });
    }

    // Convert map to sorted array
    const sortedKeys = Array.from(dataMap.keys()).sort();
    const chartData = sortedKeys.map(key => {
      const item = dataMap.get(key);
      return {
        label: formatLabel(item.groupId, granularity),
        date: getDateFromGroupId(item.groupId, granularity),
        revenue: Math.round((item.revenue || 0) * 100) / 100,
        expenses: Math.round((item.expenses || 0) * 100) / 100
      };
    });

    console.log('Total chart data points:', chartData.length);
    console.log('=== END CHART DEBUG ===\n');

    return res.json({
      data: chartData,
      granularity: granularity,
      totalDataPoints: chartData.length,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return res.status(500).json({ error: 'Server error fetching chart data' });
  }
};

