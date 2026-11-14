const express = require("express");
const router = express.Router();
const controller = require("../controllers/tiposCultivoController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// CONSULTAR TIPOS DE CULTIVO
router.get("/", authorize("admin", "tecnico"), controller.getAll);

// CONSULTAR UN TIPO DE CULTIVO POR ID
router.get("/:id", authorize("admin", "tecnico"), controller.getById);

// CREAR TIPO DE CULTIVO
router.post("/", authorize("admin", "tecnico"), controller.create);

// MODIFICAR TIPO DE CULTIVO
router.put("/:id", authorize("admin", "tecnico"), controller.update);

// ELIMINAR TIPO DE CULTIVO
router.delete("/:id", authorize("admin"), controller.delete);

module.exports = router;
