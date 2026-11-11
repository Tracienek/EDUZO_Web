const Student = require("../models/Student");
const Class = require("../models/Class");
const ClassNote = require("../models/ClassNote");

exports.getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id).lean();
        if (!student)
            return res.status(404).json({ message: "Student not found" });

        // tìm class mà student đang thuộc về (vì Class.students là array)
        const klass = await Class.findOne({ students: id })
            .select(
                "name scheduleText durationMinutes totalSessions heldCount tuitionEmailSentAt tuitionCycleStartHeldCount",
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

exports.listStudentNotes = async (req, res) => {
    try {
        const { id } = req.params;

        const notes = await ClassNote.find({ studentId: id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ metadata: { notes } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load notes" });
    }
};

exports.createStudentNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, classId } = req.body;

        if (!content || !String(content).trim()) {
            return res.status(400).json({ message: "Content is required" });
        }

        const note = await ClassNote.create({
            content: String(content).trim(),
            classId: classId || null,
            studentId: id,
            // tùy hệ auth của bạn:
            createdBy: req.user?._id || null,
        });

        return res.status(201).json({ metadata: { note } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create note" });
    }
};
