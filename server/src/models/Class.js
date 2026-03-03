// server/src/models/Class.js
const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, default: "" },
        subject: { type: String, trim: true, default: "" },
        scheduleText: { type: String, trim: true, default: "" },

        students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],

        centerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
            default: null,
        },

        isActive: { type: Boolean, default: true, index: true },

        isOnline: { type: Boolean, default: false, index: true },
        onlineUntil: { type: Date, default: null, index: true },

        totalSessions: { type: Number, default: 12, min: 1 },

        heldCount: { type: Number, default: 0, min: 0 },

        durationMinutes: { type: Number, default: 90, min: 1 },

        tuitionMilestoneNotifiedAt: { type: Date, default: null },
        tuitionEmailSentAt: { type: Date, default: null },
        tuitionCycleStartHeldCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true },
);

module.exports = mongoose.models.Class || mongoose.model("Class", ClassSchema);
