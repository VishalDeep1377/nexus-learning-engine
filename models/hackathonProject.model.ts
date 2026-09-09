import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    estimatedHours: { type: Number, default: 2 },
    dependencies: [{ type: String }],
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
      default: "TODO",
    },
    day: { type: Number },
  },
  { _id: false }
);

const hackathonProjectSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hackathonId: {
      type: Schema.Types.ObjectId,
      ref: "Hackathon",
      required: false,
    },
    title: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    problemStatement: { type: String },
    hackathonName: { type: String },
    hackathonRules: { type: String },
    hackathonJudgingCriteria: { type: String },
    deadline: { type: Date },
    teamSize: { type: Number, default: 1 },
    selectedIdea: { type: Schema.Types.Mixed }, // HackathonIdea JSON
    analysis: { type: Schema.Types.Mixed },     // HackathonAnalysis JSON
    architecture: { type: Schema.Types.Mixed }, // HackathonArchitecture JSON
    tasks: [taskSchema],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["IDEATION", "PLANNING", "BUILDING", "REVIEW", "SUBMITTED"],
      default: "IDEATION",
    },
    submission: { type: Schema.Types.Mixed },
    reviewResult: { type: Schema.Types.Mixed },
    pitch: { type: Schema.Types.Mixed },
    agentTrace: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const HackathonProject =
  mongoose.models?.HackathonProject ||
  mongoose.model("HackathonProject", hackathonProjectSchema);

export default HackathonProject;
