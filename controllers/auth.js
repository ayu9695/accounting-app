const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/Users'); // adjust path

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login request received");
    try{
        const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ message: 'Invalid email' });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password' });
    const payload = {
      userId: user._id,
      tenantId: user.tenantId,
      role: user.role
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.cookie('token', token, {
      httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ message: 'Login successful', user: { email: user.email, role: user.role, name: user.name } });
    } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};