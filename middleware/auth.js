// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.sendStatus(401);

//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.sendStatus(403);
//   }
// };
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  
  // console.log("🔐 [GET /api/me] Request received");
  // console.log("Headers:", req.headers);
  // console.log("Cookies:", req.cookies);
  // console.log("Authenticated user:", req.user);
  // console.log("Request method:", req.method);
  // console.log("Request URL:", req.originalUrl);
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
      console.error("JWT error:", err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware; // ✅ export the function directly

