const Class = require("../models/Class");
const User = require("../models/User");
const ClassNote = require("../models/ClassNote");
const Notification = require("../models/Notification");

const getMyId = (req) => req?.user?.userId || req?.user?._id;

const toStr = (v) => (v == null ? "" : String(v));

const uniqStr = (arr) => Array.from(new Set((arr || []).map((x) => String(x))));

const MAX_NOTES_PER_CLASS = 200;
const PRUNE_OLDEST_COUNT = 100;

// GET /classes/:id/notes
exports.listByClass = async (req, res) => {
    try {
        const { id: classId } = req.params;

        const notes = await ClassNote.find({
            classId,
            studentId: null,
        })
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        return res.json({
            metadata: { notes },
        });
    } catch (err) {
        console.error("listByClass error:", err);

        return res.status(500).json({
            message: "Get notes failed",
        });
    }
};

// POST /classes/:id/notes
exports.create = async (req, res) => {
    try {
        const myId = getMyId(req);
        const role = req.user?.role;
        const { id: classId } = req.params;
        const { content, toRole } = req.body || {};

        const text = toStr(content).trim();

        if (!text) {
            return res.status(400).json({
                message: "content is required",
            });
        }

        if (!["teacher", "center"].includes(role)) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        const expectedToRole = role === "teacher" ? "center" : "teacher";

        if (toRole !== expectedToRole) {
            return res.status(400).json({
                message: "Invalid toRole",
            });
        }

        const klass = await Class.findById(classId).lean();

        if (!klass) {
            return res.status(404).json({
                message: "Class not found",
            });
        }

        let centerId = null;

        if (role === "center") {
            centerId = myId;
        } else {
            centerId = req.user?.centerId;

            if (!centerId) {
                const me = await User.findById(myId)
                    .select("_id centerId role")
                    .lean();

                if (!me || me.role !== "teacher" || !me.centerId) {
                    return res.status(400).json({
                        message: "centerId is missing on this teacher account",
                    });
                }

                centerId = me.centerId;
            }
        }

        // 1. Save class note
        const note = await ClassNote.create({
            classId,
            content: text,
            fromUserId: myId,
            fromRole: role,
            toRole,
            centerId,
        });

        // 2. Automatically prune old class notes
        try {
            const total = await ClassNote.countDocuments({
                classId,
                studentId: null,
            });

            if (total > MAX_NOTES_PER_CLASS) {
                const old = await ClassNote.find({
                    classId,
                    studentId: null,
                })
                    .sort({ createdAt: 1 })
                    .limit(PRUNE_OLDEST_COUNT)
                    .select("_id")
                    .lean();

                const oldIds = old.map((x) => x._id);

                if (oldIds.length) {
                    await ClassNote.deleteMany({
                        _id: { $in: oldIds },
                    });
                }
            }
        } catch (e) {
            console.error("auto prune class notes error:", e);
        }

        // 3. Build notification recipients
        const teachers = await User.find({
            role: "teacher",
            centerId,
        })
            .select("_id")
            .lean();

        const teacherIds = teachers.map((t) => t._id);

        let recipients = [];

        if (role === "teacher") {
            recipients = [centerId, ...teacherIds];
        } else {
            recipients = [...teacherIds];
        }

        recipients = uniqStr(recipients).filter((id) => id !== String(myId));

        // 4. Create notification
        if (recipients.length) {
            await Notification.create({
                title:
                    role === "teacher"
                        ? "New note from Teacher"
                        : "New note from Center",
                content: text,
                classId,
                className: klass.name || klass.className || "",
                recipients,
                readBy: [],
            });
        }

        return res.status(201).json({
            metadata: { note },
        });
    } catch (err) {
        console.error("create class note error:", err);

        return res.status(500).json({
            message: "Create note failed",
        });
    }
};

// Maintain backward compatibility
exports.createClassNote = exports.create;
exports.getClassNotes = exports.listByClass;

// PATCH /classes/:id/notes/:noteId
exports.update = async (req, res) => {
    try {
        const content = String(req.body?.content || "").trim();

        if (!content) {
            return res.status(400).json({
                message: "Content is required",
            });
        }

        const myId = getMyId(req);

        if (!myId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const note = await ClassNote.findOneAndUpdate(
            {
                _id: req.params.noteId,
                classId: req.params.id,
                studentId: null,
                fromUserId: myId,
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

        console.error("update class note:", err);

        return res.status(500).json({
            message: "Update failed",
        });
    }
};
