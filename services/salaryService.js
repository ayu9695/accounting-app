const Employee = require('../models/Employee'); // Update path
const SalaryRecord = require('../models/Salary'); // Update path
const dayjs = require('dayjs');

/**
 * Core logic to calculate and update salary for a specific month/year
 */
const processSalaryForPeriod = async (monthName, year) => {
  console.log(`Starting Salary Process for: ${monthName} ${year}`);

  // 1. Define the time range for the target month (for filtering allowances/deductions)
  // Note: Assuming monthName is "January", "February", etc.
  const startDate = dayjs(`${year}-${monthName}-01`).startOf('month').toDate();
  const endDate = dayjs(`${year}-${monthName}-01`).endOf('month').toDate();

  try {
    // 2. Fetch all Active Employees
    const employees = await Employee.find({ isActive: true });

    const bulkOps = [];

    // 3. Iterate and Calculate
    for (const emp of employees) {
      const baseSalary = emp.baseSalary;

      // Helper to calculate array components (Allowances/Deductions)
      const calculateComponent = (items) => {
        return items.reduce((total, item) => {
          // Filter: Include if it has NO date (recurring) OR if date falls in current month
          const isApplicable = !item.date || (item.date >= startDate && item.date <= endDate);

          if (!isApplicable) return total;

          let amount = 0;
          if (item.type === 'percentage') {
            amount = (baseSalary * item.amount) / 100;
          } else {
            amount = item.amount;
          }
          return total + amount;
        }, 0);
      };

      const totalAllowances = calculateComponent(emp.allowances || []);
      const totalDeductions = calculateComponent(emp.deductions || []);

      const grossSalary = baseSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;

      // 4. Prepare Bulk Upsert Operation (Calculate & Recalculate)
      bulkOps.push({
        updateOne: {
          filter: {
            tenantId: emp.tenantId,
            employeeId: emp._id,
            month: monthName,
            year: year
          },
          update: {
            $set: {
              employeeName: emp.name,
              baseSalary: baseSalary,
              allowances: totalAllowances,
              deductions: totalDeductions,
              grossSalary: grossSalary,
              netSalary: netSalary,
              // Do not overwrite status if it's already paid
              // We assume we only recalculate pending/processed records
            },
            $setOnInsert: {
              status: 'pending',
              createdAt: new Date()
            }
          },
          upsert: true
        }
      });
    }

    // 5. Execute Bulk Write
    if (bulkOps.length > 0) {
      await SalaryRecord.bulkWrite(bulkOps);
    }

    console.log(`Processed salaries for ${employees.length} employees.`);
    return { success: true, count: employees.length };

  } catch (error) {
    console.error('Error processing salaries:', error);
    throw error;
  }
};

module.exports = { processSalaryForPeriod };