import mongoose,{Schema} from "mongoose";
import Roadmap from "./roadmap.model";

// Define the IUser interface
export interface IUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string; // Password is optional for OAuth users
  role?: string;
  provider?: string; // Store the provider (Google, GitHub, etc.)
  providerId?: string; // Store the provider's unique user ID (e.g., Google/GitHub user ID)
  createdAt?: Date;
  updatedAt?: Date;
  AiMentorChats?:mongoose.Types.ObjectId[];
  roadmaps?:mongoose.Types.ObjectId[],
  questionsAsked?:mongoose.Types.ObjectId[],
  answersGiven?:mongoose.Types.ObjectId[];
  image?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  address?: string;
  gender?: string;
  userName?: string;
  phoneNumber?: string;
  // --- Gamification ---
  xp?: number;
  level?: number;
  badges?: string[];
  streak?: {
    current: number;
    highest: number;
    lastActiveDate?: Date;
  };
  // --- Adaptive Roadmap Trigger ---
  skillSnapshot?: {
    strengths: string[];
    weakAreas: string[];
    missingSkills: string[];
    priorityAreas: string[];
    timestamp?: Date;
  };
  adaptationNotice?: {
    adaptationRequired: boolean;
    reason: string;
    improvedSkills: string[];
    newWeakSkills: string[];
    resolvedWeakSkills: string[];
    newMissingSkills: string[];
    changedPriorityAreas: string[];
    timestamp?: Date;
    dismissed?: boolean;
  };
  jobSearchCount?: number;
  savedJobs?: {
    jobId: string;
    title: string;
    company: string;
    location: string;
    jobUrl?: string;
    salary?: string;
    postedAgo?: string;
    savedAt?: Date;
  }[];
}

// Define the user schema
const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Make password optional for OAuth users
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ["google", "github"],
      required: false,
    },
    providerId: {
      type: String,
      required: false, // Store the OAuth provider's user ID
    },
    AiMentorChats:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat"
       }
    ],
    roadmaps:[
      {
       type:mongoose.Schema.Types.ObjectId,
       ref:"Roadmap"
      }
  ],
  questionsAsked: [{
    type: Schema.Types.ObjectId,
    ref: 'Post' // Questions the user has asked
  }],
  answersGiven: [{
    type: Schema.Types.ObjectId,
    ref: 'Answer' // Answers the user has provided
  }],
  image: { type: String },
  bio: { type: String },
  githubUrl: { type: String },
  linkedinUrl: { type: String },
  address: { type: String },
  gender: { type: String },
  userName: { type: String },
  phoneNumber: { type: String },
  // --- Gamification ---
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  streak: {
    current: { type: Number, default: 0 },
    highest: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
  },
  // --- Adaptive Roadmap Trigger ---
  skillSnapshot: {
    strengths: [{ type: String }],
    weakAreas: [{ type: String }],
    missingSkills: [{ type: String }],
    priorityAreas: [{ type: String }],
    timestamp: { type: Date, default: Date.now },
  },
  adaptationNotice: {
    adaptationRequired: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    improvedSkills: [{ type: String }],
    newWeakSkills: [{ type: String }],
    resolvedWeakSkills: [{ type: String }],
    newMissingSkills: [{ type: String }],
    changedPriorityAreas: [{ type: String }],
    timestamp: { type: Date, default: Date.now },
    dismissed: { type: Boolean, default: false },
  },
  // --- Job Agent Limits & Saved Jobs ---
  jobSearchCount: { type: Number, default: 0 },
  savedJobs: [
    {
      jobId: { type: String, required: true },
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String, required: true },
      jobUrl: { type: String },
      salary: { type: String },
      postedAgo: { type: String },
      savedAt: { type: Date, default: Date.now },
    },
  ],
  },
  {
    timestamps: true,
  }
);

// Export the model
export const User = mongoose.models?.User || mongoose.model<IUser>("User", userSchema);
export default User;
