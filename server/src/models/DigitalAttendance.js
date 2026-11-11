const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  dateKey: { type: String, required: true },
  status: { type: String, enum: ['present','late','excused','unexcused'], required: true }
}, { timestamps: true });
schema.index({classId:1,studentId:1,dateKey:1},{unique:true});
module.exports = mongoose.models.DigitalAttendance || mongoose.model('DigitalAttendance',schema);
