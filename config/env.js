const path = require("path");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV === "production" ? "prod.env" : ".env";
const result = dotenv.config({ path: path.join(__dirname, "..", envFile), quiet: true });

if (result.error && process.env.NODE_ENV === "production") {
  throw new Error(`No se pudo cargar ${envFile}: ${result.error.message}`);
}

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET debe estar configurado en producción");
}

module.exports = { envFile };
