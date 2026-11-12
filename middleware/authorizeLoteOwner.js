const mongoose = require("mongoose");
const User = require("../models/User");
const Lote = require("../models/Lote");

const authorizeLoteOwner = async (req, res, next) => {
  try {
    // Obtener el usuario actual desde MongoDB
    const usuario = await User.findById(req.user.id)
      .select("role id_productor");

    if (!usuario) {
      return res.status(401).json({
        error: "Usuario no encontrado"
      });
    }

    // Administradores y técnicos pueden consultar
    // cualquier lote.
    if (["admin", "tecnico"].includes(usuario.role)) {
      return next();
    }

    // Solo queda permitido el rol productor
    if (usuario.role !== "productor" || !usuario.id_productor) {
      return res.status(403).json({
        error: "Acceso no permitido"
      });
    }

    // Validar el identificador recibido en la URL
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        error: "ID de lote no válido"
      });
    }

    // Buscar un lote que pertenezca al productor
    const lote = await Lote.findOne({
      _id: req.params.id,
      id_productor: usuario.id_productor
    });

    if (!lote) {
      return res.status(404).json({
        error: "Lote no encontrado"
      });
    }

    // El productor es propietario: permitir acceso
    return next();

  } catch (error) {
    console.error("Error al verificar lote:", error.message);

    return res.status(500).json({
      error: "Error al verificar permisos del lote"
    });
  }
};

module.exports = authorizeLoteOwner;
