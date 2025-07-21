const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth'); // ✅ correct

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
