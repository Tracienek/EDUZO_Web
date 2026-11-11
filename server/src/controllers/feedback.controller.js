// server/src/controllers/feedback.controller.js
const mongoose = require("mongoose");
const Class = require("../models/Class");
const User = require("../models/User");
const Feedback = require("../models/Feedback");

// Public: load className + teachers list (by centerId)
exports.getPublicMeta = async (req, res) => {
    try {
        const classId = req.params.classId;
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid classId" });
        }

        const cls = await Class.findById(classId)
            .select("name centerId")
            .lean();
        if (!cls) return res.status(404).json({ message: "Class not found" });

        // teachers = users where role=teacher and centerId = class.centerId
        const teachers = await User.find({
            role: "teacher",
            centerId: cls.centerId,
        })
            .select("_id fullName")
            .sort({ fullName: 1 })
            .lean();

        return res.json({
            metadata: {
                classId,
                className: cls.name || "",
                teachers: teachers.map((t) => ({
                    id: t._id,
                    name: t.fullName || "Teacher",
                })),
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Public: submit feedback (no auth)
exports.postPublic = async (req, res) => {
    try {
        const classId = req.params.classId;
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid classId" });
        }

        const cls = await Class.findById(classId)
            .select("name centerId")
            .lean();
        if (!cls) return res.status(404).json({ message: "Class not found" });

        const rating = Number(req.body?.rating);
        if (!(rating >= 1 && rating <= 5)) {
            return res.status(400).json({ message: "rating must be 1..5" });
        }

        const teacherId = req.body?.teacherId;
        let teacherName = String(req.body?.teacherName || "").trim();

        // If teacherId provided, try to resolve name from DB (more trustworthy)
        if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
            const t = await User.findOne({
                _id: teacherId,
                role: "teacher",
                centerId: cls.centerId,
            })
                .select("fullName")
                .lean();
            if (t?.fullName) teacherName = t.fullName;
        }

        const studentName = String(req.body?.studentName || "").trim();
        const message = String(req.body?.message || "").trim();
        const comment = String(req.body?.comment || "").trim();

        if (!message && !comment) {
            return res
                .status(400)
                .json({ message: "Please write your feedback" });
        }

        const created = await Feedback.create({
            classId: cls._id,
            className: cls.name || "",

            teacherId: mongoose.Types.ObjectId.isValid(teacherId)
                ? teacherId
                : null,
            teacherName,

            studentId: mongoose.Types.ObjectId.isValid(req.body?.studentId)
                ? req.body.studentId
                : null,
            studentName,

            rating,
            understand: Number(req.body?.understand || 5),
            teachingWay: Number(req.body?.teachingWay || 5),

            message,
            comment,
        });

        return res.status(201).json({ metadata: { feedback: created } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Admin: list feedbacks for a class (auth required via your middleware)
exports.getByClass = async (req, res) => {
    try {
        const classId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid classId" });
        }

        const limit = Math.min(Number(req.query.limit || 50), 200);

        const list = await Feedback.find({ classId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({ metadata: { feedbacks: list } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Admin/Teacher: list feedbacks for a teacher
exports.getByTeacher = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;

        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ message: "Invalid teacherId" });
        }

        const viewerId = String(req.user?._id || "");
        if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

        const limit = Math.min(Number(req.query.limit || 50), 200);

        const [viewer, targetTeacher] = await Promise.all([
            User.findById(viewerId).select("_id role centerId").lean(),
            User.findById(teacherId).select("_id role centerId").lean(),
        ]);

        if (!viewer) return res.status(401).json({ message: "Unauthorized" });
        if (!targetTeacher || targetTeacher.role !== "teacher") {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // Teacher can only view self
        if (
            viewer.role === "teacher" &&
            String(viewer._id) !== String(teacherId)
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Center boundary:
        // teacher.centerId should match center's _id (most common)
        if (viewer.role === "center") {
            const viewerCenterKey = String(viewer.centerId || viewer._id); //  FIX
            const teacherCenterKey = String(targetTeacher.centerId || "");

            if (!teacherCenterKey || viewerCenterKey !== teacherCenterKey) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }

        if (viewer.role !== "center" && viewer.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const list = await Feedback.find({ teacherId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json({ metadata: { feedbacks: list } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
