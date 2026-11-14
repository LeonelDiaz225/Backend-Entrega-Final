const express = require("express");
const router = express.Router();
const controller = require("../controllers/observacionesController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// CONSULTAR OBSERVACIONES
router.get("/", authorize("admin", "tecnico"), controller.getAll);

// CONSULTAR OBSERVACIONES POR ID
router.get("/:id", authorize("admin", "tecnico"), controller.getById);

// MODIFICAR OBSERVACIONES
router.put("/:id", authorize("admin", "tecnico"), controller.update);

// CREAR OBSERVACIONES
router.post("/", authorize("admin", "tecnico"), controller.create);

// ELIMINAR OBSERVACIONES
router.delete("/:id", authorize("admin", "tecnico"), controller.delete);

module.exports = router;
