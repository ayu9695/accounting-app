
const checkRole = (allowedRoles) => (req, res, next) => {
    console.log("user id: ", req.user.userId ," role of user :", req.user.role, " allowed role: ", allowedRoles);
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    console.warn(`Access denied for role: ${req.user ? req.user.role : 'unknown'}`);
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  console.log("Authenticated user:", req.user, " role of current user: ", req.role);
  next();
};

module.exports = checkRole;