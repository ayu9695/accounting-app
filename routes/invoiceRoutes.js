const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const invoicesController = require('../controllers/invoiceController');

// Fetch all invoices for tenant
router.get('/invoices', authMiddleware, invoicesController.getAllInvoices);

// Fetch invoice by ID
router.get('/invoices/:invoiceNumber', authMiddleware, invoicesController.getInvoiceById);

router.get('/invoices/client/:clientName', authMiddleware, invoicesController.getInvoicesByClient);

// Create new invoice
router.post('/invoices', authMiddleware, invoicesController.createInvoice);

// Update invoice by ID
router.put('/invoices/:id', authMiddleware, invoicesController.updateInvoice);

// Delete invoice by ID
router.delete('/invoices/:id', authMiddleware, invoicesController.deleteInvoice);

module.exports = router;
