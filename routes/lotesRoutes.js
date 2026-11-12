const express = require("express");
const router = express.Router();
const controller = require("../controllers/lotesController");
const authorizeLoteOwner = require("../middleware/authorizeLoteOwner");

const {
  authenticate,
  authorize
} = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(authenticate);

// CONSULTAR LOTES
router.get("/", controller.getAll);

// CONSULTAR UN LOTE
router.get("/:id", authorizeLoteOwner, controller.getById);

// CONSULTAR HISTORIAL DE OBSERVACIONES
router.get("/:id/observaciones", authorizeLoteOwner, controller.getHistorial);

// CREAR LOTE
router.post("/", authorize("admin", "tecnico"), controller.create);

// MODIFICAR LOTE
router.put("/:id", authorize("admin", "tecnico"), controller.update);

// ELIMINAR LOTE
router.delete("/:id", authorize("admin", "tecnico"), controller.delete);

module.exports = router;

