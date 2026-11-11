const router = require("express").Router();
const mongoose = require("mongoose");
const auth = require("../middlewares/auth.middleware");
const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");

router.use(auth);
const oid = (v) => mongoose.isValidObjectId(v);
const dateValid = (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
async function ownedClasses(req) {
    const userId = req.user?.userId;
    if (!oid(userId)) return [];
    const role = String(req.user?.role || "").toLowerCase();
    const centerId =
        role === "center"
            ? userId
            : role === "teacher"
              ? (await User.findById(userId).select("centerId").lean())
                    ?.centerId
              : null;
    if (!centerId) return [];
    return Class.find({ centerId, isActive: { $ne: false } })
        .select("_id name students subject")
        .lean();
}
async function context(req, res, next) {
    try {
        const classes = await ownedClasses(req);
        const id = req.params.classId || req.query.classId;
        if (
            id &&
            (!oid(id) || !classes.some((c) => String(c._id) === String(id)))
        )
            return res
                .status(403)
                .json({ message: "Không có quyền truy cập lớp này" });
        req.dcClasses = classes;
        req.dcClass = id
            ? classes.find((c) => String(c._id) === String(id))
            : null;
        next();
    } catch (e) {
        next(e);
    }
}
async function studentsFor(cls) {
    if (!cls) return [];
    return Student.find({
        $or: [{ classId: cls._id }, { _id: { $in: cls.students || [] } }],
    })
        .sort({ fullName: 1 })
        .lean();
}
function error(res, e) {
    console.error("Digital classroom:", e);
    return res.status(500).json({ message: "Không thể xử lý dữ liệu lớp học" });
}
router.get("/classes", context, (req, res) =>
    res.json({ classes: req.dcClasses }),
);
router.get("/overview", context, async (req, res) => {
    try {
        const classes = req.dcClass ? [req.dcClass] : req.dcClasses;
        const studentsNested = await Promise.all(classes.map(studentsFor));
        const pairs = classes.flatMap((c, i) =>
            studentsNested[i].map((s) => ({
                classId: String(c._id),
                studentId: String(s._id),
                className: c.name,
                student: s,
            })),
        );
        const ids = classes.map((c) => c._id);
        const today =
            req.query.dateKey && dateValid(req.query.dateKey)
                ? req.query.dateKey
                : new Date().toISOString().slice(0, 10);
        const todayRows = await Attendance.find({
            classId: { $in: ids },
            dateKey: today,
        }).lean();
        const todayStatuses = { present: 0, late: 0, excused: 0, unexcused: 0 };
        todayRows.forEach((r) => {
            if (todayStatuses[r.status] !== undefined)
                todayStatuses[r.status]++;
        });
        const dateKeys = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(`${today}T12:00:00Z`);
            d.setUTCDate(d.getUTCDate() - 6 + i);
            return d.toISOString().slice(0, 10);
        });
        const recent = await Attendance.find({
            classId: { $in: ids },
            dateKey: { $in: dateKeys },
        }).lean();
        const trend = dateKeys.map((dateKey) => {
            const marked = recent.filter((r) => r.dateKey === dateKey);
            return {
                dateKey,
                rate: marked.length
                    ? Math.round(
                          (100 *
                              marked.filter((r) =>
                                  ["present", "late"].includes(r.status),
                              ).length) /
                              marked.length,
                      )
                    : null,
                marked: marked.length,
            };
        });
        const since = new Date(`${today}T00:00:00Z`);
        since.setUTCDate(since.getUTCDate() - 29);
        const window = await Attendance.find({
            classId: { $in: ids },
            dateKey: { $gte: since.toISOString().slice(0, 10), $lte: today },
        }).lean();
        const flagMap = new Map();
        for (const r of window) {
            const key = `${r.classId}-${r.studentId}`;
            const entry = flagMap.get(key) || { late: 0, unexcused: 0 };
            if (r.status === "late") entry.late++;
            if (r.status === "unexcused") entry.unexcused++;
            flagMap.set(key, entry);
        }
        const attention = pairs
            .filter((p) => {
                const count = flagMap.get(`${p.classId}-${p.studentId}`);
                return count && (count.late >= 3 || count.unexcused >= 2);
            })
            .map((p) => ({
                ...p,
                counts: flagMap.get(`${p.classId}-${p.studentId}`),
            }));
        const perClass = classes.map((c, i) => {
            const rows = todayRows.filter(
                (r) => String(r.classId) === String(c._id),
            );
            return {
                classId: c._id,
                name: c.name,
                total: studentsNested[i].length,
                present: rows.filter((r) => r.status === "present").length,
                late: rows.filter((r) => r.status === "late").length,
                absent: rows.filter((r) =>
                    ["excused", "unexcused"].includes(r.status),
                ).length,
                unmarked: Math.max(0, studentsNested[i].length - rows.length),
            };
        });
        res.json({
            dateKey: today,
            counts: {
                total: pairs.length,
                ...todayStatuses,
                unmarked: Math.max(0, pairs.length - todayRows.length),
            },
            trend,
            attention,
            perClass,
        });
    } catch (e) {
        error(res, e);
    }
});
router.get("/students", context, async (req, res) => {
    try {
        const classes = req.dcClass ? [req.dcClass] : req.dcClasses;
        const nested = await Promise.all(classes.map(studentsFor));
        const entries = classes.flatMap((c, i) =>
            nested[i].map((s) => ({
                ...s,
                studentCode:
                    s.studentCode ||
                    `HS${String(s._id).slice(-6).toUpperCase()}`,
                className: c.name,
                displayClassId: c._id,
            })),
        );
        const ids = classes.map((c) => c._id);
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const marks = await Attendance.find({
            classId: { $in: ids },
            dateKey: { $gte: since.toISOString().slice(0, 10) },
        }).lean();
        const counters = {};
        for (const a of marks) {
            const k = `${a.classId}-${a.studentId}`;
            counters[k] ??= { late: 0, excused: 0, unexcused: 0 };
            if (counters[k][a.status] !== undefined) counters[k][a.status]++;
        }
        res.json({
            students: entries.map((s) => ({
                ...s,
                statistics: counters[`${s.displayClassId}-${s._id}`] || {
                    late: 0,
                    excused: 0,
                    unexcused: 0,
                },
            })),
        });
    } catch (e) {
        error(res, e);
    }
});
router.get("/attendance", context, async (req, res) => {
    try {
        if (!req.dcClass || !dateValid(req.query.dateKey))
            return res.status(400).json({ message: "Chọn lớp và ngày hợp lệ" });
        const [students, rows] = await Promise.all([
            studentsFor(req.dcClass),
            Attendance.find({
                classId: req.dcClass._id,
                dateKey: req.query.dateKey,
            }).lean(),
        ]);
        res.json({ students, rows });
    } catch (e) {
        error(res, e);
    }
});
router.put("/attendance/:classId/:studentId", context, async (req, res) => {
    try {
        const { classId, studentId } = req.params;
        const { dateKey, status } = req.body;
        if (
            !req.dcClass ||
            !oid(studentId) ||
            !dateValid(dateKey) ||
            !["present", "late", "excused", "unexcused", null].includes(status)
        )
            return res
                .status(400)
                .json({ message: "Dữ liệu điểm danh không hợp lệ" });
        if (
            !(await studentsFor(req.dcClass)).some(
                (s) => String(s._id) === studentId,
            )
        )
            return res
                .status(404)
                .json({ message: "Học sinh không thuộc lớp" });
        if (status === null) {
            await Attendance.deleteOne({ classId, studentId, dateKey });
            return res.json({ ok: true });
        }
        const row = await Attendance.findOneAndUpdate(
            { classId, studentId, dateKey },
            { $set: { status } },
            { upsert: true, new: true, runValidators: true },
        );
        res.json({ row });
    } catch (e) {
        error(res, e);
    }
});
router.get("/sessions", context, async (req, res) => {
    try {
        if (!req.dcClass) return res.status(400).json({ message: "Chọn lớp" });
        const sessions = await Session.find({ classId: req.dcClass._id })
            .sort({ dateKey: -1 })
            .lean();
        res.json({ sessions });
    } catch (e) {
        error(res, e);
    }
});
router.post("/sessions/:classId", context, async (req, res) => {
    try {
        const {
            dateKey,
            title,
            startTime,
            endTime,
            tuition,
            content,
            homework,
        } = req.body;
        if (!req.dcClass || !dateValid(dateKey) || !String(title || "").trim())
            return res
                .status(400)
                .json({ message: "Thiếu ngày hoặc nội dung buổi học" });
        const session = await Session.findOneAndUpdate(
            { classId: req.dcClass._id, dateKey },
            { $set: { title, startTime, endTime, tuition, content, homework } },
            { upsert: true, new: true, runValidators: true },
        );
        res.json({ session });
    } catch (e) {
        error(res, e);
    }
});
router.put(
    "/sessions/:classId/:sessionId/assessment",
    context,
    async (req, res) => {
        try {
            const { studentId, rating, note } = req.body;
            if (
                !req.dcClass ||
                !oid(studentId) ||
                !["good", "complete", "incomplete"].includes(rating)
            )
                return res
                    .status(400)
                    .json({ message: "Đánh giá không hợp lệ" });
            if (
                !(await studentsFor(req.dcClass)).some(
                    (s) => String(s._id) === studentId,
                )
            )
                return res
                    .status(404)
                    .json({ message: "Học sinh không thuộc lớp" });
            const session = await Session.findOne({
                _id: req.params.sessionId,
                classId: req.dcClass._id,
            });
            if (!session)
                return res
                    .status(404)
                    .json({ message: "Không tìm thấy buổi học" });
            session.assessments = session.assessments.filter(
                (a) => String(a.studentId) !== studentId,
            );
            session.assessments.push({
                studentId,
                rating,
                note: String(note || ""),
            });
            await session.save();
            res.json({ session });
        } catch (e) {
            error(res, e);
        }
    },
);
router.get("/remarks", context, async (req, res) => {
    try {
        if (!req.dcClass) return res.status(400).json({ message: "Chọn lớp" });
        res.json({
            students: await studentsFor(req.dcClass),
            remarks: await Remark.find({
                classId: req.dcClass._id,
                subject: String(req.query.subject || "Chung"),
            }).lean(),
        });
    } catch (e) {
        error(res, e);
    }
});
router.put("/remarks/:classId/:studentId", context, async (req, res) => {
    try {
        if (
            !req.dcClass ||
            !(await studentsFor(req.dcClass)).some(
                (s) => String(s._id) === req.params.studentId,
            )
        )
            return res.status(403).json({ message: "Không có quyền" });
        const {
            subject = "Chung",
            performance = "complete",
            character = "pass",
            comment = "",
        } = req.body;
        if (
            !["good", "complete", "incomplete"].includes(performance) ||
            !["good", "pass", "improve"].includes(character)
        )
            return res
                .status(400)
                .json({ message: "Mức đánh giá không hợp lệ" });
        const remark = await Remark.findOneAndUpdate(
            {
                classId: req.dcClass._id,
                studentId: req.params.studentId,
                subject,
            },
            { $set: { performance, character, comment } },
            { upsert: true, new: true, runValidators: true },
        );
        res.json({ remark });
    } catch (e) {
        error(res, e);
    }
});
module.exports = router;
