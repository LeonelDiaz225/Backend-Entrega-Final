const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateWeb = async (req, res, next) => {

  // 1. Obtener las cookies del navegador
  const cookies = req.headers.cookie || "";

  const tokenCookie = cookies
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith("agrotec_token="));

  if (!tokenCookie) {
    return res.redirect("/login");
  }

  const token = tokenCookie.substring("agrotec_token=".length);

  // 2. Verificar el JWT
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.redirect("/login");
  }

  // 3. Consultar el usuario actual en MongoDB
  try {
    const usuario = await User.findById(decoded.id)
      .select("username role id_productor");

    if (!usuario) {
      return res.redirect("/login");
    }

    // 4. Guardar los datos actuales en la petición
    req.user = {
      id: usuario._id.toString(),
      username: usuario.username,
      role: usuario.role,
      id_productor: usuario.id_productor
    };

    // 5. Hacer los datos disponibles para Pug
    res.locals.usuarioActual = {
      id: usuario._id.toString(),
      username: usuario.username,
      role: usuario.role
    };

    return next();

  } catch (error) {
    console.error(
      "Error al verificar sesión web:",
      error.message
    );

    return res.status(500).send(
      "Error al verificar la sesión"
    );
  }
};

module.exports = authenticateWeb;
