const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authorization.slice(7).trim();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Permisos insuficientes" });
  }

  return next();
};

module.exports = { authenticate, authorize };
