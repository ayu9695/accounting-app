const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const controller = require('../controllers/departmentController');

router.get('/departments', authMiddleware, controller.getAllDepartments);
router.post('/departments', authMiddleware, controller.createDepartment);

router.put('/departments/:id', authMiddleware, controller.updateDepartment);

router.delete('/departments/:id', authMiddleware, controller.deleteDepartment);

module.exports = router;
