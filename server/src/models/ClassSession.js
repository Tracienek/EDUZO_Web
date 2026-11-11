// server/src/models/ClassSession.js
const mongoose = require("mongoose");

const ClassSessionSchema = new mongoose.Schema(
    {
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true,
        },
        dateKey: {
            type: String,
            required: true,
            index: true,
        },
        held: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

ClassSessionSchema.index({ classId: 1, dateKey: 1 }, { unique: true });

module.exports =
    mongoose.models.ClassSession ||
    mongoose.model("ClassSession", ClassSessionSchema);
