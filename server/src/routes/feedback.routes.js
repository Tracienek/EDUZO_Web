// server/src/routes/feedback.routes.js

const router = require("express").Router();
const feedback = require("../controllers/feedback.controller");
const auth = require("../middlewares/auth.middleware");

// public
router.get("/public/:classId", feedback.getPublicMeta);
router.post("/public/:classId", feedback.postPublic);

// admin/teacher
router.get("/teacher/:teacherId", auth, feedback.getByTeacher);

module.exports = router;
