import mongoose from 'mongoose';

const flashcardScoreSchema = new mongoose.Schema({
  flashcard_id: { type: String, required: true },
  confidence: { type: Number, enum: [1, 2, 3], required: true }, // 1 = Low, 2 = Medium, 3 = High
  reviewed_at: { type: Date, default: Date.now }
}, { _id: false });

const practiceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  kitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewKit',
    required: true,
    index: true
  },
  records: [flashcardScoreSchema]
}, {
  timestamps: true
});

export const PracticeRecord = mongoose.model('PracticeRecord', practiceSessionSchema);
