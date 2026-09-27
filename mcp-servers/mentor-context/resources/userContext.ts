/**
 * mcp-servers/mentor-context/resources/userContext.ts
 *
 * Thin wrapper that delegates to the shared buildLearnerContext function.
 * This keeps the MCP resource handler clean and avoids duplicating
 * the MongoDB aggregation logic that already exists.
 */

import mongoose from "mongoose";
import { buildLearnerContext, CareerParams, JobContext, SkillSignal } from "../lib/buildLearnerContext.js";

// ── MCP Response Types ────────────────────────────────────────────────────────

export interface MCPContextRequest {
  userId: string;
  careerParams?: Partial<CareerParams>;
  jobData?: JobContext[];
  topSkills?: SkillSignal[];
}

export interface MCPContextResponse {
  source: "mcp";
  available: boolean;
  contextVersion: "1.0";
  generatedAt: string;
  context: Record<string, any>;
}

// ── Safe empty response returned on any error ─────────────────────────────────
function emptyMCPResponse(userId: string): MCPContextResponse {
  return {
    source: "mcp",
    available: true,
    contextVersion: "1.0",
    generatedAt: new Date().toISOString(),
    context: {
      profile: { userId, name: "", experienceLevel: "", currentSkills: [] },
      learning: { activeRoadmapTitles: [], totalCompletedSteps: 0, completedTopics: [] },
      performance: { coding: undefined, quiz: undefined, aptitude: undefined, speech: undefined },
      skillGap: { strengths: [], weakAreas: [], missingSkills: [] },
      career: { skill: "", experience: "", learningPreference: "", expectedOutcome: "" },
      projects: { activeHackathonProjects: [] },
      jobMarket: undefined,
      summary: {
        currentLevel: "",
        targetRole: "",
        strongSkills: [],
        weakSkills: [],
        topMarketSkills: [],
        priorityAreas: [],
      },
    },
  };
}

// ── Ensure MongoDB is connected ───────────────────────────────────────────────
async function ensureConnected(): Promise<void> {
  if (mongoose.connection.readyState === 1) return; // already connected

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("[mentor-context] MONGODB_URI environment variable is not set");

  await mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 5 });
  console.log("[mentor-context] MongoDB connected");
}

// ── Main context handler ──────────────────────────────────────────────────────

/**
 * Build and return the full MCP context response for a user.
 * Never throws — returns a safe empty context on any error.
 */
export async function getUserMCPContext(request: MCPContextRequest): Promise<MCPContextResponse> {
  const { userId, careerParams, jobData = [], topSkills = [] } = request;

  try {
    // Validate userId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn("[mentor-context] Invalid or missing userId:", userId);
      return emptyMCPResponse(userId ?? "unknown");
    }

    await ensureConnected();

    const career: CareerParams = {
      skill: careerParams?.skill ?? "",
      experience: careerParams?.experience ?? "",
      learningPreference: careerParams?.learningPreference ?? "",
      expectedOutcome: careerParams?.expectedOutcome ?? "",
    };

    const context = await buildLearnerContext(userId, career, jobData, topSkills);

    return {
      source: "mcp",
      available: true,
      contextVersion: "1.0",
      generatedAt: new Date().toISOString(),
      context,
    };
  } catch (err) {
    // Never crash the roadmap request due to context fetch failure
    console.error("[mentor-context] getUserMCPContext error:", err);
    return emptyMCPResponse(userId ?? "unknown");
  }
}

// ── Legacy: keep backward-compatible getUserContext for existing /resource use ─

export interface UserContextResult {
  userId: string;
  studentName: string;
  hasRoadmap: boolean;
  targetRoles: string[];
  currentWeakAreas: string[];
  latestInterview: null;
}

export async function getUserContext(userId: string): Promise<UserContextResult> {
  try {
    await ensureConnected();

    const context = await buildLearnerContext(
      userId,
      { skill: "", experience: "", learningPreference: "", expectedOutcome: "" },
      [],
      []
    );

    return {
      userId,
      studentName: context.profile?.name ?? "",
      hasRoadmap: (context.learning?.activeRoadmapTitles ?? []).length > 0,
      targetRoles: context.learning?.activeRoadmapTitles ?? [],
      currentWeakAreas: context.skillGap?.weakAreas ?? [],
      latestInterview: null,
    };
  } catch (err) {
    console.error("[mentor-context] getUserContext error:", err);
    return {
      userId,
      studentName: "",
      hasRoadmap: false,
      targetRoles: [],
      currentWeakAreas: [],
      latestInterview: null,
    };
  }
}
