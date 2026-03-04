// server/src/controllers/class.controller.js
const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const ClassSession = require("../models/ClassSession");
const Notification = require("../models/Notification");
const { sendMail } = require("../utils/mailer");
const User = require("../models/User");

const getMyId = (req) => req.user?.userId || req.user?._id;

const resolveCenterId = async (req) => {
    const myId = getMyId(req);
    if (!myId) return { error: { status: 401, message: "Invalid token" } };

    const role = req.user?.role;
    let centerId = null;

    if (role === "center") {
        centerId = myId;
    } else if (role === "teacher") {
        const u = await User.findById(myId).select("centerId").lean();
        centerId = u?.centerId || null;
    } else {
        return { error: { status: 403, message: "Forbidden" } };
    }

    if (!centerId) {
        return {
            error: {
                status: 400,
                message: "centerId is missing on this account",
            },
        };
    }

    return { centerId, myId, role };
};

/**
 * Ensure a class belongs to the caller's center.
 */
const loadOwnedClass = async (req, classId) => {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
        return { error: { status: 400, message: "Invalid classId" } };
    }

    const { centerId, error } = await resolveCenterId(req);
    if (error) return { error };

    const cls = await Class.findById(classId);
    if (!cls) return { error: { status: 404, message: "Class not found" } };

    if (String(cls.centerId || "") !== String(centerId)) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { cls, centerId };
};

const notifyTuitionMilestone = async ({ cls, threshold }) => {
    const centerId = cls.centerId;
    if (!centerId) return;

    try {
        await Notification.create({
            title: "Tuition due",
            content: `Class "${cls.name}" đã đủ ${threshold}/${threshold}. Đến hạn thu học phí.`,
            classId: cls._id,
            className: cls.name || "",
            recipients: [centerId],
            readBy: [],
        });
    } catch (e) {
        console.error("Create tuition due notification failed:", e.message);
    }

    // email optional
    try {
        const centerUser = await User.findById(centerId)
            .select("email fullName")
            .lean();

        const centerEmail = centerUser?.email;
        if (!centerEmail) return;

        const subject = `[EDUZO] Class "${cls.name}" đã đủ ${threshold}/${threshold} – đến hạn thu học phí`;
        const text =
            `Xin chào,\n\n` +
            `Class "${cls.name}" đã hoàn thành ${threshold}/${threshold} buổi.\n` +
            `Vui lòng vào hệ thống để gửi tuition email cho học viên.\n\n` +
            `Trân trọng,\nEDUZO`;

        await sendMail({ to: centerEmail, subject, text });
    } catch (e) {
        console.error("Tuition milestone email failed:", e.message);
    }
};

exports.getAvailable = async (req, res) => {
    try {
        const { centerId, error } = await resolveCenterId(req);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const list = await Class.find({ isActive: true, centerId })
            .sort({ createdAt: -1 })
            .lean();

        const now = Date.now();

        const classes = list.map((c) => {
            const until = c.onlineUntil ? new Date(c.onlineUntil).getTime() : 0;
            const isOnlineNow = !!c.isOnline && until > now;

            return {
                ...c,
                isOnline: isOnlineNow,
                totalStudents: c.students?.length || 0,
                studentCount: c.students?.length || 0,
            };
        });

        return res.json({ metadata: { classes } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { name, subject, scheduleText, durationMinutes, totalSessions } =
            req.body;

        if (!name?.trim() || !subject?.trim()) {
            return res
                .status(400)
                .json({ message: "name and subject are required" });
        }

        const { centerId, error } = await resolveCenterId(req);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const created = await Class.create({
            name: name.trim(),
            subject: subject.trim(),
            scheduleText: scheduleText?.trim() || "",
            durationMinutes: Number(durationMinutes) || 90,
            students: [],
            isActive: true,
            centerId,

            totalSessions: Math.max(1, Number(totalSessions) || 12),
            heldCount: 0,

            tuitionCycleStartHeldCount: 0,

            tuitionMilestoneNotifiedAt: null,
            tuitionEmailSentAt: null,
        });

        return res.status(201).json({
            metadata: {
                class: {
                    ...created.toObject(),
                    totalStudents: 0,
                    studentCount: 0,
                },
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const classId = req.params.id;
        const { centerId, error } = await resolveCenterId(req);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const cls = await Class.findById(classId)
            .populate("students", "fullName email dob homework")
            .lean();

        if (!cls) return res.status(404).json({ message: "Class not found" });

        if (String(cls.centerId || "") !== String(centerId)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const now = Date.now();
        const until = cls.onlineUntil ? new Date(cls.onlineUntil).getTime() : 0;
        const isOnlineNow = cls.isOnline && until > now;

        return res.json({
            metadata: {
                class: {
                    ...cls,
                    totalStudents: cls.students?.length || 0,
                    studentCount: cls.students?.length || 0,
                    heldCount: Number(cls.heldCount || 0),
                    totalSessions: Math.max(1, Number(cls.totalSessions || 12)),

                    tuitionCycleStartHeldCount: Number(
                        cls.tuitionCycleStartHeldCount || 0,
                    ),

                    tuitionMilestoneNotifiedAt:
                        cls.tuitionMilestoneNotifiedAt || null,
                    tuitionEmailSentAt: cls.tuitionEmailSentAt || null,
                    isOnline: isOnlineNow,
                    onlineUntil: cls.onlineUntil || null,
                },
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.addStudentToClass = async (req, res) => {
    try {
        const { fullName, email, dob } = req.body;
        const classId = req.params.id;

        if (!fullName?.trim() || !email?.trim()) {
            return res
                .status(400)
                .json({ message: "fullName and email are required" });
        }

        const { cls, error } = await loadOwnedClass(req, classId);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const normalizedEmail = email.trim().toLowerCase();

        const existedStudent = await Student.findOne({
            email: normalizedEmail,
        }).lean();

        let studentDoc;
        if (existedStudent) {
            studentDoc = existedStudent;
        } else {
            studentDoc = await Student.create({
                fullName: fullName.trim(),
                email: normalizedEmail,
                dob: dob || "",
                homework: false,
            });
        }

        const sid = String(studentDoc._id);
        const has = (cls.students || []).some((x) => String(x) === sid);
        if (!has) cls.students.push(studentDoc._id);
        await cls.save();

        return res.status(201).json({
            metadata: {
                student: studentDoc,
                class: {
                    _id: cls._id,
                    totalStudents: cls.students.length,
                    studentCount: cls.students.length,
                },
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.setOnline = async (req, res) => {
    try {
        const classId = req.params.id;

        const { cls, error } = await loadOwnedClass(req, classId);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const { isOnline } = req.body || {};
        if (typeof isOnline !== "boolean") {
            return res
                .status(400)
                .json({ message: "isOnline must be boolean" });
        }

        cls.isOnline = isOnline;
        await cls.save();

        return res.json({ metadata: { class: cls } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.pingOnline = async (req, res) => {
    try {
        const classId = req.params.id;

        const { cls, error } = await loadOwnedClass(req, classId);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const duration = Number(cls.durationMinutes) || 90;
        const onlineMinutes = Math.max(1, duration - 15);
        const onlineUntil = new Date(Date.now() + onlineMinutes * 60 * 1000);

        const updated = await Class.findByIdAndUpdate(
            classId,
            { $set: { isOnline: true, onlineUntil } },
            { new: true },
        ).lean();

        return res.json({
            metadata: { class: updated, onlineMinutes, onlineUntil },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await loadOwnedClass(req, id);
        if (error)
            return res.status(error.status).json({ message: error.message });

        try {
            await Attendance.deleteMany({ classId: id });
        } catch (_) {}

        try {
            await ClassSession.deleteMany({ classId: id });
        } catch (_) {}

        await Class.findByIdAndDelete(id);

        return res.json({ metadata: { deleted: true, classId: id } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.getSessionSummary = async (req, res) => {
    try {
        const classId = req.params.id;

        const { cls, error } = await loadOwnedClass(req, classId);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const heldCount = Number(cls.heldCount || 0);
        const threshold = Math.max(1, Number(cls.totalSessions || 12));
        const base = Number(cls.tuitionCycleStartHeldCount || 0);
        const cycleHeld = Math.max(0, heldCount - base);

        return res.json({
            metadata: {
                heldCount,
                cycleHeld,
                threshold,
                canSendTuition: cycleHeld >= threshold,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.markSessionHeld = async (req, res) => {
    try {
        const classId = req.params.id;
        const { dateKey } = req.body;

        if (!dateKey?.trim()) {
            return res
                .status(400)
                .json({ message: "dateKey is required (YYYY-MM-DD)" });
        }

        const { cls, error } = await loadOwnedClass(req, classId);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const existing = await ClassSession.findOne({
            classId,
            dateKey,
        }).lean();
        if (existing?.held) {
            const heldCount = Number(cls.heldCount || 0);
            const threshold = Math.max(1, Number(cls.totalSessions || 12));
            const base = Number(cls.tuitionCycleStartHeldCount || 0);
            const cycleHeld = Math.max(0, heldCount - base);

            return res.json({
                metadata: {
                    heldCount,
                    cycleHeld,
                    threshold,
                    canSendTuition: cycleHeld >= threshold,
                    alreadyHeld: true,
                },
            });
        }

        await ClassSession.updateOne(
            { classId, dateKey },
            { $set: { held: true }, $setOnInsert: { classId, dateKey } },
            { upsert: true },
        );

        const updated = await Class.findByIdAndUpdate(
            classId,
            { $inc: { heldCount: 1 } },
            { new: true },
        ).lean();

        const heldCount = Number(updated?.heldCount || 0);
        const threshold = Math.max(1, Number(updated?.totalSessions || 12));
        const base = Number(updated?.tuitionCycleStartHeldCount || 0);
        const cycleHeld = Math.max(0, heldCount - base);

        if (cycleHeld >= threshold) {
            const milestoneHit = await Class.findOneAndUpdate(
                { _id: classId, tuitionMilestoneNotifiedAt: null },
                { $set: { tuitionMilestoneNotifiedAt: new Date() } },
                { new: true },
            ).lean();

            if (milestoneHit) {
                await notifyTuitionMilestone({ cls: milestoneHit, threshold });
            }
        }

        return res.json({
            metadata: {
                heldCount,
                cycleHeld,
                threshold,
                canSendTuition: cycleHeld >= threshold,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.sendTuitionEmails = async (req, res) => {
    try {
        const classId = req.params.id;

        if (req.user?.role !== "center") {
            return res
                .status(403)
                .json({ message: "Only center can send tuition emails" });
        }

        const { cls, error } = await loadOwnedClass(req, classId);
        if (error)
            return res.status(error.status).json({ message: error.message });

        const classObjectId = new mongoose.Types.ObjectId(String(classId));

        const heldCount = await ClassSession.countDocuments({
            classId: classObjectId,
            held: true,
        });

        await Class.updateOne({ _id: classObjectId }, { $set: { heldCount } });

        const threshold = Math.max(1, Number(cls.totalSessions || 12));
        const base = Number(cls.tuitionCycleStartHeldCount || 0);
        const cycleHeld = Math.max(0, heldCount - base);

        if (cycleHeld < threshold) {
            return res.status(400).json({
                message: `Cannot send tuition email until ${threshold} sessions are held in this cycle (currently ${cycleHeld})`,
            });
        }

        const lock = await Class.findOneAndUpdate(
            { _id: classId, tuitionEmailSentAt: null },
            { $set: { tuitionEmailSentAt: new Date() } },
            { new: true },
        ).lean();

        if (!lock) {
            return res.status(409).json({
                message: "Tuition emails were already sent for this class",
            });
        }

        const students = await Student.find({
            _id: { $in: cls.students || [] },
        })
            .select("email fullName")
            .lean();

        const studentEmails = students.map((s) => s.email).filter(Boolean);
        if (!studentEmails.length) {
            return res.status(400).json({ message: "No student emails found" });
        }

        const subject = `Tuition fee reminder (${cls.name || "Class"})`;
        const text = `Hello,\n\nYour class "${
            cls.name || "Class"
        }" has completed ${threshold} sessions. Please complete the tuition payment.\n\nThank you.`;

        let sent = 0;
        for (const to of studentEmails) {
            try {
                await sendMail({ to, subject, text });
                sent += 1;
            } catch (e) {
                console.error("Send tuition mail failed:", to, e.message);
            }
        }

        await Class.updateOne(
            { _id: classId },
            {
                $set: {
                    tuitionEmailSentAt: new Date(),
                    tuitionCycleStartHeldCount: heldCount,
                    tuitionMilestoneNotifiedAt: null,
                },
            },
        );

        try {
            if (cls.centerId) {
                await Notification.create({
                    title: "Tuition sent",
                    content: `Đã gửi tuition email cho ${sent}/${studentEmails.length} học viên của class "${
                        cls.name || "Class"
                    }".`,
                    classId: cls._id,
                    className: cls.name || "",
                    recipients: [cls.centerId],
                    readBy: [],
                });
            }
        } catch (e) {
            console.error(
                "Create tuition sent notification failed:",
                e.message,
            );
        }

        const updated = await Class.findById(classObjectId)
            .select(
                "heldCount totalSessions tuitionCycleStartHeldCount tuitionEmailSentAt tuitionMilestoneNotifiedAt",
            )
            .lean();

        const heldCount2 = Number(updated?.heldCount || 0);
        const threshold2 = Math.max(1, Number(updated?.totalSessions || 12));
        const base2 = Number(updated?.tuitionCycleStartHeldCount || 0);
        const cycleHeld2 = Math.max(0, heldCount2 - base2);

        return res.json({
            metadata: {
                sent,
                total: studentEmails.length,
                class: updated,
                summary: {
                    heldCount: heldCount2,
                    cycleHeld: cycleHeld2,
                    threshold: threshold2,
                    canSendTuition: cycleHeld2 >= threshold2,
                },
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.removeStudentFromClass = async (req, res) => {
    try {
        const { id: classId, studentId } = req.params;

        const role = req.user?.role || req.userInfo?.role;
        if (role && role !== "center") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const Class = require("../models/Class");
        const Student = require("../models/Student");

        const klass = await Class.findById(classId);
        if (!klass) return res.status(404).json({ message: "Class not found" });

        klass.students = (klass.students || []).filter(
            (sid) => String(sid) !== String(studentId),
        );

        const count = klass.students.length;
        if (typeof klass.totalStudents !== "undefined")
            klass.totalStudents = count;
        if (typeof klass.studentCount !== "undefined")
            klass.studentCount = count;

        await klass.save();

        await Student.findByIdAndUpdate(studentId, {
            $unset: { classId: "" },
        }).catch(() => {});

        return res.status(200).json({
            message: "Student removed",
            metadata: { classId, studentId, totalStudents: count },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to remove student" });
    }
};
