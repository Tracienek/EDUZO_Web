// server/src/models/ClassNote.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ClassNoteSchema = new Schema(
    {
        classId: {
            type: Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true,
        },

        content: { type: String, required: true, trim: true },

        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fromRole: { type: String, enum: ["teacher", "center"], required: true },
        toRole: { type: String, enum: ["teacher", "center"], required: true },

        centerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    },
    { timestamps: true }, // createdAt, updatedAt
);

ClassNoteSchema.index({ classId: 1, createdAt: -1 });

module.exports = mongoose.model("ClassNote", ClassNoteSchema);
