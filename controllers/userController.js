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

// GET /api/users/:id - fetch single user
exports.getUserById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId, tenantId }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error fetching user' });
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

exports.updatePassword = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' });
    }

    const user = await User.findOne({ email, tenantId }).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(oldPassword, salt);
    console.log("old password: ",oldPassword, " Hashed old password: ", hashedPassword);

    const oldPasswordHash = user.password; // for update history if needed
    console.log("DB old password: ",oldPasswordHash);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if(!isMatch) {
      return res.status(400).json({ error: 'Current password does not match. If it persists, contact administrator' });
    }

    console.log("Updating password start");
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
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

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