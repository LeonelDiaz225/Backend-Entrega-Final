const express = require("express");
const router = express.Router();
const controller = require("../controllers/tecnicosController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// CONSULTAR TECNICOS
router.get("/", authorize("admin", "tecnico"), controller.getAll);

// CONSULTAR UN TECNICO POR ID
router.get("/:id", authorize("admin", "tecnico"), controller.getById);

// CREAR TECNICO
router.post("/", authorize("admin"), controller.create);

// MODIFICAR TECNICO
router.put("/:id", authorize("admin"), controller.update);

// ELIMINAR TECNICO
router.delete("/:id", authorize("admin"), controller.delete);

module.exports = router;
