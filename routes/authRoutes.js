const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

const {
  authenticate,
  authorize
} = require("../middleware/auth");

// Iniciar sesión: acceso público
router.post("/login", authController.login);

// Registrar usuarios: solo administradores
router.post(
  "/register",
  authenticate,
  authorize("admin"),
  authController.register
);

module.exports = router;
