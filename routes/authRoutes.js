const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

const {
  authenticate,
  authorize
} = require("../middleware/auth");

// Iniciar sesión
router.post("/login", authController.login);

// Registrar usuarios
router.post(
  "/register",
  authenticate,
  authorize("admin"),
  authController.register
);

module.exports = router;
