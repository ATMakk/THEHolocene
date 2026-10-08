/**
 * Usage: roleCheck("admin", "operator")
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user || req.admin;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).send({ message: "Forbidden resource" });
    }
    next();
  };
};

module.exports = roleCheck;