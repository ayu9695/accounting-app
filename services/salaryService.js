const Employee = require('../models/Employee');
const SalaryRecord = require('../models/Salary');
const Settings = require('../models/Settings');
const DefaultWorkingDays = require('../models/DefaultWorkingDays');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

/**
 * Helper to calculate payment date based on salaryPaymentDate, month and year
 * Payment is made on the 1st (or salaryPaymentDate) of the SAME month as the salary
 * e.g., December salary with salaryPaymentDate=1 is paid on December 1st
 */
const calculatePaymentDate = (salaryPaymentDate, monthName, year) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.indexOf(monthName);
  
  // Payment is made in the SAME month as the salary month
  // e.g., December 2025 salary is paid on December 1, 2025 (or salaryPaymentDate day)
  return new Date(Date.UTC(year, monthIndex, salaryPaymentDate));
};

/**
 * Helper to calculate total weekdays (Monday-Friday) in a month
 * Uses dayjs for cleaner date handling and UTC accuracy
 * @param {string} monthName - Month name (e.g., "December")
 * @param {number} year - Year (e.g., 2025)
 * @returns {number} Count of weekdays (excluding Saturday and Sunday)
 */
const calculateWeekdaysInMonth = (monthName, year) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.indexOf(monthName);
  
  if (monthIndex === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  
  // Use dayjs UTC to get first day of month and calculate total days
  const firstDay = dayjs.utc(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01`);
  const totalDays = firstDay.daysInMonth(); // dayjs method to get days in month
  
  // Get day of week for the 1st (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfWeek = firstDay.day();
  
  // Calculate full weeks (each week has 5 weekdays: Mon-Fri)
  const fullWeeks = Math.floor(totalDays / 7);
  const weekdaysFromFullWeeks = fullWeeks * 5;
  
  // Calculate remaining days after full weeks
  const remainingDays = totalDays % 7;
  
  // Count weekdays in the remaining days (max 6 iterations)
  let weekdaysInRemaining = 0;
  for (let i = 0; i < remainingDays; i++) {
    const dayOfWeek = (firstDayOfWeek + i) % 7;
    // Count only weekdays (Monday = 1 to Friday = 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdaysInRemaining++;
    }
  }
  
  return weekdaysFromFullWeeks + weekdaysInRemaining;
};

/**
 * Helper to get official holidays for a specific year from Settings
 * @param {Object} tenantId - Tenant ID
 * @param {number} year - Year
 * @returns {Array} Array of holiday dates
 */
const getOfficialHolidaysForYear = async (tenantId, year) => {
  try {
    const settings = await Settings.findOne({ tenantId });
    if (!settings || !settings.officialLeaves || settings.officialLeaves.length === 0) {
      return [];
    }
    
    // Find holidays for the specific year
    const yearHolidays = settings.officialLeaves.find(leave => leave.year === year);
    if (!yearHolidays || !yearHolidays.holidays || yearHolidays.holidays.length === 0) {
      return [];
    }
    
    // Return array of holiday dates
    return yearHolidays.holidays.map(holiday => new Date(holiday.date));
  } catch (error) {
    console.error('Error fetching official holidays:', error);
    return [];
  }
};

/**
 * Helper to calculate default working days for a month
 * Checks DefaultWorkingDays model first, then calculates if not found
 * Also deducts official holidays that fall on weekdays
 * @param {Object} tenantId - Tenant ID
 * @param {string} monthName - Month name (e.g., "December")
 * @param {number} year - Year (e.g., 2025)
 * @returns {Promise<number>} Default working days count
 */
const calculateDefaultWorkingDays = async (tenantId, monthName, year) => {
  try {
    // First, check DefaultWorkingDays model
    const defaultWorkingDays = await DefaultWorkingDays.findOne({ tenantId });
    
    if (defaultWorkingDays && defaultWorkingDays.yearData) {
      const yearStr = year.toString();
      const yearData = defaultWorkingDays.yearData;
      
      if (yearData[yearStr] && yearData[yearStr][monthName] !== undefined && yearData[yearStr][monthName] !== null) {
        const monthWorkingDays = yearData[yearStr][monthName];
        console.log(`Using cached working days for ${monthName} ${year}: ${monthWorkingDays}`);
        return monthWorkingDays;
      }
    }
    
    // If not found in DefaultWorkingDays, calculate weekdays
    let weekdaysCount = calculateWeekdaysInMonth(monthName, year);
    console.log(`Calculated weekdays for ${monthName} ${year}: ${weekdaysCount}`);
    
    // Get official holidays for the year
    const officialHolidays = await getOfficialHolidaysForYear(tenantId, year);
    
    if (officialHolidays.length > 0) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(monthName);
      
      // Filter holidays that fall in this month and are weekdays
      const monthStart = new Date(Date.UTC(year, monthIndex, 1));
      const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
      
      let holidaysOnWeekdays = 0;
      officialHolidays.forEach(holidayDate => {
        // Check if holiday falls within the month
        if (holidayDate >= monthStart && holidayDate <= monthEnd) {
          const dayOfWeek = holidayDate.getUTCDay();
          // Only count if it's a weekday (Monday-Friday)
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            holidaysOnWeekdays++;
          }
        }
      });
      
      weekdaysCount -= holidaysOnWeekdays;
      console.log(`Deducted ${holidaysOnWeekdays} official holidays on weekdays. Final: ${weekdaysCount}`);
    }
    
    // Save to DefaultWorkingDays for future use
    await saveDefaultWorkingDays(tenantId, monthName, year, weekdaysCount);
    
    return weekdaysCount;
  } catch (error) {
    console.error('Error calculating default working days:', error);
    // Fallback to simple weekday calculation
    return calculateWeekdaysInMonth(monthName, year);
  }
};

/**
 * Helper to save default working days to DefaultWorkingDays model
 * @param {Object} tenantId - Tenant ID
 * @param {string} monthName - Month name
 * @param {number} year - Year
 * @param {number} workingDays - Working days count
 */
const saveDefaultWorkingDays = async (tenantId, monthName, year, workingDays) => {
  try {
    const yearStr = year.toString();
    
    let defaultWorkingDays = await DefaultWorkingDays.findOne({ tenantId });
    
    if (!defaultWorkingDays) {
      defaultWorkingDays = new DefaultWorkingDays({
        tenantId,
        yearData: {}
      });
    }
    
    if (!defaultWorkingDays.yearData) {
      defaultWorkingDays.yearData = {};
    }
    
    if (!defaultWorkingDays.yearData[yearStr]) {
      defaultWorkingDays.yearData[yearStr] = {};
    }
    
    defaultWorkingDays.yearData[yearStr][monthName] = workingDays;
    defaultWorkingDays.updatedAt = new Date();
    
    // Mark yearData as modified to ensure Mongoose saves it
    defaultWorkingDays.markModified('yearData');
    
    await defaultWorkingDays.save();
    console.log(`Saved default working days for ${monthName} ${year}: ${workingDays}`);
  } catch (error) {
    console.error('Error saving default working days:', error);
    // Don't throw - this is just for caching
  }
};

/**
 * Core logic to calculate and update salary for a specific month/year
 * NOTE: This function only uses baseSalary. Allowances/deductions must be provided
 * during salary processing (create/update) and are NOT read from Employee model.
 * 
 * @param {string} monthName - Month name (e.g., "November")
 * @param {number} year - Year (e.g., 2025)
 * @param {boolean} isRecalculation - If true, only updates existing records (15th/27th runs)
 */
const processSalaryForPeriod = async (monthName, year, isRecalculation = false) => {
  console.log(`Starting Salary Process for: ${monthName} ${year} (Recalculation: ${isRecalculation})`);

  try {
    // 1. Fetch all Active Employees
    const employees = await Employee.find({ isActive: true });
    
    if (employees.length === 0) {
      console.log('No active employees found');
      return { success: true, processed: 0, skippedPaid: 0, totalEmployees: 0 };
    }

    // 2. Calculate defaultWorkingDays for this month (same for all employees)
    // Get tenantId from first employee (assuming all employees belong to same tenant)
    const tenantId = employees[0].tenantId;
    const defaultWorkingDays = await calculateDefaultWorkingDays(tenantId, monthName, year);
    console.log(`Default working days for ${monthName} ${year}: ${defaultWorkingDays}`);

    const bulkOps = [];
    let skippedPaid = 0;

    // 2. Iterate and Calculate - ONLY using baseSalary (no allowances/deductions from Employee)
    for (const emp of employees) {
      const baseSalary = emp.baseSalary;
      const salaryPaymentDate = emp.salaryPaymentDate || 1;

      // NEW LOGIC: Only use baseSalary. Allowances/deductions are optional and provided during processing
      // If not provided during processing, salary = baseSalary only
      const totalAllowances = 0; // Not read from Employee model anymore
      const totalDeductions = 0; // Not read from Employee model anymore

      // Salary calculation: baseSalary only (unless allowances/deductions provided during processing)
      const grossSalary = baseSalary; // Will be updated if allowances provided during processing
      const netSalary = baseSalary;   // Will be updated if allowances/deductions provided during processing

      // Calculate scheduled payment date
      const paymentDate = calculatePaymentDate(salaryPaymentDate, monthName, year);

      if (isRecalculation) {
        // On recalculation (15th/27th): Only update existing non-paid records
        // Check if record exists and is not paid
        const existingRecord = await SalaryRecord.findOne({
          tenantId: emp.tenantId,
          employeeId: emp._id,
          month: monthName,
          year: year
        });

        if (!existingRecord) {
          // Skip - record doesn't exist, shouldn't create on recalculation
          continue;
        }

        if (existingRecord.status === 'paid') {
          // Skip - already paid, don't recalculate
          skippedPaid++;
          continue;
        }

        // Update existing record - preserve existing allowances/deductions if they exist
        // Only update baseSalary and employeeName if changed
        bulkOps.push({
          updateOne: {
            filter: {
              tenantId: emp.tenantId,
              employeeId: emp._id,
              month: monthName,
              year: year,
              status: { $ne: 'paid' } // Extra safety: don't update paid records
            },
            update: {
              $set: {
                employeeName: emp.name,
                baseSalary: baseSalary,
                // Preserve existing allowances/deductions - don't overwrite with 0
                // Only update if they don't exist (new record scenario)
                salaryPaymentDate: salaryPaymentDate,
                paymentDate: paymentDate,
                defaultWorkingDays: defaultWorkingDays, // Set default working days
                updatedAt: new Date()
              }
            }
          }
        });
      } else {
        // On initial calculation (1st): Create records with baseSalary only
        // Allowances/deductions can be added later via update endpoint
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
                allowances: totalAllowances, // 0 by default
                deductions: totalDeductions,  // 0 by default
                grossSalary: grossSalary,     // = baseSalary
                netSalary: netSalary,         // = baseSalary
                salaryPaymentDate: salaryPaymentDate,
                paymentDate: paymentDate,
                defaultWorkingDays: defaultWorkingDays, // Set default working days
                updatedAt: new Date()
              },
              $setOnInsert: {
                tenantId: emp.tenantId, // Explicitly set tenantId on insert
                employeeId: emp._id, // Explicitly set employeeId on insert
                status: 'pending',
                createdAt: new Date()
              }
            },
            upsert: true
          }
        });
      }
    }

    // 3. Execute Bulk Write
    if (bulkOps.length > 0) {
      await SalaryRecord.bulkWrite(bulkOps);
    }

    console.log(`Processed salaries for ${bulkOps.length} employees. Skipped ${skippedPaid} paid records.`);
    return { 
      success: true, 
      processed: bulkOps.length, 
      skippedPaid: skippedPaid,
      totalEmployees: employees.length 
    };

  } catch (error) {
    console.error('Error processing salaries:', error);
    throw error;
  }
};

/**
 * Helper function to save allowances/deductions to Employee model for history/analysis
 * This is called when allowances/deductions are provided during salary processing
 * NOTE: These are saved for history/analysis only, NOT used in future calculations
 * @param {Object} employeeId - Employee ID
 * @param {Array} allowances - Array of allowance objects { name, amount, type }
 * @param {Array} deductions - Array of deduction objects { name, amount, type }
 * @param {string} monthName - Month name
 * @param {number} year - Year
 */
const saveAllowancesDeductionsToEmployee = async (employeeId, allowances, deductions, monthName, year) => {
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.log(`Employee ${employeeId} not found, skipping history save`);
      return;
    }

    const updateHistory = [];
    const newAllowances = [];
    const newDeductions = [];

    // Add allowances with date metadata for history (date = first day of salary month)
    if (allowances && allowances.length > 0) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(monthName);
      const salaryDate = new Date(Date.UTC(year, monthIndex, 1));

      allowances.forEach(allowance => {
        newAllowances.push({
          name: allowance.name || 'Allowance',
          amount: allowance.amount || 0,
          type: allowance.type || 'fixed',
          date: salaryDate // Store date for reference (first day of salary month)
        });
      });

      if (employee.allowances) {
        employee.allowances.push(...newAllowances);
      } else {
        employee.allowances = newAllowances;
      }

      updateHistory.push({
        attribute: 'allowances',
        oldValue: employee.allowances.length - newAllowances.length,
        newValue: employee.allowances.length,
        updatedAt: new Date()
      });
    }

    // Add deductions with date metadata for history (date = first day of salary month)
    if (deductions && deductions.length > 0) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(monthName);
      const salaryDate = new Date(Date.UTC(year, monthIndex, 1));

      deductions.forEach(deduction => {
        newDeductions.push({
          name: deduction.name || 'Deduction',
          amount: deduction.amount || 0,
          type: deduction.type || 'fixed',
          date: salaryDate // Store date for reference (first day of salary month)
        });
      });

      if (employee.deductions) {
        employee.deductions.push(...newDeductions);
      } else {
        employee.deductions = newDeductions;
      }

      updateHistory.push({
        attribute: 'deductions',
        oldValue: employee.deductions.length - newDeductions.length,
        newValue: employee.deductions.length,
        updatedAt: new Date()
      });
    }

    if (updateHistory.length > 0) {
      if (!employee.updateHistory) {
        employee.updateHistory = [];
      }
      employee.updateHistory.push(...updateHistory);
      employee.updatedAt = new Date();
      await employee.save();
      console.log(`✅ Saved allowances/deductions to Employee ${employeeId} for ${monthName} ${year} (history only)`);
    }
  } catch (error) {
    console.error('Error saving allowances/deductions to Employee:', error);
    // Don't throw - this is just for history, shouldn't break salary processing
  }
};

module.exports = { 
  processSalaryForPeriod, 
  calculatePaymentDate,
  saveAllowancesDeductionsToEmployee,
  calculateDefaultWorkingDays,
  calculateWeekdaysInMonth
};