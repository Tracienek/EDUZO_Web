// server/src/routes/student/index.js
const router = require("express").Router();

const ctrl = require("../../controllers/student.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/", authMiddleware, ctrl.createStudent);
router.get("/", authMiddleware, ctrl.getAll);
router.get("/:id", authMiddleware, ctrl.getById);
router.patch("/:id", authMiddleware, ctrl.update);
router.post("/:id/notes", authMiddleware, ctrl.createStudentNote);

router.get("/:id/profile", ctrl.getStudentProfile);
router.get("/:id/notes", ctrl.listStudentNotes);
router.post("/:id/notes", ctrl.createStudentNote);

module.exports = router;
