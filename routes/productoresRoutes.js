const express = require("express");
const router = express.Router();

const controller = require("../controllers/productoresController");

const {
  authenticate,
  authorize
} = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(authenticate);

// CONSULTAR TODOS LOS PRODUCTORES
router.get("/", authorize("admin", "tecnico"), controller.getAll);

// CONSULTAR UN PRODUCTOR POR ID
router.get("/:id", authorize("admin", "tecnico"), controller.getById);

// CREAR PRODUCTOR
router.post("/", authorize("admin"), controller.create);

// MODIFICAR PRODUCTOR
router.put("/:id", authorize("admin"), controller.update);

// ELIMINAR PRODUCTOR
router.delete("/:id", authorize("admin"), controller.delete);

module.exports = router;
