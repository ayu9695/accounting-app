const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const salariesController = require('../controllers/salariesController');

router.get('/salaries', authMiddleware, salariesController.getAllSalaries);
router.get('/salaries/:period', authMiddleware, salariesController.getMonthlySalaries);
router.post('/salaries', authMiddleware, salariesController.createSalary);
router.post('/salaries/calculate', authMiddleware, salariesController.manualSalaryCalculation);

module.exports = router;
