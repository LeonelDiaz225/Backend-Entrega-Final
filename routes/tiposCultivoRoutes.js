const express = require("express");
const router = express.Router();
const controller = require("../controllers/tiposCultivoController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/", authorize("admin", "tecnico"), controller.getAll);

router.get("/:id", authorize("admin", "tecnico"), controller.getById);

router.post("/", authorize("admin", "tecnico"), controller.create);

router.put("/:id", authorize("admin", "tecnico"), controller.update);

router.delete("/:id", authorize("admin"), controller.delete);

module.exports = router;
