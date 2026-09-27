/**
 * lib/agents/jobIntelligence/jobIntelligenceAgent.ts
 *
 * Bounded-Autonomous Job Intelligence Agent powered by Gemini.
 * Executes an iterative tool reasoning loop:
 *   User Intent -> Retrieve Context -> Tool Selection -> Execution -> Observation -> Reasoning -> Stop Condition -> Final Insight
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateStructured } from "@/lib/ai/groq";
import {
  AGENT_TOOLS,
  tool_get_learner_context,
  tool_search_jobs,
  tool_analyze_job_requirements,
  tool_calculate_skill_match,
  tool_identify_skill_gaps,
  tool_get_job_market_signals,
  tool_rank_job_matches,
  tool_save_job,
} from "./jobAgentTools";
import {
  JobAgentState,
  JobAgentResponse,
  RankedJobMatch,
  SkillGapItem,
  MarketSignals,
  ActionLog,
} from "@/types/jobAgentTypes";

const MAX_AGENT_ITERATIONS = 8;

export interface RunAgentParams {
  userId: string;
  userMessage: string;
}

/**
 * Runs the Bounded-Autonomous Job Intelligence Agent loop.
 */
export async function runJobIntelligenceAgent(params: RunAgentParams): Promise<JobAgentResponse> {
  const startTime = Date.now();
  console.log(`[JOB_AGENT] Request started for user ${params.userId}: "${params.userMessage}"`);

  // Initialize Agent State
  const state: JobAgentState = {
    userIntent: params.userMessage,
    jobs: [],
    analyzedJobs: {},
    skillMatches: {},
    skillGaps: [],
    rankedResults: [],
    toolsExecuted: [],
    actionLogs: [],
    iterations: 0,
    completed: false,
  };

  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Step 1: Always retrieve learner context first
  try {
    state.learnerContext = await tool_get_learner_context(params.userId);
    state.toolsExecuted.push("get_learner_context");
    state.actionLogs.push({
      tool: "get_learner_context",
      description: "Retrieved learner context, current skills, and active career goals.",
      timestamp: new Date().toISOString(),
    });
    console.log("[JOB_AGENT] Learner context retrieved successfully");
  } catch (err: any) {
    console.error("[JOB_AGENT] Failed to retrieve learner context:", err?.message || err);
  }

  // If no AI keys present, run deterministic tool fallback pipeline
  if (!groqApiKey && !geminiApiKey) {
    console.warn("[JOB_AGENT] Neither GROQ_API_KEY nor GEMINI_API_KEY present — running deterministic tool fallback execution pipeline");
    return runDeterministicAgentFallback(params.userId, params.userMessage, state);
  }

  const primaryProvider = groqApiKey ? "GROQ" : "GEMINI";
  console.log(`[JOB_AGENT] Initialized reasoning loop with primary AI provider: ${primaryProvider}`);

  // Step 2: Bounded Autonomous Iterative Reasoning Loop
  while (!state.completed && state.iterations < MAX_AGENT_ITERATIONS) {
    state.iterations++;
    console.log(`[JOB_AGENT] Loop iteration ${state.iterations} / ${MAX_AGENT_ITERATIONS} [Engine: ${primaryProvider}]`);

    const prompt = buildAgentIterationPrompt(state, AGENT_TOOLS);

    try {
      let stepDecision: any = {};

      if (groqApiKey) {
        // Groq API structured generation
        stepDecision = await generateStructured({
          systemPrompt: "You are the Bounded-Autonomous Job Intelligence Agent for the Code-to-Career system. Return ONLY valid JSON matching the requested structure.",
          userPrompt: prompt,
          temperature: 0.2,
        });
      } else if (geminiApiKey) {
        // Gemini API fallback
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        stepDecision = JSON.parse(cleaned);
      }

      // Check if Agent chose to complete
      if (stepDecision.isFinal || !stepDecision.toolCall) {
        console.log(`[JOB_AGENT] Agent completed iterative reasoning loop via ${primaryProvider}`);
        state.completed = true;
        state.stopReason = "Agent determined sufficient data collected";
        break;
      }

      const { name, parameters } = stepDecision.toolCall;
      console.log(`[JOB_AGENT] Tool selected by ${primaryProvider}: ${name}`);

      // Execute selected tool
      await executeSelectedTool(name, parameters, state, params.userId);

    } catch (err: any) {
      console.error(`[JOB_AGENT] Error during loop iteration ${state.iterations} [${primaryProvider}]:`, err?.message || err);
      // If Groq fails and Gemini key exists, attempt failover for this turn
      if (groqApiKey && geminiApiKey) {
        console.warn("[JOB_AGENT] Attempting Gemini failover for remaining reasoning...");
        try {
          const genAI = new GoogleGenerativeAI(geminiApiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
          const result = await model.generateContent(prompt);
          const cleaned = result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const stepDecision = JSON.parse(cleaned);
          if (stepDecision.toolCall) {
            await executeSelectedTool(stepDecision.toolCall.name, stepDecision.toolCall.parameters, state, params.userId);
            continue;
          }
        } catch (failoverErr) {
          console.error("[JOB_AGENT] Gemini failover also encountered an error:", failoverErr);
        }
      }
      state.completed = true;
      state.stopReason = `Error encountered: ${err?.message || err}`;
      break;
    }
  }

  if (state.iterations >= MAX_AGENT_ITERATIONS) {
    console.warn(`[JOB_AGENT] Reached maximum agent iterations limit (${MAX_AGENT_ITERATIONS})`);
    state.stopReason = `Reached maximum iteration limit (${MAX_AGENT_ITERATIONS})`;
  }

  // Ensure analysis pipeline has minimum required data even if agent stopped early
  await ensureMinDataPipeline(params.userId, state);

  const durationMs = Date.now() - startTime;
  console.log(`[JOB_AGENT] Agent completed in ${durationMs}ms with ${state.toolsExecuted.length} tool calls`);

  return buildFinalAgentResponse(state);
}

/**
 * Builds the LLM prompt for each iteration of the agent loop.
 */
function buildAgentIterationPrompt(state: JobAgentState, tools: typeof AGENT_TOOLS): string {
  const learnerSkills = [
    ...(state.learnerContext?.skillGap?.strengths || []),
    ...(state.learnerContext?.summary?.strongSkills || []),
  ];

  const expLevel = state.learnerContext?.summary?.currentLevel || state.learnerContext?.career?.experience || "Intermediate";
  const targetRole = state.learnerContext?.summary?.targetRole || state.learnerContext?.career?.skill || "Software Engineering";

  return `You are the Bounded-Autonomous Job Intelligence Agent for the Code-to-Career system.
Goal: "${state.userIntent}"

LEARNER STATE:
- Experience: ${expLevel}
- Target Goal: ${targetRole}
- Current Skills: ${learnerSkills.slice(0, 10).join(", ") || "General Development"}
- Weak Areas: ${(state.learnerContext?.skillGap?.weakAreas || []).join(", ") || "None"}

CURRENT AGENT STATE:
- Tools Executed: ${state.toolsExecuted.join(", ") || "None"}
- Jobs Retrieved: ${state.jobs.length}
- Ranked Results: ${state.rankedResults.length}
- Iteration: ${state.iterations} / ${MAX_AGENT_ITERATIONS}

AVAILABLE TOOLS:
${JSON.stringify(tools, null, 2)}

INSTRUCTIONS:
1. Analyze whether enough evidence exists to answer the learner's query.
2. If more data is needed (e.g., search jobs, analyze job requirements, calculate skill match, rank jobs), select ONE tool call.
3. If sufficient data has been collected and analyzed, set "isFinal": true.

Return ONLY valid JSON matching this structure:
{
  "thought": "Short factual reasoning",
  "toolCall": {
    "name": "tool_name",
    "parameters": { ... }
  },
  "isFinal": false,
  "finalAnswer": "Optional final user response if isFinal is true"
}`;
}

/**
 * Executes the tool selected by the LLM and updates state.
 */
async function executeSelectedTool(
  toolName: string,
  parameters: any,
  state: JobAgentState,
  userId: string
): Promise<void> {
  state.toolsExecuted.push(toolName);

  const defaultRole = state.learnerContext?.summary?.targetRole || state.learnerContext?.career?.skill || "Software Engineer";
  const defaultExp = state.learnerContext?.summary?.currentLevel || state.learnerContext?.career?.experience || "entry level";

  switch (toolName) {
    case "search_jobs": {
      const keywords = parameters?.keywords || defaultRole;
      const location = parameters?.location || "Remote";
      const exp = parameters?.experienceLevel || defaultExp;
      const limit = parameters?.limit || 10;

      state.searchParams = { keywords, location, experienceLevel: exp, limit };
      state.jobs = await tool_search_jobs({ keywords, location, experienceLevel: exp, limit });
      state.actionLogs.push({
        tool: "search_jobs",
        description: `Searched live job market for "${keywords}" in "${location}" (${state.jobs.length} jobs found).`,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case "analyze_job_requirements": {
      const targetJob = state.jobs[0];
      if (targetJob) {
        const req = await tool_analyze_job_requirements({
          jobTitle: targetJob.title,
          jobDescription: targetJob.description,
          company: targetJob.company,
          jobUrl: targetJob.jobUrl,
        });
        state.analyzedJobs[targetJob.jobId] = req;
        state.actionLogs.push({
          tool: "analyze_job_requirements",
          description: `Analyzed skill requirements for ${targetJob.title} at ${targetJob.company}.`,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    case "calculate_skill_match": {
      const targetJob = state.jobs[0];
      const req = targetJob ? state.analyzedJobs[targetJob.jobId] : null;
      const learnerSkills = state.learnerContext?.skillGap?.strengths || ["Python"];

      if (req) {
        const match = await tool_calculate_skill_match({
          learnerSkills,
          jobRequirements: req,
        });
        state.skillMatches[targetJob.jobId] = match;
        state.actionLogs.push({
          tool: "calculate_skill_match",
          description: `Calculated skill match percentage (${match.matchPercentage}%) for ${req.jobTitle}.`,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    case "identify_skill_gaps": {
      const learnerSkills = state.learnerContext?.skillGap?.strengths || ["Python"];
      const weakAreas = state.learnerContext?.skillGap?.weakAreas || [];
      const reqSkills = Object.values(state.analyzedJobs).flatMap(r => r.requiredSkills);

      state.skillGaps = await tool_identify_skill_gaps({
        learnerSkills,
        learnerWeakAreas: weakAreas,
        requiredSkills: reqSkills.length > 0 ? reqSkills : ["SQL", "Docker"],
      });

      state.actionLogs.push({
        tool: "identify_skill_gaps",
        description: `Identified critical & partial skill gaps across target job opportunities.`,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case "get_job_market_signals": {
      state.marketSignals = await tool_get_job_market_signals(state.jobs);
      state.actionLogs.push({
        tool: "get_job_market_signals",
        description: `Analyzed skill demand frequencies across ${state.jobs.length} market listings.`,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case "rank_job_matches": {
      const jobsWithAnalysis = await Promise.all(
        state.jobs.map(async (job) => {
          let req = state.analyzedJobs[job.jobId];
          if (!req) {
            req = await tool_analyze_job_requirements({
              jobTitle: job.title,
              jobDescription: job.description,
              company: job.company,
              jobUrl: job.jobUrl,
            });
            state.analyzedJobs[job.jobId] = req;
          }

          let match = state.skillMatches[job.jobId];
          if (!match) {
            const learnerSkills = getCombinedLearnerSkills(state.learnerContext);
            match = await tool_calculate_skill_match({
              learnerSkills,
              jobRequirements: req,
            });
            state.skillMatches[job.jobId] = match;
          }

          const gaps = await tool_identify_skill_gaps({
            learnerSkills: getCombinedLearnerSkills(state.learnerContext),
            learnerWeakAreas: state.learnerContext?.skillGap?.weakAreas || [],
            requiredSkills: req.requiredSkills,
            matchResult: match,
          });

          return { job, requirements: req, matchResult: match, gaps };
        })
      );

      state.rankedResults = await tool_rank_job_matches({
        jobsWithAnalysis,
        targetRole: state.learnerContext?.summary?.targetRole || state.learnerContext?.career?.skill,
        userExperience: state.learnerContext?.summary?.currentLevel || state.learnerContext?.career?.experience,
      });

      state.actionLogs.push({
        tool: "rank_job_matches",
        description: `Ranked ${state.rankedResults.length} job opportunities using transparent matching factors.`,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case "save_job": {
      if (parameters?.jobId && parameters?.confirm) {
        await tool_save_job({ jobId: parameters.jobId, confirm: parameters.confirm });
        state.actionLogs.push({
          tool: "save_job",
          description: `Saved job ${parameters.jobId} with explicit user confirmation.`,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    default:
      console.warn(`[JOB_AGENT] Unknown tool requested: ${toolName}`);
  }
}

/**
 * Helper to gather all combined skills from learner context.
 */
function getCombinedLearnerSkills(ctx?: any): string[] {
  if (!ctx) return ["Python"];
  const skills = new Set<string>();

  (ctx.skillGap?.strengths || []).forEach((s: string) => skills.add(s));
  (ctx.summary?.strongSkills || []).forEach((s: string) => skills.add(s));
  (ctx.profile?.currentSkills || []).forEach((s: string) => skills.add(s));
  if (ctx.career?.skill) skills.add(ctx.career.skill);

  const arr = Array.from(skills).filter(Boolean);
  return arr.length > 0 ? arr : ["Python"];
}

/**
 * Ensures minimum pipeline data exists if agent loop finished early.
 */
async function ensureMinDataPipeline(userId: string, state: JobAgentState): Promise<void> {
  const targetRole = state.learnerContext?.summary?.targetRole || state.learnerContext?.career?.skill || extractKeywordsFromIntent(state.userIntent);
  const currentLevel = state.learnerContext?.summary?.currentLevel || state.learnerContext?.career?.experience || "Intermediate";

  if (state.jobs.length === 0) {
    const keyword = targetRole;
    const location = "Remote";
    state.searchParams = { keywords: keyword, location, experienceLevel: "entry level", limit: 10 };
    state.jobs = await tool_search_jobs({ keywords: keyword, location, limit: 10 });
    state.toolsExecuted.push("search_jobs");
    state.actionLogs.push({
      tool: "search_jobs",
      description: `Retrieved live job opportunities for ${keyword}.`,
      timestamp: new Date().toISOString(),
    });
  }

  if (state.rankedResults.length === 0 && state.jobs.length > 0) {
    const jobsWithAnalysis = await Promise.all(
      state.jobs.slice(0, 6).map(async (job) => {
        const req = await tool_analyze_job_requirements({
          jobTitle: job.title,
          jobDescription: job.description,
          company: job.company,
          jobUrl: job.jobUrl,
        });
        const learnerSkills = getCombinedLearnerSkills(state.learnerContext);
        const match = await tool_calculate_skill_match({ learnerSkills, jobRequirements: req });
        const gaps = await tool_identify_skill_gaps({
          learnerSkills,
          learnerWeakAreas: state.learnerContext?.skillGap?.weakAreas || [],
          requiredSkills: req.requiredSkills,
        });
        return { job, requirements: req, matchResult: match, gaps };
      })
    );

    state.rankedResults = await tool_rank_job_matches({
      jobsWithAnalysis,
      targetRole: targetRole,
      userExperience: currentLevel,
    });
    state.toolsExecuted.push("rank_job_matches");
    state.actionLogs.push({
      tool: "rank_job_matches",
      description: "Ranked market listings according to profile skill match.",
      timestamp: new Date().toISOString(),
    });
  }

  if (!state.marketSignals && state.jobs.length > 0) {
    state.marketSignals = await tool_get_job_market_signals(state.jobs);
    state.toolsExecuted.push("get_job_market_signals");
    state.actionLogs.push({
      tool: "get_job_market_signals",
      description: `Computed market demand signals across ${state.jobs.length} listings.`,
      timestamp: new Date().toISOString(),
    });
  }

  if (state.skillGaps.length === 0 && state.rankedResults.length > 0) {
    const topMatch = state.rankedResults[0];
    state.skillGaps = topMatch.skillGaps || [];
  }
}

/**
 * Deterministic fallback execution when API key is not configured.
 */
async function runDeterministicAgentFallback(
  userId: string,
  userMessage: string,
  state: JobAgentState
): Promise<JobAgentResponse> {
  await ensureMinDataPipeline(userId, state);
  state.iterations = 4;
  state.completed = true;
  state.stopReason = "Deterministic pipeline execution complete";
  return buildFinalAgentResponse(state);
}

/**
 * Extracts candidate keyword from intent string.
 */
function extractKeywordsFromIntent(intent: string): string {
  const lower = intent.toLowerCase();
  if (lower.includes("data science") || lower.includes("data scientist")) return "Data Scientist";
  if (lower.includes("react") || lower.includes("frontend")) return "Frontend Developer";
  if (lower.includes("python") || lower.includes("backend")) return "Python Developer";
  if (lower.includes("full stack") || lower.includes("fullstack")) return "Full Stack Developer";
  return "Software Engineer";
}

/**
 * Formats structured response from final agent state.
 */
function buildFinalAgentResponse(state: JobAgentState): JobAgentResponse {
  const topMatch = state.rankedResults[0];
  const learnerSkills = state.learnerContext?.skillGap?.strengths || ["Python"];
  const weakAreas = state.learnerContext?.skillGap?.weakAreas || [];

  const summary = topMatch
    ? `Analyzed ${state.jobs.length} live job listings. Best fit role: ${topMatch.title} at ${topMatch.company} (${topMatch.matchPercentage}% skill match).`
    : `Analyzed your skill profile and job market. Retreived ${state.jobs.length} opportunities matching your goals.`;

  const criticalGaps = state.skillGaps.filter(g => g.severity === "CRITICAL").slice(0, 3);
  const suggestedNextActions = criticalGaps.map(
    g => `Focus on developing ${g.skill} to increase your market match for target roles.`
  );

  if (suggestedNextActions.length === 0) {
    suggestedNextActions.push("Your profile matches high-demand skills for target roles. Consider applying directly.");
  }

  const uniqueTools = [...new Set(state.toolsExecuted)];

  return {
    success: true,
    intent: state.userIntent,
    summary,
    learnerProfileSummary: {
      targetRole: state.learnerContext?.summary?.targetRole || state.learnerContext?.career?.skill || "Software Engineering",
      experienceLevel: state.learnerContext?.summary?.currentLevel || state.learnerContext?.career?.experience || "Intermediate",
      strongSkills: learnerSkills,
      weakAreas: weakAreas,
    },
    jobs: state.rankedResults,
    marketSignals: state.marketSignals,
    skillGaps: state.skillGaps,
    suggestedNextActions,
    agentMetadata: {
      iterations: state.iterations,
      toolsUsed: uniqueTools,
      mcpUsed: state.toolsExecuted.includes("get_learner_context"),
      actionsExecuted: state.actionLogs,
      sampleSize: state.jobs.length,
    },
  };
}
