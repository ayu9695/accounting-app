const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const paymentMethodsController = require('../controllers/paymentMethodsController');

// CRUD routes for paymentMethods
router.get('/paymentMethods', authMiddleware, paymentMethodsController.getAllPaymentMethods);
router.get('/paymentMethods/:id', authMiddleware, paymentMethodsController.getPaymentMethodById);
router.post('/paymentMethods', authMiddleware, paymentMethodsController.createPaymentMethod);
router.put('/paymentMethods/:id', authMiddleware, paymentMethodsController.updatePaymentMethod);
router.delete('/paymentMethods/:id', authMiddleware, paymentMethodsController.deletePaymentMethod);

module.exports = router;
