const cron = require('node-cron');
const dayjs = require('dayjs');
const { processSalaryForPeriod } = require('../services/salaryService');

const initSalaryCron = () => {
  // ============================================
  // 1st of Month - INITIAL SALARY CALCULATION
  // Creates new salary records for current month
  // ============================================
  cron.schedule('0 0 1 * *', async () => {
    const now = dayjs();
    const currentMonth = now.format('MMMM');
    const currentYear = now.year();

    console.log(`[CRON - 1st] Initial Salary Calculation for ${currentMonth} ${currentYear}`);
    
    try {
      const result = await processSalaryForPeriod(currentMonth, currentYear, false); // isRecalculation = false
      console.log(`[CRON - 1st] Result:`, result);
    } catch (err) {
      console.error('[CRON - 1st] Failed to process salary:', err);
    }
  });

  // ============================================
  // 15th of Month - RECALCULATION
  // Updates existing unpaid records (e.g., mid-month allowance/deduction changes)
  // ============================================
  cron.schedule('0 0 15 * *', async () => {
    const now = dayjs();
    const currentMonth = now.format('MMMM');
    const currentYear = now.year();

    console.log(`[CRON - 15th] Salary Recalculation for ${currentMonth} ${currentYear}`);
    
    try {
      const result = await processSalaryForPeriod(currentMonth, currentYear, true); // isRecalculation = true
      console.log(`[CRON - 15th] Result:`, result);
    } catch (err) {
      console.error('[CRON - 15th] Failed to recalculate salary:', err);
    }
  });

  // ============================================
  // 27th of Month - FINAL RECALCULATION
  // Final update before month-end (catches late changes)
  // ============================================
  cron.schedule('0 0 27 * *', async () => {
    const now = dayjs();
    const currentMonth = now.format('MMMM');
    const currentYear = now.year();

    console.log(`[CRON - 27th] Final Salary Recalculation for ${currentMonth} ${currentYear}`);
    
    try {
      const result = await processSalaryForPeriod(currentMonth, currentYear, true); // isRecalculation = true
      console.log(`[CRON - 27th] Result:`, result);
    } catch (err) {
      console.error('[CRON - 27th] Failed to recalculate salary:', err);
    }
  });
  
  console.log('Salary Cron Jobs scheduled:');
  console.log('  - 1st  @ 00:00 → Initial calculation (creates records)');
  console.log('  - 15th @ 00:00 → Recalculation (updates unpaid only)');
  console.log('  - 27th @ 00:00 → Final recalculation (updates unpaid only)');
};

module.exports = initSalaryCron;