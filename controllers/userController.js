const User = require('../models/Users');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

const USER_UPDATABLE_FIELDS = ['name', 'phone', 'address', 'avatar', 'country'];

// GET /api/users - fetch all users in tenant
exports.getAllUsers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const users = await User.find({
      tenantId,
      status: 'active'
    }).sort({ name: 1 });
    return res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Server error fetching users' });
  }
};

// GET /api/user/:id - fetch single user by ID
exports.getUserById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findOne({ _id: userId, tenantId }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error fetching user' });
  }
};

// GET /api/user - fetch current authenticated user's profile
exports.getCurrentUser = async (req, res) => {
  try {
    logger.debug('[GET /user] Request received', { tenantId: req.user?.tenantId, userId: req.user?.userId });

    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID missing in token' });
    }

    const user = await User.findOne({ _id: userId, tenantId }).select('-password');

    if (!user) {
      logger.debug('[GET /user] User not found', { userId, tenantId });
      return res.status(404).json({ error: 'User not found' });
    }

    logger.debug('[GET /user] User found', { _id: user._id, email: user.email, role: user.role });

    return res.json(user);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
};

// GET /api/profile?email=... - fetch single user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }
    const user = await User.findOne({ email: userEmail, tenantId }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error fetching user' });
  }
};

// POST /api/user-management - create user (superadmin only)
exports.superAdminCreateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const userData = {
      ...req.body,
      tenantId,
      createdBy
    };

    const existingUser = await User.findOne({ email: userData.email, tenantId });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });

    const user = new User(userData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json(userResponse);
  } catch (error) {
    logger.error('Error creating user:', error);
    return res.status(500).json({ error: 'Server error creating user' });
  }
};

// POST /api/admin/user-password - admin-only: update any user's password
exports.updatePassword = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' });
    }

    const user = await User.findOne({ email, tenantId }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword;

    user.updateHistory.push({
      attribute: 'password',
      oldValue: '***',
      newValue: '***',
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error updating password:', error);
    return res.status(500).json({ error: 'Server error updating password' });
  }
};

// POST /api/user/password - update own password
exports.updateUserPassword = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { userId, email, newPassword, oldPassword } = req.body;

    if (!email || !newPassword || !oldPassword) {
      return res.status(400).json({ error: 'Email, oldPassword, and newPassword are required' });
    }

    const user = await User.findOne({ _id: userId, tenantId }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match. If it persists, contact administrator' });
    }

    user.password = newPassword;

    user.updateHistory.push({
      attribute: 'password',
      oldValue: '***',
      newValue: '***',
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error updating password:', error);
    return res.status(500).json({ error: 'Server error updating password' });
  }
};

// POST /api/users/toggle-status - toggle user active/inactive (admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.debug('[toggleUserStatus] Updated', { userId, isActive: user.isActive });

    return res.status(200).json({ message: 'User status updated', isActive: user.isActive });
  } catch (err) {
    logger.error('Error toggling user status:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/user/:id - update user (allowlisted fields only)
exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.params.id;

    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    logger.debug('[updateUser] Updating user:', user.name);

    const updates = req.body;
    const updateHistory = [];

    USER_UPDATABLE_FIELDS.forEach((key) => {
      if (updates[key] !== undefined && user[key] !== updates[key]) {
        updateHistory.push({
          attribute: key,
          oldValue: user[key],
          newValue: updates[key],
          updatedAt: new Date(),
          updatedBy: req.user.userId
        });
        user[key] = updates[key];
      }
    });

    if (updateHistory.length > 0) {
      user.updateHistory.push(...updateHistory);
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json(userResponse);
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ error: 'Server error updating user' });
  }
};

// DELETE /api/admin/user - hard delete (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userEmail = req.body.email;
    const user = await User.findOneAndDelete({ email: userEmail, tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Server error deleting user' });
  }
};

// DELETE /api/user - deactivate own account
exports.deactivateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.body.userId;
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      { isActive: false, status: 'deactivated' },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    logger.debug('[deactivateUser] Deactivated user:', user.name);
    return res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    logger.error('Error deactivating user:', error);
    return res.status(500).json({ error: 'Server error deactivating user' });
  }
};

/**
 * POST /api/users/onboard-superadmin
 * Creates the first superadmin for a new tenant. No auth required.
 */
exports.onboardSuperAdmin = async (req, res) => {
  try {
    const { tenantId, email, name, password, code, phone, address } = req.body;

    if (!tenantId || !email || !name || !password) {
      return res.status(400).json({
        error: 'tenantId, email, name, and password are required'
      });
    }

    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const existingUsers = await User.find({ tenantId });
    if (existingUsers.length > 0) {
      return res.status(403).json({
        error: 'Tenant already has users. Use regular user creation endpoint with authentication.'
      });
    }

    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists for this tenant' });
    }

    const userData = {
      tenantId,
      email,
      name,
      password,
      role: 'superadmin',
      isActive: true,
      status: 'active',
      code: code || null,
      phone: phone || null,
      address: address || null
    };

    const user = new User(userData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      message: 'Superadmin created successfully',
      user: userResponse
    });
  } catch (error) {
    logger.error('Error onboarding superadmin:', error);
    return res.status(500).json({ error: 'Server error creating superadmin', details: error.message });
  }
};
