// attendance.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const attendanceController = require("../controllers/attendance.controller");

// PATCH /attendance/:id/bulk
router.patch("/:id/bulk", auth, attendanceController.bulkSaveAttendance);

// GET /attendance/:id?dates=...
router.get("/:id", auth, attendanceController.getByDates);

// GET /attendance/:id/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/:id/range", auth, attendanceController.getByRange);

module.exports = router;
