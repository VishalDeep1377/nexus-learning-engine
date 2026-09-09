import mongoose from 'mongoose';

export interface ICodingAttempt {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  challengeTitle: string;
  language: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
  passedTests: number;
  totalTests: number;
  score: number; // 0-100
  timeComplexity?: string;
  spaceComplexity?: string;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  createdAt?: Date;
}

const CodingAttemptSchema = new mongoose.Schema<ICodingAttempt>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeTitle: { type: String, required: true },
    language: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    code: { type: String, required: true },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    timeComplexity: String,
    spaceComplexity: String,
    feedback: {
      strengths: [String],
      weaknesses: [String],
      suggestions: [String],
    },
  },
  { timestamps: true }
);

export const CodingAttempt =
  mongoose.models?.CodingAttempt ||
  mongoose.model<ICodingAttempt>('CodingAttempt', CodingAttemptSchema);

export default CodingAttempt;
