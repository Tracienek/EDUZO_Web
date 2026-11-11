// controllers/center.controller.js
const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.createTeacher = async (req, res) => {
    try {
        const centerId = req.user.userId;
        const { email, fullName, password } = req.body;

        if (!email || !fullName || !password) {
            return res.status(400).json({
                message: "Email, fullName and password are required",
            });
        }

        const pw = String(password).trim();
        if (pw.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters",
            });
        }

        const center = await User.findById(centerId).lean();
        if (!center || center.role !== "center") {
            return res
                .status(403)
                .json({ message: "Only center can create teacher" });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existed = await User.findOne({ email: normalizedEmail }).lean();
        if (existed) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const passwordHash = await bcrypt.hash(pw, 10);

        const teacher = await User.create({
            email: normalizedEmail,
            fullName: String(fullName).trim(),
            role: "teacher",
            centerId: centerId,
            passwordHash,
            mustChangePassword: true,
        });

        return res.status(201).json({
            metadata: {
                teacher: {
                    _id: teacher._id,
                    email: teacher.email,
                    fullName: teacher.fullName,
                    role: teacher.role,
                    centerId: teacher.centerId,
                    mustChangePassword: teacher.mustChangePassword,
                },
            },
        });
    } catch (err) {
        console.error("createTeacher error:", err);
        return res.status(500).json({ message: "Create teacher failed" });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        const centerId = req.user.userId;
        const center = await User.findById(centerId).lean();
        if (!center || center.role !== "center") {
            return res
                .status(403)
                .json({ message: "Only center can view teachers" });
        }

        const teachers = await User.find({ role: "teacher", centerId })
            .select(
                "_id email fullName role mustChangePassword createdAt avatar gender languageOrSpeciality dob",
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ metadata: { teachers } });
    } catch (err) {
        console.error("getTeachers error:", err);
        return res.status(500).json({ message: "Get teachers failed" });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const centerId = req.user.userId;
        const { id } = req.params;

        // check center
        const center = await User.findById(centerId).lean();
        if (!center || center.role !== "center") {
            return res
                .status(403)
                .json({ message: "Only center can delete teacher" });
        }

        // find teacher
        const teacher = await User.findById(id).lean();
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // ensure it's a teacher
        if (teacher.role !== "teacher") {
            return res.status(400).json({ message: "User is not a teacher" });
        }

        // ensure teacher belongs to this center
        if (String(teacher.centerId) !== String(centerId)) {
            return res
                .status(403)
                .json({ message: "You can only delete your teachers" });
        }

        await User.findByIdAndDelete(id);

        return res.json({ message: "Teacher deleted successfully" });
    } catch (err) {
        console.error("deleteTeacher error:", err);
        return res.status(500).json({ message: "Delete teacher failed" });
    }
};
