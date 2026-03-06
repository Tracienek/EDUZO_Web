// server/src/routes/class/index.js

const router = require("express").Router();

const ctrl = require("../../controllers/class.controller");
const attendanceController = require("../../controllers/attendance.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const noteCtrl = require("../../controllers/classNote.controller");
const feedbackCtrl = require("../../controllers/feedback.controller");

router.use(authMiddleware);

router.get("/available", ctrl.getAvailable);
router.post("/", ctrl.createClass);

router.get("/:id", ctrl.getById);
router.patch("/:id", ctrl.updateClass);
router.patch("/:id/online", ctrl.setOnline);
router.post("/:id/online/ping", ctrl.pingOnline);
router.post("/:id/students", ctrl.addStudentToClass);
router.post("/:id/sessions/held", ctrl.markSessionHeld);

router.get("/:id/attendance/range", attendanceController.getByRange);
router.get("/:id/attendance", attendanceController.getByDates);
router.patch("/:id/attendance/bulk", attendanceController.bulkSaveAttendance);

router.delete("/:id", ctrl.deleteClass);
router.delete("/:id/students/:studentId", ctrl.removeStudentFromClass);

router.get("/:id/notes", noteCtrl.listByClass);
router.post("/:id/notes", noteCtrl.create);

router.get("/:id/sessions/summary", ctrl.getSessionSummary);
router.post("/:id/tuition/send", ctrl.sendTuitionEmails);

router.get("/:id/feedback", feedbackCtrl.getByClass);

module.exports = router;
