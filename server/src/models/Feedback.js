// server/src/models/Feedback.js

const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
        },
        className: { type: String, default: "" },

        // optional (because your Class does not store teacherId)
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        teacherName: { type: String, default: "" },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },
        studentName: { type: String, default: "" },

        rating: { type: Number, min: 1, max: 5, required: true },
        understand: { type: Number, min: 1, max: 5, default: 5 },
        teachingWay: { type: Number, min: 1, max: 5, default: 5 },

        // support both your FE variants
        message: { type: String, default: "" },
        comment: { type: String, default: "" },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
