import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  type: { type: String, enum: ['mcq', 'short', 'long', 'numerical', 'diagram'], default: 'short' },
  options: [String], // for MCQ
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },       // e.g. "Section A"
  instruction: { type: String, default: '' },    // e.g. "Attempt all questions"
  questions: [questionSchema],
});

const assignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    timeLimit: { type: Number, default: 60 }, // minutes
    dueDate: { type: String },
    additionalInfo: { type: String, default: '' },
    questionRows: [
      {
        type: { type: String },
        count: Number,
        marks: Number,
      },
    ],
    totalMarks: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    sections: [sectionSchema],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
