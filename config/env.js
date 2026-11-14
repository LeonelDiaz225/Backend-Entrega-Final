const path = require("path");
const dotenv = require("dotenv");

const isProduction = process.env.NODE_ENV === "production";
const envFile = isProduction ? "prod.env" : ".env";

dotenv.config({
  path: path.join(__dirname, "..", envFile),
  quiet: true,
});

if (isProduction && !process.env.MONGO_URI) {
  throw new Error("MONGO_URI debe estar configurado");
}

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET debe estar configurado");
}

module.exports = { envFile };