const router = require("express").Router();

const ctrl = require("../../controllers/student.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Student management
router.post("/", authMiddleware, ctrl.createStudent);
router.get("/", authMiddleware, ctrl.getAll);
router.get("/:id", authMiddleware, ctrl.getById);
router.patch("/:id", authMiddleware, ctrl.update);

// Student notes
router.post("/:id/notes", authMiddleware, ctrl.createStudentNote);

// Student profile
router.get("/:id/profile", authMiddleware, ctrl.getStudentProfile);
router.get("/:id/notes", authMiddleware, ctrl.listStudentNotes);

// Edit student note
router.patch("/:id/notes/:noteId", authMiddleware, ctrl.updateStudentNote);

module.exports = router;
