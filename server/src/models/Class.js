const mongoose = require("mongoose");

const ScheduleSlotSchema = new mongoose.Schema(
    {
        day: { type: String, trim: true, default: "" },
        time: { type: String, trim: true, default: "" },
    },
    { _id: false },
);

const ClassSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, default: "" },
        subject: { type: String, trim: true, default: "" },

        // legacy / display field
        scheduleText: { type: String, trim: true, default: "" },

        // new structured field
        scheduleSlots: {
            type: [ScheduleSlotSchema],
            default: [],
        },

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

        heldCount: { type: Number, default: 0, min: 0 },

        durationMinutes: parsedDuration,
        totalSessions: Math.max(1, parsedTotalSessions),

        tuitionMilestoneNotifiedAt: { type: Date, default: null },
        tuitionEmailSentAt: { type: Date, default: null },
        tuitionCycleStartHeldCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true },
);

module.exports = mongoose.models.Class || mongoose.model("Class", ClassSchema);
