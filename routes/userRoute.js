const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const userController = require('../controllers/userController');

// GET /api/user - get current authenticated user
router.get('/user', authMiddleware, userController.getCurrentUser);

// GET /api/users - get all users in tenant
router.get('/users', authMiddleware, userController.getAllUsers);

// GET /api/user/:id - get single user by ID
router.get('/user/:id', authMiddleware, userController.getUserById);

// GET /api/profile?email=... - get user by email
router.get('/profile', authMiddleware, userController.getUserByEmail);

// POST /api/user-management - create user (superadmin only)
router.post('/user-management', authMiddleware, checkRole(['superadmin']), userController.superAdminCreateUser);

// POST /api/users/onboard-superadmin - first superadmin setup (no auth)
router.post('/users/onboard-superadmin', userController.onboardSuperAdmin);

// POST /api/admin/user-password - admin: update any user's password
router.post('/admin/user-password', authMiddleware, checkRole(['superadmin', 'admin']), userController.updatePassword);

// POST /api/user/password - update own password
router.post('/user/password', authMiddleware, userController.updateUserPassword);

// POST /api/users/toggle-status - toggle user active/inactive (admin only)
router.post('/users/toggle-status', authMiddleware, checkRole(['superadmin', 'admin']), userController.toggleUserStatus);

// PUT /api/user/:id - update user
router.put('/user/:id', authMiddleware, userController.updateUser);

// DELETE /api/admin/user - hard delete (admin only)
router.delete('/admin/user', authMiddleware, checkRole(['superadmin', 'admin']), userController.deleteUser);

// DELETE /api/user - deactivate own account
router.delete('/user', authMiddleware, userController.deactivateUser);

module.exports = router;
