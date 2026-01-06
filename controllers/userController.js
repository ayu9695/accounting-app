// const User = require('../models/Users');

// exports.getUser = async (req, res) => {
//   try {
//     const tenantId = req.user.tenantId; // Set by your authMiddleware ✅

//         if (!tenantId) {
//       return res.status(400).json({ error: 'Tenant ID missing in token' });
//     }

//     // Fetch User for the authenticated tenant
//     const user = await User.findOne({ tenantId });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found for this tenant' });
//     }

//     return res.json(user);
//   } catch (error) {
//     console.error('Error fetching User:', error);
//     res.status(500).json({ error: 'Server error fetching User' });
//   }
// };

const User = require('../models/Users');
const bcrypt = require('bcrypt');

// GET /api/users - fetch all users in tenant
exports.getAllUsers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const users = await User.find({
      tenantId,
      status: 'active' // only fetch users that are not deactivated or deleted
    }).sort({ name: 1 });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
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
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error fetching user' });
  }
};

// GET /api/user - fetch current authenticated user's profile
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('🔍 [GET /user] Request received');
    console.log('📋 req.user:', JSON.stringify(req.user, null, 2));
    
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    console.log('🔑 Extracted tenantId:', tenantId);
    console.log('🔑 Extracted userId:', userId);
    
    if (!tenantId) {
      console.error('❌ Missing tenantId in req.user');
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }
    
    if (!userId) {
      console.error('❌ Missing userId in req.user');
      return res.status(400).json({ error: 'User ID missing in token' });
    }
    
    console.log('🔎 Searching for user with userId:', userId, 'and tenantId:', tenantId);
    
    const user = await User.findOne({ _id: userId, tenantId }).select('-password');
    
    if (!user) {
      console.error('❌ User not found with userId:', userId, 'tenantId:', tenantId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User found:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    return res.json(user);
  } catch (error) {
    console.error('❌ Error fetching current user:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
};

// GET /api/users/:email - fetch single user
exports.getUserByEmail = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userEmail = req.body.email;
    const user = await User.findOne({ email: userEmail, tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error fetching user' });
  }
};


// POST /api/users - create a user
exports.createUser = async (req, res) => {
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

    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Server error creating user' });
  }
};

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

    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Server error creating user' });
  }
};

// Admin-only endpoint to update any user's password
exports.updatePassword = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;
    
    // Only superadmin and admin can update passwords
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admins can update user passwords' });
    }

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' });
    }

    const user = await User.findOne({ email, tenantId }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldPasswordHash = user.password; // for update history if needed

    user.password = newPassword;

    user.updateHistory.push({
      attribute: 'password',
      oldValue: oldPasswordHash ? '***' : null,
      newValue: '***',
      updatedAt: new Date(),
      updatedBy: req.user.userId
    });

    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ error: 'Server error updating password' });
  }
};

exports.updateUserPassword = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const currentUserId = req.user.userId;
    const { userId, email, newPassword, oldPassword } = req.body;

    if (!email || !newPassword || !oldPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' });
    }

    const user = await User.findOne({ _id: userId, tenantId }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if(!isMatch) {
      return res.status(400).json({ error: 'Current password does not match. If it persists, contact administrator' });
    }

    const oldPasswordHash = user.password; // for update history if needed
    user.password = newPassword;

      user.updateHistory.push({
        attribute: 'password',
        oldValue: oldPasswordHash ? '***' : null,
        newValue: '***',
        updatedAt: new Date(),
        updatedBy: req.user.userId
      });

      await user.save();

      return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ error: 'Server error updating password' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Ensure user belongs to the same tenant
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ message: 'User status updated', isActive: user.isActive });
  } catch (err) {
    console.error('Error toggling user status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// PUT /api/users/:id - update user
exports.updateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.params.id;

    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log("User requested to update: ", user.name);

    const updates = req.body;
    const updateHistory = [];

    Object.keys(updates).forEach((key) => {
      if (user[key] !== updates[key]) {
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
    return res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Server error updating user' });
  }
};

// DELETE /api/users/:id - delete user
exports.deleteUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userEmail = req.body.email;
    const user = await User.findOneAndDelete({ email: userEmail, tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Server error deleting user' });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.body.userId;
    // const user = await User.findOne({ _id: userId, tenantId });
    const user = await User.findByIdAndUpdate({ _id: userId, tenantId }, { isActive: false, status: 'permanently_deleted' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log("Successfully deactivated user: ", user.name);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Server error deleting user' });
  }
};


exports.getUserPasswordHash = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { email } = req.params;

    const user = await User.findOne({ email, tenantId }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ hashedPassword: user.password });
  } catch (error) {
    console.error('Error fetching password hash:', error);
    return res.status(500).json({ error: 'Server error fetching password hash' });
  }
};

/**
 * POST /api/users/onboard-superadmin
 * Special endpoint for creating the FIRST superadmin user for a new tenant
 * NO AUTH REQUIRED - This is used during tenant onboarding
 * 
 * Body: {
 *   tenantId: ObjectId (required) - The tenant _id (not the numeric id)
 *   email: string (required)
 *   name: string (required)
 *   password: string (required)
 *   code?: number (optional)
 *   phone?: string (optional)
 *   address?: string (optional)
 * }
 */
exports.onboardSuperAdmin = async (req, res) => {
  try {
    const { tenantId, email, name, password, code, phone, address } = req.body;

    // Validation
    if (!tenantId || !email || !name || !password) {
      return res.status(400).json({ 
        error: 'tenantId, email, name, and password are required' 
      });
    }

    // Verify tenant exists
    const Tenant = require('../models/Tenant');
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if tenant already has any users
    const existingUsers = await User.find({ tenantId });
    if (existingUsers.length > 0) {
      return res.status(403).json({ 
        error: 'Tenant already has users. Use regular user creation endpoint with authentication.' 
      });
    }

    // Check if email already exists for this tenant
    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists for this tenant' });
    }

    // Create superadmin user
    const userData = {
      tenantId,
      email,
      name,
      password, // Will be hashed by pre-save hook
      role: 'superadmin',
      isActive: true,
      status: 'active',
      code: code || null,
      phone: phone || null,
      address: address || null
    };

    const user = new User(userData);
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({ 
      message: 'Superadmin created successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Error onboarding superadmin:', error);
    return res.status(500).json({ error: 'Server error creating superadmin', details: error.message });
  }
};