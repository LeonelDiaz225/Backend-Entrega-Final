
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.join(__dirname, "..", ".env")
});

const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const email = process.env.ADMIN_EMAIL;

    if (!username || !password || !email) {
      throw new Error("Faltan las credenciales del administrador en .env");
    }

    if (password.length < 12) {
      throw new Error("La contraseña debe tener al menos 12 caracteres");
    }

    await connectDB();

    const existingAdmin = await User.exists({ role: "admin" });

    if (existingAdmin) {
      console.log("Ya existe un administrador. No se creó otro.");
      return;
    }

    const existingUser = await User.exists({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      throw new Error("El nombre de usuario o correo ya está registrado");
    }

    await User.create({
      username,
      password,
      email,
      nombre: "Administrador",
      apellido: "AgroTec",
      role: "admin"
    });

    console.log("Administrador creado correctamente.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
