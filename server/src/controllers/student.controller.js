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
