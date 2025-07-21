const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const controller = require('../controllers/departmentController');

router.get('/departments', authMiddleware, controller.getAllDepartments);
router.post('/departments', authMiddleware, controller.createDepartment);

module.exports = router;
