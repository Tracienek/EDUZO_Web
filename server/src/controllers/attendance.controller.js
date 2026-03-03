// server/src/controllers/attendance.controller.js
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const ClassSession = require("../models/ClassSession");
const ClassModel = require("../models/Class");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendMail } = require("../utils/mailer");
const TeacherAttendanceLog = require("../models/TeacherAttendanceLog");

const TUITION_KEY = "__TUITION__";

// Helper: validate YYYY-MM-DD
const isISODateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

exports.getByDates = async (req, res) => {
    // (optional) stop caching for this endpoint
    res.set("Cache-Control", "no-store");

    try {
        const classId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid classId" });
        }
        const classObjectId = new mongoose.Types.ObjectId(classId);

        const dates = String(req.query.dates || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);

        const raw = await Attendance.find({
            classId: classObjectId,
            dateKey: { $in: [...dates, TUITION_KEY] },
        })
            .select("studentId classId dateKey attendance homework tuition")
            .lean();

        const records = raw.map((r) => ({
            ...r,
            studentId: String(r.studentId), // ✅ IMPORTANT
            classId: String(r.classId), // ✅ optional but good
        }));

        return res.status(200).json({ metadata: { records } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.bulkSaveAttendance = async (req, res) => {
    try {
        const classId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid classId" });
        }
        const classObjectId = new mongoose.Types.ObjectId(classId);

        const changes = Array.isArray(req.body?.changes)
            ? req.body.changes
            : [];
        const tuitionChanges = Array.isArray(req.body?.tuitionChanges)
            ? req.body.tuitionChanges
            : [];

        const ops = [];

        // attendance + homework per date
        for (const c of changes) {
            if (!c?.studentId || !c?.dateKey) continue;

            // protect against invalid dateKey format (optional)
            if (c.dateKey !== TUITION_KEY && !isISODateKey(c.dateKey)) continue;

            const set = {};
            if (typeof c.attendance === "boolean")
                set.attendance = c.attendance;
            if (typeof c.homework === "boolean") set.homework = c.homework;

            if (!Object.keys(set).length) continue;

            ops.push({
                updateOne: {
                    filter: {
                        classId: classObjectId,
                        studentId: c.studentId,
                        dateKey: c.dateKey,
                    },
                    update: {
                        $set: set,
                        $setOnInsert: {
                            classId: classObjectId,
                            studentId: c.studentId,
                            dateKey: c.dateKey,
                        },
                    },
                    upsert: true,
                },
            });
        }

        // tuition (special record)
        for (const t of tuitionChanges) {
            if (!t?.studentId) continue;

            ops.push({
                updateOne: {
                    filter: {
                        classId: classObjectId,
                        studentId: t.studentId,
                        dateKey: TUITION_KEY,
                    },
                    update: {
                        $set: { tuition: !!t.tuition },
                        $setOnInsert: {
                            classId: classObjectId,
                            studentId: t.studentId,
                            dateKey: TUITION_KEY,
                        },
                    },
                    upsert: true,
                },
            });
        }

        // If nothing to save, just sync heldCount from ClassSession
        if (!ops.length) {
            const heldCount = await ClassSession.countDocuments({
                classId: classObjectId,
                held: true,
            });

            await ClassModel.updateOne(
                { _id: classObjectId },
                { $set: { heldCount } },
            );

            return res.json({ metadata: { saved: 0, heldCount } });
        }

        // count before (to detect "crossing" threshold)
        const heldCountBefore = await ClassSession.countDocuments({
            classId: classObjectId,
            held: true,
        });

        const result = await Attendance.bulkWrite(ops, { ordered: false });

        // 1) Determine which dateKeys were edited (exclude tuition)
        const changedDateKeys = Array.from(
            new Set(
                changes
                    .map((c) => String(c?.dateKey || "").trim())
                    .filter(
                        (dk) => dk && dk !== TUITION_KEY && isISODateKey(dk),
                    ),
            ),
        );

        // 2) Mark session as held ONLY if any student has attendance=true OR homework=true for that dateKey
        if (changedDateKeys.length) {
            const heldDateKeys = [];

            for (const dk of changedDateKeys) {
                const anyTrue = await Attendance.exists({
                    classId: classObjectId,
                    dateKey: dk,
                    $or: [{ attendance: true }, { homework: true }],
                });

                if (anyTrue) heldDateKeys.push(dk);
            }

            if (heldDateKeys.length) {
                const sessionOps = heldDateKeys.map((dk) => ({
                    updateOne: {
                        filter: { classId: classObjectId, dateKey: dk },
                        update: {
                            $set: { held: true },
                            $setOnInsert: {
                                classId: classObjectId,
                                dateKey: dk,
                            },
                        },
                        upsert: true,
                    },
                }));

                await ClassSession.bulkWrite(sessionOps, { ordered: false });
            }
        }

        // 3) Recount held sessions after updates
        const heldCountAfter = await ClassSession.countDocuments({
            classId: classObjectId,
            held: true,
        });

        // Load class threshold (totalSessions) + milestone status
        const klass = await ClassModel.findById(classObjectId)
            .select(
                "centerId tuitionMilestoneNotifiedAt tuitionEmailSentAt name totalSessions tuitionCycleStartHeldCount",
            )
            .lean();

        const threshold = Math.max(1, Number(klass?.totalSessions || 12));
        const base = Number(klass?.tuitionCycleStartHeldCount || 0);

        const cycleBefore = Math.max(0, heldCountBefore - base);
        const cycleAfter = Math.max(0, heldCountAfter - base);

        // if (klass?.tuitionEmailSentAt && cycleAfter > 0) {
        //     await ClassModel.updateOne(
        //         { _id: classObjectId },
        //         { $set: { tuitionEmailSentAt: null } },
        //     );
        // }

        // Sync heldCount to Class so FE can show X/total immediately
        await ClassModel.updateOne(
            { _id: classObjectId },
            { $set: { heldCount: heldCountAfter } },
        );

        // 4) Notify center ONCE when crossing threshold (cycle-based)
        const crossedThreshold =
            cycleBefore < threshold && cycleAfter >= threshold;

        if (crossedThreshold && klass?.centerId) {
            // Atomic gate: only one request can set the milestone timestamp
            const gate = await ClassModel.findOneAndUpdate(
                {
                    _id: classObjectId,
                    tuitionMilestoneNotifiedAt: null,
                },
                { $set: { tuitionMilestoneNotifiedAt: new Date() } },
                { new: true },
            ).lean();

            if (gate) {
                // 1) Create in-app notification for center
                try {
                    await Notification.create({
                        title: "Tuition due",
                        content: `Class "${klass.name || "Class"}" đã đủ ${threshold}/${threshold}. Đến hạn thu học phí.`,
                        classId: classObjectId,
                        className: klass.name || "",
                        recipients: [klass.centerId],
                        readBy: [],
                    });
                } catch (e) {
                    console.error(
                        "Create tuition notification failed:",
                        e.message,
                    );
                }

                // 2) Send email to center
                try {
                    const center = await User.findById(klass.centerId)
                        .select("email")
                        .lean();

                    if (center?.email) {
                        await sendMail({
                            to: center.email,
                            subject: `[EDUZO] Class "${klass.name || "Class"}" đã đủ ${threshold}/${threshold} – đến hạn thu học phí`,
                            text:
                                `Xin chào,\n\n` +
                                `Class "${klass.name || "Class"}" đã hoàn thành ${threshold}/${threshold} buổi.\n` +
                                `Bạn có thể vào hệ thống để bấm "Send tuition email" cho học viên.\n\n` +
                                `Trân trọng,\nEDUZO`,
                        });
                    }
                } catch (e) {
                    console.error("Milestone email failed:", e.message);
                }
            }
        }

        // ---- create teacher attendance log (ONE record per "Save") ----
        try {
            const actorRole = req.user?.role;

            if (actorRole === "teacher") {
                const teacherId = req.user?.userId; // from auth.middleware
                const meta = req.body?.logMeta || {};

                let logDateKey = String(meta.dateKey || "").trim();
                if (!isISODateKey(logDateKey)) {
                    // fallback: first edited dateKey
                    logDateKey = changedDateKeys?.[0] || "";
                }

                if (
                    teacherId &&
                    mongoose.Types.ObjectId.isValid(String(teacherId)) &&
                    isISODateKey(logDateKey)
                ) {
                    const klassForLog = await ClassModel.findById(classObjectId)
                        .select("name")
                        .lean();

                    await TeacherAttendanceLog.create({
                        teacherId: new mongoose.Types.ObjectId(
                            String(teacherId),
                        ),
                        classId: classObjectId,
                        classNameSnapshot: klassForLog?.name || "",
                        dateKey: logDateKey,
                        timeLabel: String(meta.timeLabel || "").trim(),
                    });
                }
            }
        } catch (e) {
            console.error("Attendance log create failed:", e.message);
        }

        return res.json({
            metadata: {
                saved:
                    (result?.modifiedCount || 0) + (result?.upsertedCount || 0),
                heldCount: heldCountAfter,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getByRange = async (req, res) => {
    try {
        const classId = req.params.id;
        const from = String(req.query.from || "").trim();
        const to = String(req.query.to || "").trim();

        // validate basic ISO YYYY-MM-DD
        if (!isISODateKey(from) || !isISODateKey(to)) {
            return res
                .status(400)
                .json({ message: "from/to must be YYYY-MM-DD" });
        }

        // get attendance in date range + tuition special record
        const raw = await Attendance.find({
            classId,
            $or: [
                { dateKey: { $gte: from, $lte: to } },
                { dateKey: TUITION_KEY },
            ],
        })
            .select("studentId dateKey attendance homework tuition")
            .lean();

        const records = raw.map((r) => ({
            ...r,
            studentId: String(r.studentId),
        }));

        return res.json({ metadata: { records } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getTeacherAttendanceLogs = async (req, res) => {
    try {
        // route: /center/teachers/:id/attendance-logs
        const teacherIdParam = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(String(teacherIdParam))) {
            return res.status(400).json({ message: "Invalid teacherId" });
        }

        const role = String(req.user?.role || "").toLowerCase();
        const viewerId = String(req.user?.userId || req.user?._id || "");

        if (role === "teacher" && viewerId !== String(teacherIdParam)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        if (role !== "center" && role !== "teacher") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const limit = Math.min(Number(req.query.limit || 100), 200);

        const logs = await TeacherAttendanceLog.find({
            teacherId: new mongoose.Types.ObjectId(String(teacherIdParam)),
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select("classId classNameSnapshot dateKey timeLabel createdAt")
            .lean();

        return res.json({ metadata: { logs } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.clearTeacherAttendanceLogs = async (req, res) => {
    try {
        const teacherIdParam = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(teacherIdParam)) {
            return res.status(400).json({ message: "Invalid teacherId" });
        }

        if (req.user?.role !== "center") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const result = await TeacherAttendanceLog.deleteMany({
            teacherId: new mongoose.Types.ObjectId(String(teacherIdParam)),
        });

        return res.json({ metadata: { deleted: result?.deletedCount || 0 } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
