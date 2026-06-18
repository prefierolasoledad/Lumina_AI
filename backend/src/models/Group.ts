import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Group name is required'], trim: true },
    grade: { type: String, default: '' }, // e.g. "Class 10-A" or "B.Tech Sem 4"
    subject: { type: String, default: '' },
    description: { type: String, default: '' },
    studentCount: { type: Number, default: 0, min: 0 },
    color: { type: String, default: 'indigo' }, // UI accent tag
  },
  { timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);
export default Group;
