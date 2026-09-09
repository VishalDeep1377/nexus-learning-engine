import mongoose, { Schema } from "mongoose";
import { HackathonStatus } from "@/types/hackathon";

const hackathonSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    themes: [{ type: String, trim: true }],
    technologies: [{ type: String, trim: true }],
    rules: { type: String },
    judgingCriteria: { type: String },
    difficulties: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      default: "INTERMEDIATE",
    },
    prizeInfo: { type: String },
    sourceUrl: { type: String },
    sourceName: { type: String },
    status: {
      type: String,
      enum: ["UPCOMING", "ACTIVE", "ENDED"],
      default: "UPCOMING",
    },
    isSeeded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Hackathon =
  mongoose.models?.Hackathon ||
  mongoose.model("Hackathon", hackathonSchema);

export default Hackathon;
