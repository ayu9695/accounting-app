const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const vendorBillsController = require('../controllers/vendorBillsController');

router.use(authMiddleware);

router.get('/vendor-bills/summary/stats', vendorBillsController.getSummaryStats);
router.get('/vendor-bills', vendorBillsController.getAllVendorBills);
router.get('/vendor-bills/:id/download/:attachmentId', vendorBillsController.downloadAttachment);
router.get('/vendor-bills/:id', vendorBillsController.getVendorBillById);

router.post('/vendor-bills', vendorBillsController.createVendorBill);
router.post('/vendor-bills/:id/upload', upload.single('pdf'), vendorBillsController.uploadAttachment);

router.put('/vendor-bills/payment/:id', vendorBillsController.updateVendorBillPayment);
router.put('/vendor-bills/:id', vendorBillsController.updateVendorBill);

router.delete('/vendor-bills/:id/attachments/:attachmentId', vendorBillsController.deleteAttachment);
router.delete('/vendor-bills/:id', vendorBillsController.deleteVendorBill);

module.exports = router;
