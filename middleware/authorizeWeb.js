const authorizeWeb = (...rolesPermitidos) => {
  return (req, res, next) => {

    // Verificar que exista un usuario autenticado
    if (!req.user) {
      return res.redirect("/login");
    }

    // Verificar si su rol tiene permiso
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).send(
        "Acceso denegado. No tienes permisos para esta sección."
      );
    }

    // Si tiene permiso, continuar
    next();
  };
};

module.exports = authorizeWeb;
