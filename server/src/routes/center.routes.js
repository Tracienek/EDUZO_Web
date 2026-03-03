// routes/center.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/center.controller");
const attendanceController = require("../controllers/attendance.controller");

router.get("/teachers", auth, ctrl.getTeachers);
router.post("/teachers", auth, ctrl.createTeacher);
router.delete("/teachers/:id", auth, ctrl.deleteTeacher);
router.get(
    "/teachers/:id/attendance-logs",
    auth,
    attendanceController.getTeacherAttendanceLogs,
);

router.delete(
    "/teachers/:id/attendance-logs",
    auth,
    attendanceController.clearTeacherAttendanceLogs,
);

module.exports = router;
