/**
 * Manual Test Script for Salary Cron Job Logic
 * 
 * Run with: node tests/testSalaryCron.js
 * 
 * Make sure MongoDB is running and .env is configured
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { processSalaryForPeriod, calculatePaymentDate } = require('../services/salaryService');
const SalaryRecord = require('../models/Salary');
const Employee = require('../models/Employee');

// Test configuration
const TEST_MONTH = 'December';
const TEST_YEAR = 2025;

const runTests = async () => {
  console.log('========================================');
  console.log('   SALARY CRON JOB TEST SUITE');
  console.log('========================================\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // ========================================
    // TEST 1: calculatePaymentDate function
    // ========================================
    console.log('--- TEST 1: calculatePaymentDate ---');
    
    const testCases = [
      { salaryPaymentDate: 1, month: 'November', year: 2025, expected: 'December 1, 2025' },
      { salaryPaymentDate: 5, month: 'November', year: 2025, expected: 'December 5, 2025' },
      { salaryPaymentDate: 1, month: 'December', year: 2025, expected: 'January 1, 2026' },
      { salaryPaymentDate: 15, month: 'December', year: 2025, expected: 'January 15, 2026' },
    ];

    testCases.forEach(tc => {
      const result = calculatePaymentDate(tc.salaryPaymentDate, tc.month, tc.year);
      const formatted = result.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const passed = formatted === tc.expected;
      console.log(`  ${passed ? '✅' : '❌'} salaryPaymentDate=${tc.salaryPaymentDate}, ${tc.month} ${tc.year}`);
      console.log(`     Expected: ${tc.expected}`);
      console.log(`     Got:      ${formatted}\n`);
    });

    // ========================================
    // TEST 2: Check existing data
    // ========================================
    console.log('\n--- TEST 2: Database State Check ---');
    
    const activeEmployees = await Employee.find({ isActive: true }).select('name tenantId salaryPaymentDate baseSalary');
    console.log(`  Active employees: ${activeEmployees.length}`);
    
    if (activeEmployees.length > 0) {
      console.log('  Sample employees:');
      activeEmployees.slice(0, 3).forEach(emp => {
        console.log(`    - ${emp.name} (salaryPaymentDate: ${emp.salaryPaymentDate || 1}, baseSalary: ${emp.baseSalary})`);
      });
    }

    const existingSalaries = await SalaryRecord.find({ month: TEST_MONTH, year: TEST_YEAR });
    console.log(`\n  Existing ${TEST_MONTH} ${TEST_YEAR} salary records: ${existingSalaries.length}`);
    
    if (existingSalaries.length > 0) {
      const statusCounts = existingSalaries.reduce((acc, sal) => {
        acc[sal.status] = (acc[sal.status] || 0) + 1;
        return acc;
      }, {});
      console.log('  Status breakdown:', statusCounts);
    }

    // ========================================
    // TEST 3: Initial Calculation (1st of month)
    // ========================================
    console.log('\n--- TEST 3: Initial Calculation (simulating 1st) ---');
    console.log(`  Processing ${TEST_MONTH} ${TEST_YEAR} with isRecalculation=false`);
    
    const initialResult = await processSalaryForPeriod(TEST_MONTH, TEST_YEAR, false);
    console.log('  Result:', JSON.stringify(initialResult, null, 2));

    // Check what was created
    const afterInitial = await SalaryRecord.find({ month: TEST_MONTH, year: TEST_YEAR })
      .select('employeeName status netSalary salaryPaymentDate paymentDate');
    
    console.log(`\n  Salary records after initial calculation: ${afterInitial.length}`);
    if (afterInitial.length > 0) {
      console.log('  Sample records:');
      afterInitial.slice(0, 3).forEach(sal => {
        console.log(`    - ${sal.employeeName}: ₹${sal.netSalary} | status: ${sal.status} | paymentDate: ${sal.paymentDate?.toISOString().split('T')[0] || 'N/A'}`);
      });
    }

    // ========================================
    // TEST 4: Recalculation (15th/27th of month)
    // ========================================
    console.log('\n--- TEST 4: Recalculation (simulating 15th/27th) ---');
    console.log(`  Processing ${TEST_MONTH} ${TEST_YEAR} with isRecalculation=true`);
    
    const recalcResult = await processSalaryForPeriod(TEST_MONTH, TEST_YEAR, true);
    console.log('  Result:', JSON.stringify(recalcResult, null, 2));

    // ========================================
    // TEST 5: Verify paid records are not updated
    // ========================================
    console.log('\n--- TEST 5: Paid Record Protection ---');
    
    // Find one unpaid record to mark as paid for testing
    const unpaidRecord = await SalaryRecord.findOne({ 
      month: TEST_MONTH, 
      year: TEST_YEAR, 
      status: { $ne: 'paid' } 
    });

    if (unpaidRecord) {
      console.log(`  Found unpaid record: ${unpaidRecord.employeeName}`);
      console.log(`  Current netSalary: ${unpaidRecord.netSalary}`);
      
      // Mark it as paid
      unpaidRecord.status = 'paid';
      unpaidRecord.paidOn = new Date();
      await unpaidRecord.save();
      console.log('  ✅ Marked as paid');

      // Run recalculation again
      console.log('  Running recalculation...');
      const recalcAfterPaid = await processSalaryForPeriod(TEST_MONTH, TEST_YEAR, true);
      console.log(`  Skipped paid records: ${recalcAfterPaid.skippedPaid}`);

      // Verify the paid record wasn't changed
      const verifyRecord = await SalaryRecord.findById(unpaidRecord._id);
      console.log(`  Record status after recalc: ${verifyRecord.status}`);
      console.log(`  ${verifyRecord.status === 'paid' ? '✅' : '❌'} Paid record was ${verifyRecord.status === 'paid' ? 'protected' : 'MODIFIED!'}`);

      // Revert for future tests
      verifyRecord.status = 'pending';
      verifyRecord.paidOn = null;
      await verifyRecord.save();
      console.log('  (Reverted to pending for future tests)');
    } else {
      console.log('  ⚠️ No unpaid records found to test');
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n========================================');
    console.log('   TEST SUMMARY');
    console.log('========================================');
    
    const finalCount = await SalaryRecord.countDocuments({ month: TEST_MONTH, year: TEST_YEAR });
    const finalStatusCounts = await SalaryRecord.aggregate([
      { $match: { month: TEST_MONTH, year: TEST_YEAR } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log(`\n  ${TEST_MONTH} ${TEST_YEAR} Salary Records: ${finalCount}`);
    console.log('  By Status:');
    finalStatusCounts.forEach(s => {
      console.log(`    - ${s._id}: ${s.count}`);
    });

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run tests
runTests();

