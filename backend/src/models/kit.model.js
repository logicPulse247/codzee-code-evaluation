import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  kind: { type: String, enum: ['technical', 'behavioural', 'domain'], default: 'technical' },
  priority: { type: String, enum: ['must', 'nice'], default: 'must' }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  requirement_ids: [{ type: String }],
  category: { type: String, enum: ['technical', 'behavioural', 'system-design', 'company-fit'], default: 'technical' },
  prompt: { type: String, required: true },
  answer_outline: { type: mongoose.Schema.Types.Mixed, default: '' },
  difficulty: { type: Number, min: 1, max: 5, default: 2 },
  status: { type: String, enum: ['generated', 'edited', 'pinned'], default: 'generated' },
  is_edited: { type: Boolean, default: false }
}, { _id: false });

const flashcardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  requirement_ids: [{ type: String }],
  status: { type: String, enum: ['generated', 'edited', 'pinned'], default: 'generated' },
  is_edited: { type: Boolean, default: false }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  focus: { type: String, required: true },
  question_ids: [{ type: String }],
  minutes: { type: Number, required: true }
}, { _id: false });

const crawledPageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: '' }
}, { _id: false });

const skippedPageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  reason: { type: String, default: '' },
  status: { type: Number, default: 0 }
}, { _id: false });

const processStepSchema = new mongoose.Schema({
  round_name: { type: String, required: true },
  description: { type: String, default: '' }
}, { _id: false });

const publicSourceSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, default: '' },
  source_type: { type: String, default: 'public' }
}, { _id: false });

const kitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  research: {
    crawled_pages: { type: [crawledPageSchema], default: [] },
    skipped_pages: { type: [skippedPageSchema], default: [] },
    process_steps: { type: [processStepSchema], default: [] },
    insights: { type: [String], default: [] },
    public_sources: { type: [publicSourceSchema], default: [] },
    interview_summary: { type: String, default: '' }
  },
  source: {
    company: { type: String, default: '' },
    company_url: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    jd_chars: { type: Number, default: 0 },
    researched_at: { type: String, default: '' },
    pages_used: [{ type: String }]
  },
  company_brief: {
    summary: { type: String, default: '' },
    what_they_do: { type: String, default: '' },
    sources: [{ type: String }],
    status: { type: String, enum: ['generated', 'edited', 'pinned'], default: 'generated' }
  },
  role: {
    title: { type: String, default: '' },
    seniority: { type: String, default: '' },
    responsibilities: [{ type: String }],
    requirements: [requirementSchema]
  },
  questions: [questionSchema],
  flashcards: [flashcardSchema],
  schedule: {
    days_available: { type: Number, required: true, default: 5 },
    days: [dayScheduleSchema]
  },
  coverage: {
    uncovered_requirement_ids: [{ type: String }],
    passes: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

export const InterviewKit = mongoose.model('InterviewKit', kitSchema);
