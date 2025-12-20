const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// GET /api/settings
router.get('/settings', authMiddleware, settingsController.getSettings);
router.post('/settings', authMiddleware, settingsController.createSettings);
router.put('/settings', authMiddleware, settingsController.updateSettings);

module.exports = router;
