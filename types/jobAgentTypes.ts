/**
 * types/jobAgentTypes.ts
 *
 * Type definitions for the Bounded-Autonomous Job Intelligence Agent.
 */

import { GeminiLearnerContext } from "./mcp";

export type GapSeverity = "CRITICAL" | "PARTIAL" | "STRONG";

export interface SkillGapItem {
  skill: string;
  severity: GapSeverity;
  reason: string;
  suggestedPriority: number; // 1 = highest priority
}

export interface SkillMatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  partiallyMatchedSkills: string[];
  evidence: string[];
}

export interface AnalyzedJobRequirements {
  jobTitle: string;
  company?: string;
  jobUrl?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  toolsAndFrameworks: string[];
  programmingLanguages: string[];
  experienceRequirements?: string;
  educationRequirements?: string;
  responsibilities: string[];
  importantKeywords: string[];
}

export interface RankedJobMatch {
  jobId: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  salary?: string;
  postedAgo?: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  careerAlignment: string;
  experienceAlignment: string;
  rankingScore: number;
  whyItMatches: string;
  requirements: AnalyzedJobRequirements;
  skillGaps: SkillGapItem[];
}

export interface MarketSignalItem {
  skill: string;
  frequency: number;
  percentage: number;
}

export interface MarketSignals {
  totalJobsAnalyzed: number;
  topSkills: MarketSignalItem[];
  roleDistribution: Record<string, number>;
  sampleNote: string;
}

export interface ActionLog {
  tool: string;
  description: string;
  timestamp: string;
}

export interface JobAgentState {
  userIntent: string;
  learnerContext?: GeminiLearnerContext;
  searchParams?: {
    keywords: string;
    location: string;
    experienceLevel?: string;
    limit?: number;
  };
  jobs: any[];
  analyzedJobs: Record<string, AnalyzedJobRequirements>;
  skillMatches: Record<string, SkillMatchResult>;
  skillGaps: SkillGapItem[];
  marketSignals?: MarketSignals;
  rankedResults: RankedJobMatch[];
  toolsExecuted: string[];
  actionLogs: ActionLog[];
  iterations: number;
  completed: boolean;
  stopReason?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AgentMetadata {
  iterations: number;
  toolsUsed: string[];
  mcpUsed: boolean;
  actionsExecuted: ActionLog[];
  sampleSize: number;
}

export interface JobAgentResponse {
  success: boolean;
  intent: string;
  summary: string;
  learnerProfileSummary?: {
    targetRole: string;
    experienceLevel: string;
    strongSkills: string[];
    weakAreas: string[];
  };
  jobs: RankedJobMatch[];
  marketSignals?: MarketSignals;
  skillGaps: SkillGapItem[];
  suggestedNextActions: string[];
  agentMetadata: AgentMetadata;
  error?: string;
}
