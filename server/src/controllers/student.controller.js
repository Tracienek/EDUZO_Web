// server/src/controllers/student.controller.js
const Student = require("../models/Student");
const Class = require("../models/Class");

exports.createStudent = async (req, res) => {
    try {
        const { fullName, email, dob, classId } = req.body;

        if (!fullName?.trim() || !email?.trim()) {
            return res
                .status(400)
                .json({ message: "fullName and email are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existed = await Student.findOne({
            email: normalizedEmail,
        }).lean();
        if (existed) {
            return res.status(409).json({
                message: "Student already exists",
                metadata: { student: existed },
            });
        }

        // validate classId (optional)
        let validClassId = null;
        if (classId) {
            const cls = await Class.findById(classId).select("_id").lean();
            if (!cls) {
                return res.status(400).json({ message: "Class not found" });
            }
            validClassId = cls._id;
        }

        const created = await Student.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            dob: dob || "",
            homework: false,
            classId: validClassId,
        });

        // trả về kèm class info để UI dùng luôn nếu cần
        const populated = await Student.findById(created._id)
            .populate({
                path: "classId",
                select: "name folderId folderName subject",
            })
            .lean();

        return res.status(201).json({ metadata: { student: populated } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const withClass = String(req.query.withClass || "") === "1";

        let q = Student.find().sort({ createdAt: -1 });

        if (withClass) {
            q = q.populate({
                path: "classId",
                select: "name folderId folderName subject",
            });
        }

        const list = await q.lean();
        return res.json({ metadata: { students: list } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const withClass = String(req.query.withClass || "") === "1";

        let q = Student.findById(req.params.id);

        if (withClass) {
            q = q.populate({
                path: "classId",
                select: "name folderId folderName subject",
            });
        }

        const st = await q.lean();
        if (!st) return res.status(404).json({ message: "Student not found" });

        return res.json({ metadata: { student: st } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { fullName, dob, homework, classId } = req.body;

        const update = {};

        if (typeof fullName === "string") update.fullName = fullName.trim();
        if (typeof dob === "string") update.dob = dob;
        if (typeof homework === "boolean") update.homework = homework;

        if (req.body.hasOwnProperty("classId")) {
            // cho phép gỡ classId bằng null / "" / undefined
            if (classId === null || classId === "" || classId === undefined) {
                update.classId = null;
            } else {
                const cls = await Class.findById(classId).select("_id").lean();
                if (!cls) {
                    return res.status(400).json({ message: "Class not found" });
                }
                update.classId = cls._id;
            }
        }

        const st = await Student.findByIdAndUpdate(req.params.id, update, {
            new: true,
        })
            .populate({
                path: "classId",
                select: "name folderId folderName subject",
            })
            .lean();

        if (!st) return res.status(404).json({ message: "Student not found" });

        return res.json({ metadata: { student: st } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const ClassNote = require("../models/ClassNote");

// GET /students/:id/profile
exports.getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id).lean();
        if (!student)
            return res.status(404).json({ message: "Student not found" });

        // student belongs to which class? (Class.students is array of ObjectId)
        const klass = await Class.findOne({ students: id })
            .select(
                "name scheduleText durationMinutes totalSessions heldCount centerId",
            )
            .lean();

        return res.status(200).json({
            metadata: {
                student,
                class: klass || null,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load profile" });
    }
};

// GET /students/:id/notes
exports.listStudentNotes = async (req, res) => {
    try {
        const { id } = req.params;

        // Only notes for this student
        const notes = await ClassNote.find({ studentId: id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ metadata: { notes } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load notes" });
    }
};

// POST /students/:id/notes
exports.createStudentNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, classId } = req.body;

        const text = String(content || "").trim();
        if (!text)
            return res.status(400).json({ message: "Content is required" });

        // must provide classId because ClassNote requires it
        if (!classId) {
            return res.status(400).json({ message: "classId is required" });
        }

        // get current user info from auth middleware
        const userId = req.user?._id || req.userInfo?._id;
        const role = req.user?.role || req.userInfo?.role;

        if (!userId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (role !== "teacher" && role !== "center") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const toRole = role === "teacher" ? "center" : "teacher";

        // centerId: from class if possible
        const klass = await Class.findById(classId).select("centerId").lean();
        const centerId = klass?.centerId || null;

        const note = await ClassNote.create({
            classId,
            studentId: id,
            content: text,
            fromUserId: userId,
            fromRole: role,
            toRole,
            centerId,
        });

        return res.status(201).json({ metadata: { note } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create note" });
    }
};
