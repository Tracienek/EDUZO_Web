// server/src/controllers/search.controller.js
const Student = require("../models/Student");
const Class = require("../models/Class");

exports.search = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q) return res.json({ metadata: { students: [], classes: [] } });

        const regex = new RegExp(q, "i");

        const students = await Student.find({
            $or: [{ fullName: regex }, { email: regex }],
        })
            .limit(8)
            .select("fullName email")
            .lean();

        // 2) map studentId -> class (tìm class chứa student)
        const studentIds = students.map((s) => s._id);

        // Lấy các class có chứa bất kỳ studentId nào
        // NOTE: select thêm folderId/folderName nếu model Class của bạn có (hiện model bạn gửi chưa có)
        const classesOfStudents = await Class.find({
            students: { $in: studentIds },
        })
            .select("name subject students folderId folderName")
            .lean();

        const studentIdToClass = new Map();
        for (const c of classesOfStudents) {
            for (const sid of c.students || []) {
                // nếu 1 student có thể thuộc nhiều lớp, dòng này sẽ lấy lớp đầu tiên
                // muốn ưu tiên lớp mới nhất thì xử lý sort bên trên
                if (!studentIdToClass.has(String(sid))) {
                    studentIdToClass.set(String(sid), c);
                }
            }
        }

        // 3) enrich students để FE nav được
        const studentsEnriched = students.map((s) => {
            const c = studentIdToClass.get(String(s._id));
            return {
                ...s,
                classId: c?._id || null,
                className: c?.name || "",
                folderId: c?.folderId || null,
                folderName: c?.folderName || "",
            };
        });

        // 4) tìm classes match như cũ
        const classes = await Class.find({
            $or: [{ name: regex }, { subject: regex }],
        })
            .limit(8)
            .select(
                "name subject folderId folderName scheduleText durationMinutes",
            )
            .lean();

        return res.json({ metadata: { students: studentsEnriched, classes } });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
