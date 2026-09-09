/**
 * lib/orchestrator/hackathonOrchestrator.ts
 *
 * Orchestrates the multi-agent hackathon workflow.
 * Coordinates: Analyzer → Idea Generator → Build Planner
 * Returns a full trace for live UI display.
 */

import { runHackathonAnalyzer, type AnalyzerInput } from "@/lib/agents/hackathon/hackathonAnalyzer";
import { runIdeaGenerator } from "@/lib/agents/hackathon/ideaGenerator";
import { runBuildPlanner } from "@/lib/agents/hackathon/buildPlanner";
import type {
  HackathonAnalysis,
  HackathonIdea,
  BuildPlan,
  AgentTraceEntry,
  WorkflowTrace,
  CareerHackathonContext,
} from "@/types/hackathon";

export interface OrchestratorInput {
  problemStatement: string;
  hackathonName?: string;
  rules?: string;
  judgingCriteria?: string;
  constraints?: string;
  deadline?: string;
  teamSize?: number;
  userContext?: CareerHackathonContext;
}

export interface OrchestratorResult {
  analysis: HackathonAnalysis;
  ideasResult: {
    ideas: HackathonIdea[];
    personalizedRecommendation: string;
    careerAlignment: string;
  };
  trace: WorkflowTrace;
}

function createTrace(): WorkflowTrace {
  return {
    agents: [],
    overallStatus: "RUNNING",
    startedAt: new Date().toISOString(),
  };
}

function addAgent(trace: WorkflowTrace, name: string): AgentTraceEntry {
  const entry: AgentTraceEntry = {
    agentName: name,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
  };
  trace.agents.push(entry);
  return entry;
}

function completeAgent(entry: AgentTraceEntry, result?: string) {
  entry.status = "COMPLETED";
  entry.completedAt = new Date().toISOString();
  entry.result = result;
  if (entry.startedAt) {
    entry.durationMs =
      new Date(entry.completedAt).getTime() -
      new Date(entry.startedAt).getTime();
  }
}

function failAgent(entry: AgentTraceEntry, error: string) {
  entry.status = "FAILED";
  entry.completedAt = new Date().toISOString();
  entry.error = error;
}

/**
 * Full workflow: Analyze → Generate Ideas
 * (Build Planner runs separately once user selects an idea)
 */
export async function runAnalyzeAndIdeate(
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const trace = createTrace();

  // ── Step 1: Hackathon Analyzer ───────────────────────────────────────────
  const analyzerEntry = addAgent(trace, "Hackathon Analyzer");
  let analysis: HackathonAnalysis;

  try {
    analysis = await runHackathonAnalyzer({
      problemStatement: input.problemStatement,
      hackathonName: input.hackathonName,
      rules: input.rules,
      judgingCriteria: input.judgingCriteria,
      constraints: input.constraints,
      deadline: input.deadline,
      teamSize: input.teamSize,
      userContext: input.userContext,
    });
    completeAgent(
      analyzerEntry,
      `Identified ${analysis.requiredFeatures.length} requirements, ${analysis.judgingCriteria.length} judging criteria`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    failAgent(analyzerEntry, msg);
    trace.overallStatus = "FAILED";
    throw err;
  }

  // ── Step 2: Idea Generator ──────────────────────────────────────────────
  const ideaEntry = addAgent(trace, "Idea Generator");
  let ideasResult: { ideas: HackathonIdea[]; personalizedRecommendation: string; careerAlignment: string };

  try {
    ideasResult = await runIdeaGenerator({
      analysis,
      hackathonName: input.hackathonName,
      userContext: input.userContext,
      problemStatement: input.problemStatement,
    });
    completeAgent(ideaEntry, `Generated ${ideasResult.ideas.length} project ideas`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    failAgent(ideaEntry, msg);
    trace.overallStatus = "FAILED";
    throw err;
  }

  trace.overallStatus = "COMPLETED";
  trace.completedAt = new Date().toISOString();

  return { analysis, ideasResult, trace };
}

/**
 * Build planning: runs after user selects an idea.
 */
export async function runBuildPlan(input: {
  selectedIdea: HackathonIdea;
  analysis: HackathonAnalysis;
  hackathonName?: string;
  deadline?: string;
  teamSize?: number;
  userContext?: CareerHackathonContext;
}): Promise<{ plan: BuildPlan; trace: WorkflowTrace }> {
  const trace = createTrace();
  const plannerEntry = addAgent(trace, "Build Planner");

  try {
    const plan = await runBuildPlanner(input);
    completeAgent(plannerEntry, `Created ${plan.tasks.length} tasks over ${plan.totalDays} days`);
    trace.overallStatus = "COMPLETED";
    trace.completedAt = new Date().toISOString();
    return { plan, trace };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    failAgent(plannerEntry, msg);
    trace.overallStatus = "FAILED";
    throw err;
  }
}
