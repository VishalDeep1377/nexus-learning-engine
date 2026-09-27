/**
 * types/mcp.ts
 *
 * Canonical type definitions for the MCP Context Server integration.
 * Used by:
 *   - lib/buildLearnerContext.ts
 *   - app/api/(user)/roadmap/route.ts
 *
 * The MCP server (mcp-servers/mentor-context/) uses its own copy of
 * these interfaces since it cannot import from @/ path aliases.
 */

// ── Job Market Types ──────────────────────────────────────────────────────────

export interface JobContext {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  postedAt?: string;
  /** Skills extracted from the job description (empty if no description provided) */
  skills: string[];
}

export interface SkillSignal {
  skill: string;
  frequency: number; // Number of jobs mentioning this skill
}

export interface JobMarketContext {
  source: "LinkedIn Jobs API";
  retrievedAt: string;
  jobCount: number;
  jobs: JobContext[];
  topSkills: SkillSignal[];
  /** True if descriptions were available to extract skills from */
  skillsExtractedFromDescriptions: boolean;
}

// ── Career Preferences ────────────────────────────────────────────────────────

export interface CareerParams {
  skill: string;
  experience: string;
  learningPreference: string;
  expectedOutcome: string;
}

// ── Performance Types ─────────────────────────────────────────────────────────

export interface CodingPerformance {
  attempts: number;
  averageScore: number; // 0–100
  weakTopics: string[];
  strongTopics: string[];
}

export interface QuizPerformance {
  attempts: number;
  accuracy: number; // 0–100 %
  weakTopics: string[];
  strongTopics: string[];
}

export interface AptitudePerformance {
  attempts: number;
  accuracy: number; // 0–100 %
  weakCategories: string[];
}

export interface SpeechPerformance {
  attempts: number;
  averageScore: number; // 0–10
  weakAreas: string[];
}

// ── Learner Context ───────────────────────────────────────────────────────────

export interface LearnerProfile {
  userId: string;
  name?: string;
  experienceLevel?: string;
  /** High-level current skills inferred from existing roadmaps and strong assessment areas */
  currentSkills?: string[];
}

export interface LearnerContextLearning {
  /** Titles of active/existing roadmaps */
  activeRoadmapTitles: string[];
  /** How many steps completed across all roadmaps */
  totalCompletedSteps: number;
  /** Individual step strings from all roadmaps — used for missingSkills derivation */
  completedTopics: string[];
}

export interface SkillGap {
  /**
   * Topics where learner consistently scores ≥60 in assessments.
   * If no assessment data, this is [].
   */
  strengths: string[];
  /**
   * Topics where learner consistently scores <60 in assessments.
   * If no assessment data, this is [].
   */
  weakAreas: string[];
  /**
   * topMarketSkills − strengths − alreadyInCurrentRoadmaps.
   * Only populated when job data is available. Otherwise [].
   */
  missingSkills: string[];
}

export interface ActiveHackathonProject {
  title: string;
  status: string;
  hackathonName?: string;
  problemStatement?: string;
}

/**
 * Structured context summary passed to Gemini.
 * This is the FILTERED subset of LearnerContext — no PII.
 */
export interface GeminiLearnerContext {
  profile: LearnerProfile;
  learning: LearnerContextLearning;
  performance: {
    coding?: CodingPerformance;
    quiz?: QuizPerformance;
    aptitude?: AptitudePerformance;
    speech?: SpeechPerformance;
  };
  skillGap: SkillGap;
  career: CareerParams;
  projects: { activeHackathonProjects: ActiveHackathonProject[] };
  jobMarket?: JobMarketContext;
  /** Machine-readable summary generated from actual data */
  summary: {
    currentLevel: string;
    targetRole: string;
    strongSkills: string[];
    weakSkills: string[];
    topMarketSkills: string[];
    priorityAreas: string[];
  };
}

// ── MCP Response ──────────────────────────────────────────────────────────────

export interface MCPContextResponse {
  source: "mcp" | "fallback";
  available: boolean;
  contextVersion: "1.0";
  generatedAt: string;
  context: GeminiLearnerContext;
}

// ── Input/Output types for the roadmap route ──────────────────────────────────

export interface RoadmapRequestBody {
  skill: string;
  experience: string;
  learningPreference: string;
  expectedOutcome: string;
}

export interface RoadmapAIOutput {
  roadmap: string[];
  resources: string[];
}
