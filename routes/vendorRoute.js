const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const vendorsController = require('../controllers/vendorsController');

// Fetch all vendors for tenant
router.get('/vendors', authMiddleware, vendorsController.getAllVendors);

// Fetch vendor by ID
router.get('/vendors/:name', authMiddleware, vendorsController.getVendorByName);
router.get('/vendors/bill/:billNumber', authMiddleware, vendorsController.getVendorByBillNumber);
router.get('/vendors/id/:id', authMiddleware, vendorsController.getVendorById);
router.get('/vendors-with-contacts', authMiddleware, vendorsController.getVendorContacts);

// Create new vendor
router.post('/vendors', authMiddleware, vendorsController.createVendor);

// Update vendor by ID
router.put('/vendors/:id', authMiddleware, vendorsController.updateVendor);
router.put('/vendor-contacts/:id', authMiddleware, vendorsController.addVendorContact);

// Soft-delete vendor by ID
router.delete('/vendors/:id', authMiddleware, vendorsController.deleteVendor);

module.exports = router;
