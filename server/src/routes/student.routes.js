// server/src/routes/student.routes.js

const router = require("express").Router();
const ctrl = require("../controllers/student.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, ctrl.createStudent);
router.get("/", authMiddleware, ctrl.getAll);
router.get("/:id", authMiddleware, ctrl.getById);
router.patch("/:id", authMiddleware, ctrl.update);

module.exports = router;
