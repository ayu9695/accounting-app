const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const clientsController = require('../controllers/clientsController');

// GET /api/clients — fetch all clients for tenant
router.get('/clients', authMiddleware, clientsController.getAllClients);

// GET /api/clients/:name — fetch one client by name in tenant
router.get('/clients/:name', authMiddleware, clientsController.getClientByName);
router.get('/clients-with-contacts', authMiddleware, clientsController.getClientContacts);

router.post('/clients', authMiddleware, clientsController.createClient);
router.post('clients/:id/contacts', authMiddleware, clientsController.updateClientContact);

// Update client by ID
router.put('/clients/:name', authMiddleware, clientsController.updateClient);

// Delete client by ID
router.delete('/clients/:name', authMiddleware, clientsController.deleteClient);


module.exports = router;
