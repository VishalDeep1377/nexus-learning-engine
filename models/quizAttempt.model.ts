import mongoose from 'mongoose';

export interface IQuizAttempt {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topic: string;
  questionCount: number;
  score: number;
  total: number;
  percentage: number;
  weakTopics: string[];
  strongTopics: string[];
  createdAt?: Date;
}

const QuizAttemptSchema = new mongoose.Schema<IQuizAttempt>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true },
    questionCount: { type: Number, required: true },
    score: { type: Number, default: 0 },
    total: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    weakTopics: [String],
    strongTopics: [String],
  },
  { timestamps: true }
);

export const QuizAttempt =
  mongoose.models?.QuizAttempt ||
  mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);

export default QuizAttempt;
