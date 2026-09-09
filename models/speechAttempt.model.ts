import mongoose from 'mongoose';

export interface ISpeechAttempt {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  question: string;
  category: string;
  transcript: string;
  scores: {
    overall: number;
    relevance: number;
    structure: number;
    clarity: number;
    conciseness: number;
    grammar: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedAnswer?: string;
  createdAt?: Date;
}

const SpeechAttemptSchema = new mongoose.Schema<ISpeechAttempt>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true },
    category: { type: String, default: 'general' },
    transcript: { type: String, required: true },
    scores: {
      overall: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      conciseness: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
    },
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    improvedAnswer: String,
  },
  { timestamps: true }
);

export const SpeechAttempt =
  mongoose.models?.SpeechAttempt ||
  mongoose.model<ISpeechAttempt>('SpeechAttempt', SpeechAttemptSchema);

export default SpeechAttempt;
