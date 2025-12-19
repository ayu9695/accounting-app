const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const expensesController = require('../controllers/expensesController');

// CRUD routes for expenses
router.get('/expenses', authMiddleware, expensesController.getAllExpenses);

// Filter routes (must be before :id to avoid conflicts)
router.get('/expenses/filter/unpaid', authMiddleware, expensesController.getUnpaidExpenses);

router.get('/expenses/:id', authMiddleware, expensesController.getExpenseById);
router.post('/expenses', authMiddleware, expensesController.createExpense);
router.put('/expenses/:id', authMiddleware, expensesController.updateExpense);
router.delete('/expenses/:id', authMiddleware, expensesController.deleteExpense);

module.exports = router;
