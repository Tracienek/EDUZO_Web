// server/src/controllers/user.controller.js
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

// GET /user/me
exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).lean();
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({
            metadata: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    centerId: user.centerId || null,

                    gender: user.gender || "",
                    languageOrSpeciality: user.languageOrSpeciality || "",
                    avatar: user.avatar || "",
                    dob: user.dob ? user.dob.toISOString().slice(0, 10) : "",

                    mustChangePassword: user.mustChangePassword || false,
                },
            },
        });
    } catch (err) {
        console.error("me error:", err);
        return res.status(500).json({ message: "Get me failed" });
    }
};

// PATCH /user/me
exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fullName, gender, languageOrSpeciality, dob } = req.body;

        if (!fullName || !String(fullName).trim()) {
            return res.status(400).json({ message: "fullName is required" });
        }

        const allowedGender = new Set(["", "male", "female", "other"]);
        const g = String(gender || "")
            .toLowerCase()
            .trim();
        if (!allowedGender.has(g)) {
            return res.status(400).json({ message: "Invalid gender" });
        }

        // ✅ DOB: accept "", null, undefined => clear DOB
        // accept "YYYY-MM-DD" => store as Date safely (no timezone shift issues for date input)
        let dobValue = null;
        if (dob != null && String(dob).trim() !== "") {
            const s = String(dob).trim();

            // enforce date input format
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) {
                return res
                    .status(400)
                    .json({ message: "Invalid DOB format (YYYY-MM-DD)" });
            }

            const yyyy = Number(m[1]);
            const mm = Number(m[2]);
            const dd = Number(m[3]);

            // create UTC date to avoid timezone shifting
            const d = new Date(Date.UTC(yyyy, mm - 1, dd));
            if (Number.isNaN(d.getTime())) {
                return res.status(400).json({ message: "Invalid DOB" });
            }

            // quick sanity check (month/day overflow)
            if (
                d.getUTCFullYear() !== yyyy ||
                d.getUTCMonth() !== mm - 1 ||
                d.getUTCDate() !== dd
            ) {
                return res.status(400).json({ message: "Invalid DOB" });
            }

            dobValue = d;
        }

        const update = {
            fullName: String(fullName).trim(),
            gender: g,
            languageOrSpeciality: String(languageOrSpeciality || "").trim(),
            dob: dobValue, // ✅ add
        };

        const user = await User.findByIdAndUpdate(userId, update, {
            new: true,
            lean: true,
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({
            metadata: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    centerId: user.centerId || null,
                    gender: user.gender || "",
                    languageOrSpeciality: user.languageOrSpeciality || "",
                    avatar: user.avatar || "",
                    dob: user.dob
                        ? new Date(user.dob).toISOString().slice(0, 10)
                        : "", // ✅ return YYYY-MM-DD
                    mustChangePassword: user.mustChangePassword || false,
                },
            },
        });
    } catch (err) {
        console.error("updateMe error:", err);
        return res.status(500).json({ message: "Update profile failed" });
    }
};

// PATCH /user/me/avatar
exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ message: "Avatar file is required" });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        const prev = await User.findById(userId).lean();
        if (!prev) return res.status(404).json({ message: "User not found" });

        // delete old local avatar
        if (prev.avatar && String(prev.avatar).startsWith("/uploads/")) {
            const oldPath = path.join(process.cwd(), prev.avatar);
            fs.unlink(oldPath, () => {});
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarUrl },
            { new: true, lean: true },
        );

        return res.json({
            metadata: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    centerId: user.centerId || null,
                    gender: user.gender || "",
                    languageOrSpeciality: user.languageOrSpeciality || "",
                    avatar: user.avatar || "",
                    mustChangePassword: user.mustChangePassword || false,
                },
            },
        });
    } catch (err) {
        console.error("updateAvatar error:", err);
        return res
            .status(500)
            .json({ message: err?.message || "Update avatar failed" });
    }
};

// POST /user/change-password   (or /auth/change-password if you prefer)
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;

        // ✅ match FE payload
        const currentPassword =
            req.body.currentPassword ?? req.body.oldPassword;
        const newPassword = req.body.newPassword;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "currentPassword and newPassword are required",
            });
        }

        if (String(newPassword).trim().length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters" });
        }

        const user = await User.findById(userId).select("+passwordHash");
        if (!user) return res.status(404).json({ message: "User not found" });

        const ok = await bcrypt.compare(
            String(currentPassword),
            user.passwordHash,
        );
        if (!ok)
            return res
                .status(401)
                .json({ message: "Current password is incorrect" });

        user.passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);
        user.mustChangePassword = false;
        await user.save();

        return res.json({ metadata: { success: true } });
    } catch (err) {
        console.error("changePassword error:", err);
        return res.status(500).json({ message: "Change password failed" });
    }
};
