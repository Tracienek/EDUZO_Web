const router = require("express").Router();

const auth = require("../../middlewares/auth.middleware");
const ctrl = require("../../controllers/classNote.controller");

// GET /v1/api/class-notes/:id
// Get all class notes (id = classId)
router.get("/:id", auth, ctrl.listByClass);

// POST /v1/api/class-notes/:id
// Create a new class note
router.post("/:id", auth, ctrl.create);

// PATCH /v1/api/class-notes/:id/:noteId
// Edit an existing class note
router.patch("/:id/:noteId", auth, ctrl.update);

module.exports = router;
