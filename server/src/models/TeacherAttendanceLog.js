// server/src/models/TeacherAttendanceLog.js
const mongoose = require("mongoose");

const TeacherAttendanceLogSchema = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true,
        },
        classNameSnapshot: { type: String, default: "" },

        dateKey: { type: String, required: true, index: true },

        timeLabel: { type: String, default: "" },
    },
    { timestamps: true },
);

TeacherAttendanceLogSchema.index({ teacherId: 1, createdAt: -1 });

module.exports =
    mongoose.models.TeacherAttendanceLog ||
    mongoose.model("TeacherAttendanceLog", TeacherAttendanceLogSchema);
