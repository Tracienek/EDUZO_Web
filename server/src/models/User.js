// server/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullName: { type: String, required: true, trim: true },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },

        role: { type: String, enum: ["center", "teacher"], default: "center" },

        centerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        gender: { type: String, default: "" },
        languageOrSpeciality: { type: String, default: "" },
        avatar: { type: String, default: "" },
        dob: { type: Date, default: null },

        mustChangePassword: { type: Boolean, default: false },
    },
    { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
