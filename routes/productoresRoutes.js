const express = require("express");
const router = express.Router();
const controller = require("../controllers/productoresController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", authorize("admin"), controller.create);
router.put("/:id", authorize("admin"), controller.update);
router.delete("/:id", authorize("admin"), controller.delete);

module.exports = router;
