const app = require("./app");
const connectDB = require("./config/db");

let connection;

module.exports = async (req, res) => {
  if (!connection) {
    connection = connectDB().catch((error) => {
      connection = null;
      throw error;
    });
  }

  await connection;
  return app(req, res);
};