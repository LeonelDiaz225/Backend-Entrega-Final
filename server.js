require("./config/env");

const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Servidor de AgroTec corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`No se pudo iniciar AgroTec: ${error.message}`);
    process.exitCode = 1;
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;
