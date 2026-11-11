// server/src/models/Attendance.js
const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
    {
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },
        dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD
        attendance: { type: Boolean, default: false },
        homework: { type: Boolean, default: false },
        tuition: { type: Boolean, default: false },
    },
    { timestamps: true },
);

AttendanceSchema.index(
    { classId: 1, studentId: 1, dateKey: 1 },
    { unique: true },
);

module.exports =
    mongoose.models.Attendance ||
    mongoose.model("Attendance", AttendanceSchema);
