// server/src/controllers/classNote.controller.js
const Class = require("../models/Class");
const User = require("../models/User");
const ClassNote = require("../models/ClassNote");
const Notification = require("../models/Notification");

const getMyId = (req) => req?.user?.userId || req?.user?._id;
const toStr = (v) => (v == null ? "" : String(v));
const uniqStr = (arr) => Array.from(new Set((arr || []).map((x) => String(x))));
const MAX_NOTES_PER_CLASS = 200;
const PRUNE_OLDEST_COUNT = 100;

exports.listByClass = async (req, res) => {
    try {
        const { id: classId } = req.params;

        const notes = await ClassNote.find({ classId })
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        return res.json({ metadata: { notes } });
    } catch (err) {
        console.error("listByClass error:", err);
        return res.status(500).json({ message: "Get notes failed" });
    }
};

exports.create = async (req, res) => {
    try {
        const myId = getMyId(req);
        const role = req.user?.role; // "teacher" | "center"
        const { id: classId } = req.params;
        const { content, toRole } = req.body || {};

        const text = toStr(content).trim();
        if (!text)
            return res.status(400).json({ message: "content is required" });

        if (!["teacher", "center"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // validate toRole strictly
        const expectedToRole = role === "teacher" ? "center" : "teacher";
        if (toRole !== expectedToRole) {
            return res.status(400).json({ message: "Invalid toRole" });
        }

        const klass = await Class.findById(classId).lean();
        if (!klass) return res.status(404).json({ message: "Class not found" });

        let centerId = null;

        if (role === "center") {
            centerId = myId; // center userId
        } else {
            // role === "teacher"
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

        // 1) Save note (shared log for both sides)
        const note = await ClassNote.create({
            classId,
            content: text,
            fromUserId: myId,
            fromRole: role,
            toRole,
            centerId,
        });

        // 1.1) Auto prune old notes if too many
        try {
            const total = await ClassNote.countDocuments({ classId });

            if (total > MAX_NOTES_PER_CLASS) {
                const old = await ClassNote.find({ classId })
                    .sort({ createdAt: 1 })
                    .limit(PRUNE_OLDEST_COUNT)
                    .select("_id")
                    .lean();

                const oldIds = old.map((x) => x._id);

                if (oldIds.length) {
                    await ClassNote.deleteMany({ _id: { $in: oldIds } });
                }
            }
        } catch (e) {
            console.error("auto prune class notes error:", e);
        }

        // 2) Build recipients
        const teachers = await User.find({ role: "teacher", centerId })
            .select("_id")
            .lean();
        const teacherIds = teachers.map((t) => t._id);

        let recipients = [];

        if (role === "teacher") {
            // teacher -> center + all teachers
            recipients = [centerId, ...teacherIds];
        } else {
            // center -> all teachers
            recipients = [...teacherIds];
        }

        // exclude sender + unique
        recipients = uniqStr(recipients).filter((id) => id !== String(myId));

        // 3) Create notification
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

        return res.status(201).json({ metadata: { note } });
    } catch (err) {
        console.error("create class note error:", err);
        return res.status(500).json({ message: "Create note failed" });
    }
};

exports.createClassNote = exports.create;
exports.getClassNotes = exports.listByClass;
