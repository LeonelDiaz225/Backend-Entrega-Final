
const jwt = require("jsonwebtoken");

const authenticateWeb = (req, res, next) => {
  // Obtener las cookies enviadas por el navegador
  const cookies = req.headers.cookie || "";

  const tokenCookie = cookies
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith("agrotec_token="));

  // Si no existe la cookie, enviar al login
  if (!tokenCookie) {
    return res.redirect("/login");
  }

  const token = tokenCookie
    .slice("agrotec_token=".length);

  try {
    // Verificar que el JWT sea válido y no esté vencido
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Guardar los datos del usuario para usarlos
    // en las siguientes funciones
    req.user = decoded;

    next();

  } catch (error) {
    // Token inválido o expirado
    res.clearCookie("agrotec_token");
    return res.redirect("/login");
  }
};

module.exports = authenticateWeb;
