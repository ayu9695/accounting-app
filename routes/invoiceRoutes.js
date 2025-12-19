const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const invoicesController = require('../controllers/invoiceController');

// Fetch all invoices for tenant
router.get('/invoices', authMiddleware, invoicesController.getAllInvoices);

// Filter invoices by date range (must be before :invoiceNumber to avoid conflicts)
router.get('/invoices/filter/by-date', authMiddleware, invoicesController.getInvoicesByDateRange);

// Fetch invoice by ID
router.get('/invoices/:invoiceNumber', authMiddleware, invoicesController.getInvoiceById);

router.get('/invoices/client/:clientName', authMiddleware, invoicesController.getInvoicesByClient);

router.get('/invoices/pdf/:id', authMiddleware, invoicesController.generateInvoicePDF);

router.post('/invoices/gst-billed', authMiddleware, invoicesController.getGstBilledByMonth);

// Create new invoice
router.post('/invoices', authMiddleware, invoicesController.createInvoice);

router.put('/invoices/:id', authMiddleware, invoicesController.updateInvoice);
// Update invoice by ID
router.put('/invoices/payment/:id', authMiddleware, invoicesController.updatePaymentForInvoice);

// Delete invoice by ID
router.delete('/invoices/:id', authMiddleware, invoicesController.deleteInvoice);

module.exports = router;
