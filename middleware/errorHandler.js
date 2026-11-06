const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Error de validación",
      detalles: Object.values(error.errors).map(({ message }) => message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ error: "Identificador inválido" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: "El recurso ya existe" });
  }

  return res.status(500).json({ error: "Error interno del servidor" });
};

module.exports = errorHandler;
