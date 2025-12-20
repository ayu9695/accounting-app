const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const salariesController = require('../controllers/salariesController');

// Get all salaries
router.get('/salaries', authMiddleware, salariesController.getAllSalaries);

// Get unpaid salaries (must be before :period to avoid conflicts)
router.get('/salaries/filter/unpaid', authMiddleware, salariesController.getUnpaidSalaries);

// Get salaries by period (MMYYYY format)
router.get('/salaries/:period', authMiddleware, salariesController.getMonthlySalaries);

// Create new salary record
router.post('/salaries', authMiddleware, salariesController.createSalary);

// Bulk mark salaries as paid (MUST be before :id routes to avoid route conflicts)
router.put('/salaries/bulk/mark-paid', authMiddleware, salariesController.bulkMarkAsPaid);

// Manual salary calculation trigger
router.post('/salaries/calculate', authMiddleware, salariesController.manualSalaryCalculation);


// Update salary record
router.put('/salaries/:id', authMiddleware, salariesController.updateSalary);

// Mark single salary as paid
router.put('/salaries/:id/mark-paid', authMiddleware, salariesController.markSalaryAsPaid);

module.exports = router;
