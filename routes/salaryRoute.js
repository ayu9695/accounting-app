const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const salariesController = require('../controllers/salariesController');

router.get('/salaries', authMiddleware, salariesController.getAllSalaries);
router.post('/salaries', authMiddleware, salariesController.createSalary);

module.exports = router;
