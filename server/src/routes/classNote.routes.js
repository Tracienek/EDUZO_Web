// server/src/routes/classNote.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/classNote.controller");

// Mount: /v1/api/class-notes

// GET /v1/api/class-notes/:id  (id = classId)
router.get("/:id", auth, ctrl.listByClass);

// POST /v1/api/class-notes/:id
router.post("/:id", auth, ctrl.create);

module.exports = router;
