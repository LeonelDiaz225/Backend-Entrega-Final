const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verificar autenticación
const authenticate = async (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token requerido"
    });
  }

  const token = authorization.slice(7).trim();

  // 1. Verificar firma y vencimiento del JWT
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido o expirado"
    });
  }

  // 2. Consultar el usuario actual
  try {
    const usuario = await User.findById(decoded.id)
      .select("username role id_productor");

    if (!usuario) {
      return res.status(401).json({
        error: "La cuenta ya no existe"
      });
    }

    // 3. Usar los datos actuales de MongoDB
    req.user = {
      id: usuario._id.toString(),
      username: usuario.username,
      role: usuario.role,
      id_productor: usuario.id_productor
    };

    return next();

  } catch (error) {
    console.error("Error de autenticación:", error.message);

    return res.status(500).json({
      error: "Error al verificar el usuario"
    });
  }
};

// Verificar permisos por rol
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      error: "Permisos insuficientes"
    });
  }

  return next();
};

module.exports = { authenticate, authorize };
