/**
 * lib/buildLearnerContext.ts
 *
 * Shared learner context builder used by:
 *   1. mcp-servers/mentor-context (via relative import — cannot use @/ aliases)
 *   2. app/api/(user)/roadmap/route.ts (fallback when MCP is unavailable)
 *
 * IMPORTANT: This function ONLY builds context. It does NOT generate roadmaps.
 * It does NOT modify any documents. Read-only MongoDB access.
 *
 * The MCP server accesses this logic through its own local copy in
 * mcp-servers/mentor-context/lib/buildLearnerContext.ts (identical source).
 * We keep this copy here for the Next.js fallback path.
 */

import mongoose from "mongoose";
import {
  GeminiLearnerContext,
  CareerParams,
  JobContext,
  SkillSignal,
  CodingPerformance,
  QuizPerformance,
  AptitudePerformance,
  SpeechPerformance,
  SkillGap,
} from "@/types/mcp";
import User from "@/models/user.model";
import CodingAttempt from "@/models/codingAttempt.model";
import QuizAttempt from "@/models/quizAttempt.model";
import AptitudeAttempt from "@/models/aptitudeAttempt.model";
import SpeechAttempt from "@/models/speechAttempt.model";
import HackathonProject from "@/models/hackathonProject.model";
import Roadmap from "@/models/roadmap.model";
import "@/models/post.model";
import "@/models/answer.model";
import "@/models/chat.model";
import "@/models/message.model";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Score threshold for "strong" topic classification */
const STRENGTH_THRESHOLD = 60;

function buildCodingPerf(attempts: any[]): CodingPerformance | undefined {
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

function buildQuizPerf(attempts: any[]): QuizPerformance | undefined {
  if (!attempts || attempts.length === 0) return undefined;
  const avgAccuracy = Math.round(
    attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length
  );
  const weak = [...new Set(attempts.flatMap(a => a.weakTopics ?? []))].slice(0, 5) as string[];
  const strong = [...new Set(attempts.flatMap(a => a.strongTopics ?? []))].slice(0, 5) as string[];
  return { attempts: attempts.length, accuracy: avgAccuracy, weakTopics: weak, strongTopics: strong };
}

function buildAptitudePerf(attempts: any[]): AptitudePerformance | undefined {
  if (!attempts || attempts.length === 0) return undefined;
  const avgAccuracy = Math.round(
    attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length
  );
  const weakCats = [...new Set(attempts.flatMap(a => a.weakCategories ?? []))].slice(0, 5) as string[];
  return { attempts: attempts.length, accuracy: avgAccuracy, weakCategories: weakCats };
}

function buildSpeechPerf(attempts: any[]): SpeechPerformance | undefined {
  if (!attempts || attempts.length === 0) return undefined;
  const avgScore = Math.round(
    (attempts.reduce((s, a) => s + (a.scores?.overall ?? 0), 0) / attempts.length) * 10
  ) / 10;
  const weakAreas = [...new Set(
    attempts.filter(a => (a.scores?.overall ?? 10) < 6).flatMap(a => a.weaknesses ?? [])
  )].slice(0, 5) as string[];
  return { attempts: attempts.length, averageScore: avgScore, weakAreas };
}

/**
 * Derive missingSkills deterministically:
 * topMarketSkills − strengths − topics already in user's roadmap steps.
 * Returns [] if no job data is available.
 */
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
      const alreadyStrong = lowerStrengths.some(str => str.includes(lower) || lower.includes(str));
      const inRoadmap = lowerSteps.includes(lower);
      return !alreadyStrong && !inRoadmap;
    })
    .slice(0, 8);
}

// ── Main Builder ──────────────────────────────────────────────────────────────

/**
 * Build a GeminiLearnerContext from MongoDB + supplied job data.
 * This function is deliberately read-only and never writes to the DB.
 *
 * @param userId   MongoDB ObjectId string
 * @param career   Career parameters from the roadmap request
 * @param jobData  Normalized job listings from LinkedIn (may be empty)
 * @param topSkills Computed skill frequency signals (may be empty)
 */
export async function buildLearnerContext(
  userId: string,
  career: CareerParams,
  jobData: JobContext[],
  topSkills: SkillSignal[]
): Promise<GeminiLearnerContext> {
  const dbUserId = new mongoose.Types.ObjectId(userId);

  // Parallel fetch — everything runs simultaneously for performance
  const [
    userWithRoadmaps,
    codingAttempts,
    quizAttempts,
    aptitudeAttempts,
    speechAttempts,
    hackathonProjects,
  ] = await Promise.all([
    User.findById(userId).populate<{ roadmaps: any[] }>({ path: "roadmaps", model: Roadmap }).lean(),
    CodingAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(20).lean(),
    QuizAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
    AptitudeAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
    SpeechAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
    HackathonProject.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  // ── Profile (minimal — no PII to Gemini) ─────────────────────────────────
  const user = userWithRoadmaps as any;
  const roadmaps: any[] = user?.roadmaps ?? [];

  // ── Learning History ──────────────────────────────────────────────────────
  const activeRoadmapTitles = roadmaps.map((r: any) => r.title).filter(Boolean) as string[];
  const allSteps = roadmaps.flatMap((r: any) => r.steps ?? []) as string[];

  // Completed step count across all roadmaps for this user
  let totalCompletedSteps = 0;
  for (const r of roadmaps) {
    const userProgress = (r.completedSteps ?? []).find(
      (p: any) => p.userId?.toString() === userId
    );
    if (userProgress) totalCompletedSteps += userProgress.stepIndices?.length ?? 0;
  }

  // ── Performance ───────────────────────────────────────────────────────────
  const codingPerf = buildCodingPerf(codingAttempts as any[]);
  const quizPerf = buildQuizPerf(quizAttempts as any[]);
  const aptitudePerf = buildAptitudePerf(aptitudeAttempts as any[]);
  const speechPerf = buildSpeechPerf(speechAttempts as any[]);

  // ── Skill Gap ─────────────────────────────────────────────────────────────
  const strengths = [
    ...(codingPerf?.strongTopics ?? []),
    ...(quizPerf?.strongTopics ?? []),
  ];
  const weakAreas = [
    ...(codingPerf?.weakTopics ?? []),
    ...(quizPerf?.weakTopics ?? []),
    ...(aptitudePerf?.weakCategories ?? []),
    ...(speechPerf?.weakAreas ?? []),
  ];
  // Deduplicate
  const uniqueStrengths = [...new Set(strengths)];
  const uniqueWeakAreas = [...new Set(weakAreas)];
  const missingSkills = deriveMissingSkills(topSkills, uniqueStrengths, allSteps);

  const skillGap: SkillGap = {
    strengths: uniqueStrengths,
    weakAreas: uniqueWeakAreas,
    missingSkills,
  };

  // ── Current Skills (from roadmap titles + strong assessment topics) ────────
  const currentSkills = [...new Set([
    ...activeRoadmapTitles,
    ...uniqueStrengths,
  ])].slice(0, 10);

  // ── Hackathon Projects ────────────────────────────────────────────────────
  const activeHackathonProjects = (hackathonProjects as any[]).map(h => ({
    title: h.title ?? "",
    status: h.status ?? "",
    hackathonName: h.hackathonName,
    problemStatement: h.problemStatement?.slice(0, 80),
  }));

  // ── Job Market ────────────────────────────────────────────────────────────
  const jobMarketCtx = jobData.length > 0 ? {
    source: "LinkedIn Jobs API" as const,
    retrievedAt: new Date().toISOString(),
    jobCount: jobData.length,
    jobs: jobData,
    topSkills,
    skillsExtractedFromDescriptions: jobData.some(j => j.description && j.description.length > 0),
  } : undefined;

  // ── Summary ───────────────────────────────────────────────────────────────
  const topMarketSkillNames = topSkills.slice(0, 5).map(s => s.skill);
  const priorityAreas = [
    ...uniqueWeakAreas.slice(0, 3),
    ...missingSkills.slice(0, 3),
  ].filter(Boolean);

  const summary = {
    currentLevel: career.experience,
    targetRole: `${career.skill} — ${career.expectedOutcome}`,
    strongSkills: uniqueStrengths.slice(0, 5),
    weakSkills: uniqueWeakAreas.slice(0, 5),
    topMarketSkills: topMarketSkillNames,
    priorityAreas: [...new Set(priorityAreas)].slice(0, 6),
  };

  return {
    profile: {
      userId,
      name: user?.name,
      experienceLevel: career.experience,
      currentSkills,
    },
    learning: {
      activeRoadmapTitles,
      totalCompletedSteps,
      completedTopics: allSteps,
    },
    performance: {
      coding: codingPerf,
      quiz: quizPerf,
      aptitude: aptitudePerf,
      speech: speechPerf,
    },
    skillGap,
    career,
    projects: { activeHackathonProjects },
    jobMarket: jobMarketCtx,
    summary,
  };
}
