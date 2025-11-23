const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
// const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Base path: /api/tenants

// Create
router.post('/tenants', tenantController.createTenant);

// Read (Get by Custom ID)
router.get('/tenants/:id', tenantController.getTenantById);

// Update
router.put('/tenants/:id', tenantController.updateTenant);

// Delete (Soft)
router.delete('/tenants/:id', tenantController.deleteTenant);

module.exports = router;