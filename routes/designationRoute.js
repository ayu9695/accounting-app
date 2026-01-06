const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const controller = require('../controllers/designationController'); // same file for both

router.get('/designations', authMiddleware, controller.getAllDesignations);
router.post('/designations', authMiddleware, controller.createDesignation);
router.delete('/designations/:id', authMiddleware, controller.deleteDesignation);

module.exports = router;
