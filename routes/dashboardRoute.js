const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// Dashboard summary - all metrics in one call
router.get('/dashboard/summary', authMiddleware, dashboardController.getDashboardSummary);

// Individual metric endpoints
router.get('/dashboard/revenue', authMiddleware, dashboardController.getTotalRevenue);
router.get('/dashboard/expenses', authMiddleware, dashboardController.getTotalExpenses);
router.get('/dashboard/tax-liability', authMiddleware, dashboardController.getTaxLiability);

// Chart data for revenue vs expenses graph
router.get('/dashboard/chart', authMiddleware, dashboardController.getChartData);

module.exports = router;

