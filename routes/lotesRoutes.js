const express = require("express");
const router = express.Router();
const controller = require("../controllers/lotesController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.get("/:id/observaciones", controller.getHistorial);
router.post("/", authorize("admin", "tecnico"), controller.create);
router.put("/:id", authorize("admin", "tecnico"), controller.update);
router.delete("/:id", authorize("admin"), controller.delete);

module.exports = router;
