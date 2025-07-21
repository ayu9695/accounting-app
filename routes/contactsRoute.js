const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const contactsController = require('../controllers/contactsController');

// Fetch all contacts across all clients for a tenant
router.get('/contacts', authMiddleware, contactsController.getAllContacts);

// Fetch contacts for a specific client
router.get('/contacts/client/:clientName', authMiddleware, contactsController.getContactsForClient);

// Add a new contact to a specific client
router.post('/contacts/client/:clientName', authMiddleware, contactsController.addContactToClient);
router.put('/contacts/clients/:clientName', authMiddleware, contactsController.updateClientContact);


module.exports = router;