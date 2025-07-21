const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const employeesController = require('../controllers/employeesController');

router.get('/employees', authMiddleware, employeesController.getAllEmployees);
router.get('/employees/:email', authMiddleware, employeesController.getEmployeeByEmail);
router.post('/employees', authMiddleware, employeesController.createEmployee);
router.put('/employees/', authMiddleware, employeesController.updateEmployee);
router.delete('/employees', authMiddleware, employeesController.deleteEmployee);

module.exports = router;
