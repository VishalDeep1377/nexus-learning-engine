// ─────────────────────────────────────────────────────────────────────────────
// Hackathon Lab — TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type HackathonStatus = "UPCOMING" | "ACTIVE" | "ENDED";
export type ProjectStatus = "IDEATION" | "PLANNING" | "BUILDING" | "REVIEW" | "SUBMITTED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
export type AgentStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type ReadinessLevel = "NOT_READY" | "EARLY" | "GOOD" | "DEMO_READY";

// ── Core Hackathon ────────────────────────────────────────────────────────────
export interface Hackathon {
  _id: string;
  name: string;
  organizer: string;
  description: string;
  deadline: string;
  themes: string[];
  technologies: string[];
  rules?: string;
  judgingCriteria?: string;
  difficulties?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  prizeInfo?: string;
  sourceUrl?: string;
  sourceName?: string;
  status: HackathonStatus;
  createdAt: string;
  updatedAt: string;
}

// ── AI Analysis ───────────────────────────────────────────────────────────────
export interface JudgingCriterionAnalysis {
  criterion: string;
  importance: number; // 1–10 (AI-estimated)
  explanation: string;
}

export interface HackathonAnalysis {
  problemSummary: string;
  coreProblem: string;
  targetUsers: string[];
  requiredFeatures: string[];
  optionalFeatures: string[];
  judgingCriteria: JudgingCriterionAnalysis[];
  constraints: string[];
  technicalRequirements: string[];
  recommendedTechnologies: string[];
  potentialDifferentiators: string[];
  commonMistakes: string[];
  winningStrategy: string[];
  estimatedComplexity: "LOW" | "MEDIUM" | "HIGH";
  suggestedTeamRoles: string[];
}

// ── Project Ideas ─────────────────────────────────────────────────────────────
export interface HackathonIdea {
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  targetUsers: string[];
  coreFeatures: string[];
  innovation: number; // 1–10 (AI-estimated)
  feasibility: number;
  demoImpact: number;
  technicalComplexity: number;
  recommendedStack: string[];
  differentiator: string;
  risks: string[];
}

// ── Architecture ──────────────────────────────────────────────────────────────
export interface HackathonArchitecture {
  systemOverview: string;
  frontend: string;
  backend: string;
  database: string;
  aiLayer?: string;
  agents?: string[];
  integrations: string[];
  authentication: string;
  deployment: string;
  dataFlow: string[];
  securityConsiderations: string[];
}

// ── Tasks / Build Plan ────────────────────────────────────────────────────────
export interface HackathonTask {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedHours: number;
  dependencies: string[];
  status: TaskStatus;
  day?: number;
}

export interface BuildPlan {
  totalDays: number;
  overview: string;
  tasks: HackathonTask[];
  milestones: { day: number; title: string; description: string }[];
}

// ── Project Workspace ─────────────────────────────────────────────────────────
export interface HackathonProject {
  _id: string;
  userId: string;
  hackathonId?: string;
  hackathon?: Hackathon;
  hackathonName?: string;
  title: string;
  tagline: string;
  problem?: string;
  solution?: string;
  problemStatement?: string;
  selectedIdea?: HackathonIdea;
  analysis?: HackathonAnalysis;
  architecture?: HackathonArchitecture;
  tasks?: HackathonTask[];
  progress: number; // 0–100
  status: ProjectStatus;
  deadline?: string;
  teamSize?: number;
  submission?: HackathonSubmission;
  reviewResult?: HackathonReview;
  pitch?: PitchResult;
  createdAt: string;
  updatedAt: string;
}

// ── Review ────────────────────────────────────────────────────────────────────
export interface HackathonRequirementCheck {
  requirement: string;
  status: "SATISFIED" | "PARTIAL" | "MISSING";
  evidence?: string;
  recommendation?: string;
}

export interface HackathonReview {
  strengths: string[];
  weaknesses: string[];
  criticalIssues: string[];
  recommendations: string[];
  requirementCoverage: HackathonRequirementCheck[];
  readiness: ReadinessLevel;
  scores: {
    architecture: number;
    codeQuality: number;
    aiImplementation: number;
    featureCompleteness: number;
    uxDesign: number;
    overallReadiness: number;
  };
}

// ── Submission ────────────────────────────────────────────────────────────────
export interface HackathonSubmission {
  projectTitle: string;
  tagline: string;
  problemStatement: string;
  solution: string;
  keyFeatures: string[];
  technicalArchitecture: string;
  aiImplementation?: string;
  technologies: string[];
  impact: string;
  challenges: string;
  futureImprovements: string[];
  demoInstructions: string;
  readmeContent?: string;
}

// ── Pitch ─────────────────────────────────────────────────────────────────────
export interface PitchScript {
  duration: "30s" | "60s" | "2min";
  script: string;
  structure: { timeRange: string; content: string }[];
}

export interface PitchResult {
  scripts: PitchScript[];
  keyMessages: string[];
  technicalHighlights: string[];
}

// ── Agent Trace ───────────────────────────────────────────────────────────────
export interface AgentTraceEntry {
  agentName: string;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  result?: string;
  error?: string;
}

export interface WorkflowTrace {
  projectId?: string;
  agents: AgentTraceEntry[];
  overallStatus: AgentStatus;
  startedAt: string;
  completedAt?: string;
}

// ── User Career Context ───────────────────────────────────────────────────────
export interface CareerHackathonContext {
  userId: string;
  name?: string;
  skills?: string[];
  targetRole?: string;
  experienceLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  existingTechnologies?: string[];
  roadmaps?: string[];
  learningProgress?: string;
}

// ── API Shapes ────────────────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
