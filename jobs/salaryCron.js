const cron = require('node-cron');
const dayjs = require('dayjs');
const { processSalaryForPeriod } = require('../services/salaryService');

const initSalaryCron = () => {
  // Cron syntax: "Minute Hour DayOfMonth Month DayOfWeek"
  // Run at 00:00 on the 1st, 15th, and 27th of every month
  cron.schedule('0 0 1,15,27 * *', async () => {
    
    const now = dayjs();
    const currentMonth = now.format('MMMM'); // e.g., "November"
    const currentYear = now.year();

    console.log(`[CRON] Triggered Salary Calculation for ${currentMonth} ${currentYear}`);
    
    try {
      await processSalaryForPeriod(currentMonth, currentYear);
    } catch (err) {
      console.error('[CRON] Failed to process salary:', err);
    }
  });
  
  console.log('Salary Cron Job scheduled: 1st, 15th, 27th of every month.');
};

module.exports = initSalaryCron;