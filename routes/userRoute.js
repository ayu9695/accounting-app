const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const userController = require('../controllers/userController');

// GET /api/user
router.get('/users', authMiddleware, userController.getAllUsers);

// Get single user by ID
router.get('/user/', authMiddleware, userController.getUserById);
router.get('/profile', authMiddleware, userController.getUserByEmail);

// Create a user
router.post('/user', authMiddleware, userController.createUser);
router.post('/user-management', authMiddleware, checkRole(['superadmin']), userController.superAdminCreateUser);


//Update password
router.post('/admin/user-password', authMiddleware, userController.updatePassword);
router.post('/user/password', authMiddleware, userController.updateUserPassword);

router.post('/users/toggle-status', userController.toggleUserStatus);


// Update user by ID
router.put('/user', authMiddleware, userController.updateUser);

// Delete user by ID
router.delete('/admin/user', authMiddleware, userController.deleteUser);
router.delete('/user', authMiddleware, userController.deactivateUser);

module.exports = router;

module.exports = router;
