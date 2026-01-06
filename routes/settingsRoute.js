const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// GET /api/settings
router.get('/settings', authMiddleware, settingsController.getSettings);
router.post('/settings', authMiddleware, settingsController.createSettings);
router.put('/settings', authMiddleware, settingsController.updateSettings);

// Special endpoint for onboarding initial settings (NO AUTH REQUIRED)
router.post('/settings/onboard', settingsController.onboardSettings);

module.exports = router;
