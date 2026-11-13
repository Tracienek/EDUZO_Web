const Student = require("../models/Student");
const Class = require("../models/Class");
const ClassNote = require("../models/ClassNote");

// POST /students
exports.createStudent = async (req, res) => {
    try {
        const { fullName, email, dob, classId, studentCode, parentPhone } =
            req.body;

        if (!fullName?.trim() || !email?.trim()) {
            return res.status(400).json({
                message: "fullName and email are required",
            });
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

        let validClassId = null;

        if (classId) {
            const cls = await Class.findById(classId).select("_id").lean();

            if (!cls) {
                return res.status(400).json({
                    message: "Class not found",
                });
            }

            validClassId = cls._id;
        }

        const created = await Student.create({
            fullName: fullName.trim(),
            studentCode: String(studentCode || "").trim(),
            parentPhone: String(parentPhone || "").trim(),
            email: normalizedEmail,
            dob: dob || "",
            homework: false,
            classId: validClassId,
        });

        const populated = await Student.findById(created._id)
            .populate({
                path: "classId",
                select: "name folderId folderName subject",
            })
            .lean();

        return res.status(201).json({
            metadata: { student: populated },
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

// GET /students
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

        return res.json({
            metadata: { students: list },
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

// GET /students/:id
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

        if (!st) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        return res.json({
            metadata: { student: st },
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

// PATCH /students/:id
exports.update = async (req, res) => {
    try {
        const { fullName, dob, homework, classId, studentCode, parentPhone } =
            req.body;

        const update = {};

        if (typeof fullName === "string") {
            update.fullName = fullName.trim();
        }

        if (typeof dob === "string") {
            update.dob = dob;
        }

        if (typeof studentCode === "string") {
            update.studentCode = studentCode.trim();
        }

        if (typeof parentPhone === "string") {
            update.parentPhone = parentPhone.trim();
        }

        if (typeof homework === "boolean") {
            update.homework = homework;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "classId")) {
            if (classId === null || classId === "" || classId === undefined) {
                update.classId = null;
            } else {
                const cls = await Class.findById(classId).select("_id").lean();

                if (!cls) {
                    return res.status(400).json({
                        message: "Class not found",
                    });
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

        if (!st) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        return res.json({
            metadata: { student: st },
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
};

// GET /students/:id/profile
exports.getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id).lean();

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        const klass = await Class.findOne({
            students: id,
        })
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

        return res.status(500).json({
            message: "Failed to load profile",
        });
    }
};

// GET /students/:id/notes
exports.listStudentNotes = async (req, res) => {
    try {
        const { id } = req.params;

        const notes = await ClassNote.find({
            studentId: id,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            metadata: { notes },
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Failed to load notes",
        });
    }
};

// POST /students/:id/notes
exports.createStudentNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, classId } = req.body;

        const text = String(content || "").trim();

        if (!text) {
            return res.status(400).json({
                message: "Content is required",
            });
        }

        if (!classId) {
            return res.status(400).json({
                message: "classId is required",
            });
        }

        const userId = req.user?._id || req.userInfo?._id;

        const role = req.user?.role || req.userInfo?.role;

        if (!userId || !role) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (role !== "teacher" && role !== "center") {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        const toRole = role === "teacher" ? "center" : "teacher";

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

        return res.status(201).json({
            metadata: { note },
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Failed to create note",
        });
    }
};

// PATCH /students/:id/notes/:noteId
// Only the original author can edit a note.
exports.updateStudentNote = async (req, res) => {
    try {
        const content = String(req.body?.content || "").trim();

        if (!content) {
            return res.status(400).json({
                message: "Content is required",
            });
        }

        const userId = req.user?.userId || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const note = await ClassNote.findOneAndUpdate(
            {
                _id: req.params.noteId,
                studentId: req.params.id,
                fromUserId: userId,
            },
            {
                $set: { content },
            },
            {
                new: true,
                runValidators: true,
            },
        );

        if (!note) {
            return res.status(404).json({
                message: "Note not found or permission denied",
            });
        }

        return res.json({
            metadata: { note },
        });
    } catch (err) {
        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid note ID",
            });
        }

        console.error("update student note:", err);

        return res.status(500).json({
            message: "Update failed",
        });
    }
};
