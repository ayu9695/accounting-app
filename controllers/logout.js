const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/Users'); // adjust path

exports.logout = (req, res) => {
  res.clearCookie("token"); // name of your httpOnly cookie
  res.status(200).json({ message: "Logged out successfully" });
};
