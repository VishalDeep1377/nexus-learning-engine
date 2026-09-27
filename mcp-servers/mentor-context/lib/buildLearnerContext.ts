/**
 * mcp-servers/mentor-context/lib/buildLearnerContext.ts
 *
 * This is the MCP-server-local copy of lib/buildLearnerContext.ts.
 * The MCP server is a separate Node.js process and cannot import
 * from Next.js @/ path aliases.
 *
 * KEEP IN SYNC with: lib/buildLearnerContext.ts (root Next.js project)
 * All logic is identical — only the import paths differ.
 */

import mongoose from "mongoose";

// ── Minimal inline schemas (avoiding @/ aliases) ──────────────────────────────

const CodingAttemptSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  topic: String,
  score: Number,
}, { timestamps: true });

const QuizAttemptSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  percentage: Number,
  weakTopics: [String],
  strongTopics: [String],
}, { timestamps: true });

const AptitudeAttemptSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  percentage: Number,
  weakCategories: [String],
}, { timestamps: true });

const SpeechAttemptSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  scores: { overall: Number },
  weaknesses: [String],
}, { timestamps: true });

const HackathonProjectSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  status: String,
  hackathonName: String,
  problemStatement: String,
}, { timestamps: true });

const RoadmapSchema = new mongoose.Schema({
  title: String,
  steps: [String],
  completedSteps: [{
    userId: mongoose.Schema.Types.ObjectId,
    stepIndices: [Number],
  }],
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String,
  roadmaps: [{ type: mongoose.Schema.Types.ObjectId, ref: "Roadmap" }],
}, { timestamps: true });

// Guard against model re-compilation in long-running MCP process
const MCPCodingAttempt = mongoose.models.CodingAttempt || mongoose.model("CodingAttempt", CodingAttemptSchema);
const MCPQuizAttempt = mongoose.models.QuizAttempt || mongoose.model("QuizAttempt", QuizAttemptSchema);
const MCPAptitudeAttempt = mongoose.models.AptitudeAttempt || mongoose.model("AptitudeAttempt", AptitudeAttemptSchema);
const MCPSpeechAttempt = mongoose.models.SpeechAttempt || mongoose.model("SpeechAttempt", SpeechAttemptSchema);
const MCPHackathonProject = mongoose.models.HackathonProject || mongoose.model("HackathonProject", HackathonProjectSchema);
const MCPRoadmap = mongoose.models.Roadmap || mongoose.model("Roadmap", RoadmapSchema);
const MCPUser = mongoose.models.User || mongoose.model("User", UserSchema);

// ── Type definitions (duplicated from types/mcp.ts for standalone use) ────────

export interface CareerParams {
  skill: string;
  experience: string;
  learningPreference: string;
  expectedOutcome: string;
}

export interface JobContext {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  postedAt?: string;
  skills: string[];
}

export interface SkillSignal {
  skill: string;
  frequency: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STRENGTH_THRESHOLD = 60;

function buildCodingPerf(attempts: any[]) {
  if (!attempts || attempts.length === 0) return undefined;
  const avgScore = Math.round(
    attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length
  );
  const weak = [...new Set(
    attempts.filter(a => (a.score ?? 0) < STRENGTH_THRESHOLD).map(a => a.topic)
  )].filter(Boolean).slice(0, 5) as string[];
  const strong = [...new Set(
    attempts.filter(a => (a.score ?? 0) >= STRENGTH_THRESHOLD).map(a => a.topic)
  )].filter(Boolean).slice(0, 5) as string[];
  return { attempts: attempts.length, averageScore: avgScore, weakTopics: weak, strongTopics: strong };
}

function buildQuizPerf(attempts: any[]) {
  if (!attempts || attempts.length === 0) return undefined;
  const avgAccuracy = Math.round(
    attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length
  );
  const weak = [...new Set(attempts.flatMap(a => a.weakTopics ?? []))].slice(0, 5) as string[];
  const strong = [...new Set(attempts.flatMap(a => a.strongTopics ?? []))].slice(0, 5) as string[];
  return { attempts: attempts.length, accuracy: avgAccuracy, weakTopics: weak, strongTopics: strong };
}

function buildAptitudePerf(attempts: any[]) {
  if (!attempts || attempts.length === 0) return undefined;
  const avgAccuracy = Math.round(
    attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length
  );
  const weakCats = [...new Set(attempts.flatMap(a => a.weakCategories ?? []))].slice(0, 5) as string[];
  return { attempts: attempts.length, accuracy: avgAccuracy, weakCategories: weakCats };
}

function buildSpeechPerf(attempts: any[]) {
  if (!attempts || attempts.length === 0) return undefined;
  const avgScore = Math.round(
    (attempts.reduce((s, a) => s + (a.scores?.overall ?? 0), 0) / attempts.length) * 10
  ) / 10;
  const weakAreas = [...new Set(
    attempts.filter(a => (a.scores?.overall ?? 10) < 6).flatMap(a => a.weaknesses ?? [])
  )].slice(0, 5) as string[];
  return { attempts: attempts.length, averageScore: avgScore, weakAreas };
}

function deriveMissingSkills(
  topSkills: SkillSignal[],
  strengths: string[],
  roadmapSteps: string[]
): string[] {
  if (!topSkills || topSkills.length === 0) return [];
  const lowerStrengths = strengths.map(s => s.toLowerCase());
  const lowerSteps = roadmapSteps.join(" ").toLowerCase();
  return topSkills
    .map(s => s.skill)
    .filter(skill => {
      const lower = skill.toLowerCase();
      return !lowerStrengths.some(str => str.includes(lower) || lower.includes(str))
        && !lowerSteps.includes(lower);
    })
    .slice(0, 8);
}

// ── Main Builder ──────────────────────────────────────────────────────────────

export async function buildLearnerContext(
  userId: string,
  career: CareerParams,
  jobData: JobContext[],
  topSkills: SkillSignal[]
): Promise<Record<string, any>> {
  const dbUserId = new mongoose.Types.ObjectId(userId);

  const [
    user,
    codingAttempts,
    quizAttempts,
    aptitudeAttempts,
    speechAttempts,
    hackathonProjects,
  ] = await Promise.all([
    MCPUser.findById(userId).populate("roadmaps").lean(),
    MCPCodingAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(20).lean(),
    MCPQuizAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
    MCPAptitudeAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
    MCPSpeechAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
    MCPHackathonProject.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  const roadmaps: any[] = (user as any)?.roadmaps ?? [];
  const activeRoadmapTitles = roadmaps.map(r => r.title).filter(Boolean);
  const allSteps = roadmaps.flatMap(r => r.steps ?? []) as string[];

  let totalCompletedSteps = 0;
  for (const r of roadmaps) {
    const up = (r.completedSteps ?? []).find((p: any) => p.userId?.toString() === userId);
    if (up) totalCompletedSteps += up.stepIndices?.length ?? 0;
  }

  const codingPerf = buildCodingPerf(codingAttempts as any[]);
  const quizPerf = buildQuizPerf(quizAttempts as any[]);
  const aptitudePerf = buildAptitudePerf(aptitudeAttempts as any[]);
  const speechPerf = buildSpeechPerf(speechAttempts as any[]);

  const strengths = [...new Set([...(codingPerf?.strongTopics ?? []), ...(quizPerf?.strongTopics ?? [])])];
  const weakAreas = [...new Set([
    ...(codingPerf?.weakTopics ?? []),
    ...(quizPerf?.weakTopics ?? []),
    ...(aptitudePerf?.weakCategories ?? []),
    ...(speechPerf?.weakAreas ?? []),
  ])];
  const missingSkills = deriveMissingSkills(topSkills, strengths, allSteps);

  const currentSkills = [...new Set([...activeRoadmapTitles, ...strengths])].slice(0, 10);

  const activeHackathonProjects = (hackathonProjects as any[]).map(h => ({
    title: h.title ?? "",
    status: h.status ?? "",
    hackathonName: h.hackathonName,
    problemStatement: h.problemStatement?.slice(0, 80),
  }));

  const jobMarket = jobData.length > 0 ? {
    source: "LinkedIn Jobs API",
    retrievedAt: new Date().toISOString(),
    jobCount: jobData.length,
    jobs: jobData,
    topSkills,
    skillsExtractedFromDescriptions: jobData.some(j => j.description && j.description.length > 0),
  } : undefined;

  const topMarketSkillNames = topSkills.slice(0, 5).map(s => s.skill);
  const priorityAreas = [...new Set([...weakAreas.slice(0, 3), ...missingSkills.slice(0, 3)])];

  return {
    profile: {
      userId,
      name: (user as any)?.name,
      experienceLevel: career.experience,
      currentSkills,
    },
    learning: {
      activeRoadmapTitles,
      totalCompletedSteps,
      completedTopics: allSteps,
    },
    performance: { coding: codingPerf, quiz: quizPerf, aptitude: aptitudePerf, speech: speechPerf },
    skillGap: { strengths, weakAreas, missingSkills },
    career,
    projects: { activeHackathonProjects },
    jobMarket,
    summary: {
      currentLevel: career.experience,
      targetRole: `${career.skill} — ${career.expectedOutcome}`,
      strongSkills: strengths.slice(0, 5),
      weakSkills: weakAreas.slice(0, 5),
      topMarketSkills: topMarketSkillNames,
      priorityAreas: priorityAreas.slice(0, 6),
    },
  };
}
