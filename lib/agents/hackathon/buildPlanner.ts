/**
 * lib/agents/hackathon/buildPlanner.ts
 *
 * Agent 3 — Build Planner
 * Converts a selected project idea into a concrete day-by-day development plan.
 */

import { generateStructured } from "@/lib/ai/groq";
import type {
  BuildPlan,
  HackathonIdea,
  HackathonAnalysis,
  CareerHackathonContext,
} from "@/types/hackathon";

export interface BuildPlannerInput {
  selectedIdea: HackathonIdea;
  analysis: HackathonAnalysis;
  hackathonName?: string;
  deadline?: string;
  teamSize?: number;
  userContext?: CareerHackathonContext;
}

export async function runBuildPlanner(
  input: BuildPlannerInput
): Promise<BuildPlan> {
  const {
    selectedIdea,
    analysis,
    hackathonName,
    deadline,
    teamSize = 1,
    userContext,
  } = input;

  // Calculate days based on deadline (max 30 to avoid insane AI generations)
  let planDays = 3;
  if (deadline) {
    const msDiff = new Date(deadline).getTime() - Date.now();
    const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    planDays = Math.min(Math.max(1, daysDiff), 30);
  }

  const dynamicSystemPrompt = `You are a senior engineering lead who specializes in shipping hackathon projects fast.

Create a realistic, day-by-day development plan for a hackathon project over exactly ${planDays} days.

RULES:
- Be REALISTIC about what can be built in ${planDays} days.
- Prioritize DEMO-ABILITY over perfection.
- Include setup, core features, testing, and submission prep.
- Each task must have clear success criteria.
- Assume the developer has the specified skill level.
- KEEP descriptions SHORT (1 sentence max). Do NOT over-explain.
- Generate 3-5 tasks per day max. Quality over quantity.

Return ONLY valid JSON:
{
  "totalDays": ${planDays},
  "overview": "brief execution strategy",
  "milestones": [
    { "day": 1, "title": "Foundation", "description": "what should be done by end of day 1" }
  ],
  "tasks": [
    {
      "id": "task-1",
      "title": "Project Setup",
      "description": "Initialize Next.js project with TypeScript, MongoDB connection",
      "priority": "CRITICAL",
      "estimatedHours": 1,
      "dependencies": [],
      "status": "TODO",
      "day": 1
    }
  ]
}`;

  const teamContext = teamSize > 1
    ? `Team of ${teamSize}. Assign tasks assuming parallel work.`
    : `Solo developer. Prioritize ruthlessly.`;

  const skillContext = userContext
    ? `Developer skills: ${userContext.existingTechnologies?.join(", ") || "General web dev"}. Experience: ${userContext.experienceLevel || "INTERMEDIATE"}.`
    : "";

  const userPrompt = `Create a build plan for this hackathon project.

HACKATHON: ${hackathonName || "Hackathon"}
DEADLINE: ${deadline || "Unknown"} 
PLAN DURATION: Exact ${planDays} day(s) strategy required
TEAM: ${teamContext}
${skillContext}

PROJECT: ${selectedIdea.title}
TAGLINE: ${selectedIdea.tagline}
CORE FEATURES: ${selectedIdea.coreFeatures.join(", ")}
RECOMMENDED STACK: ${selectedIdea.recommendedStack.join(", ")}
TECHNICAL COMPLEXITY: ${selectedIdea.technicalComplexity}/10

HACKATHON REQUIREMENTS:
- Required: ${analysis.requiredFeatures.join(", ")}
- Key Judging: ${analysis.judgingCriteria.slice(0, 3).map((j) => j.criterion).join(", ")}

Generate a concrete, day-by-day task list split exactly across ${planDays} days. Each task should be completable in the estimated hours. Return as JSON.`;

  const result = await generateStructured<BuildPlan>({
    systemPrompt: dynamicSystemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 6000,
  });

  if (!result.tasks || !Array.isArray(result.tasks)) {
    throw new Error("[BuildPlanner] Invalid task list from AI.");
  }

  // Ensure all tasks have IDs
  result.tasks = result.tasks.map((task, i) => ({
    ...task,
    id: task.id || `task-${i + 1}`,
    status: task.status || "TODO",
  }));

  return result;
}
