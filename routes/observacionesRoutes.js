const express = require("express");
const router = express.Router();
const controller = require("../controllers/observacionesController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", authorize("admin", "tecnico"), controller.update);
router.post("/", authorize("admin", "tecnico"), controller.create);
router.delete("/:id", authorize("admin", "tecnico"), controller.delete);

module.exports = router;
