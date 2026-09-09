import mongoose from 'mongoose';

export interface IAptitudeAttempt {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: string;
  questionCount: number;
  score: number;
  total: number;
  percentage: number;
  timeTaken: number; // seconds
  weakCategories: string[];
  createdAt?: Date;
}

const AptitudeAttemptSchema = new mongoose.Schema<IAptitudeAttempt>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    questionCount: { type: Number, required: true },
    score: { type: Number, default: 0 },
    total: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    weakCategories: [String],
  },
  { timestamps: true }
);

export const AptitudeAttempt =
  mongoose.models?.AptitudeAttempt ||
  mongoose.model<IAptitudeAttempt>('AptitudeAttempt', AptitudeAttemptSchema);

export default AptitudeAttempt;
