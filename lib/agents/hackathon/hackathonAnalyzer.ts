/**
 * lib/agents/hackathon/hackathonAnalyzer.ts
 *
 * Agent 1 — Hackathon Analyzer
 * Parses problem statements and extracts structured engineering requirements.
 */

import { generateStructured } from "@/lib/ai/groq";
import type { HackathonAnalysis, CareerHackathonContext } from "@/types/hackathon";

export interface AnalyzerInput {
  problemStatement: string;
  hackathonName?: string;
  rules?: string;
  judgingCriteria?: string;
  constraints?: string;
  deadline?: string;
  teamSize?: number;
  userContext?: CareerHackathonContext;
}

const SYSTEM_PROMPT = `You are a senior hackathon strategist and software architect with 15+ years of experience judging and winning hackathons.

Your job is to analyze a hackathon problem statement and convert it into structured engineering requirements.

RULES:
- Do NOT invent requirements not implied by the problem.
- Clearly distinguish: stated requirements vs inferred opportunities vs your recommendations.
- Be specific and actionable, not generic.
- All numeric scores (1-10) are YOUR AI estimates for planning purposes only — not official judge scores.
- Do NOT claim any win probability.

Return ONLY valid JSON matching this exact schema:
{
  "problemSummary": "2-3 sentence plain English summary",
  "coreProblem": "single clear problem statement",
  "targetUsers": ["user type 1", "user type 2"],
  "requiredFeatures": ["feature explicitly required by the hackathon"],
  "optionalFeatures": ["feature that would strengthen submission"],
  "judgingCriteria": [
    {
      "criterion": "name",
      "importance": 8,
      "explanation": "why this matters"
    }
  ],
  "constraints": ["technology or time constraint"],
  "technicalRequirements": ["technical must-have"],
  "recommendedTechnologies": ["technology recommendation with reason"],
  "potentialDifferentiators": ["unique angle that could stand out"],
  "commonMistakes": ["common mistake teams make in this type of hackathon"],
  "winningStrategy": ["strategic recommendation"],
  "estimatedComplexity": "MEDIUM",
  "suggestedTeamRoles": ["role name"]
}`;

export async function runHackathonAnalyzer(
  input: AnalyzerInput
): Promise<HackathonAnalysis> {
  const contextSection = input.userContext
    ? `\n\nDEVELOPER CONTEXT (use to personalize recommendations):
Name: ${input.userContext.name || "Developer"}
Skills: ${input.userContext.skills?.join(", ") || "Not specified"}
Target Role: ${input.userContext.targetRole || "Not specified"}
Experience: ${input.userContext.experienceLevel || "Not specified"}
Technologies: ${input.userContext.existingTechnologies?.join(", ") || "Not specified"}
`
    : "";

  const userPrompt = `Analyze this hackathon:

HACKATHON NAME: ${input.hackathonName || "Unnamed Hackathon"}
${input.deadline ? `DEADLINE: ${input.deadline}` : ""}
${input.teamSize ? `TEAM SIZE: ${input.teamSize}` : ""}

PROBLEM STATEMENT:
${input.problemStatement}

${input.rules ? `RULES:\n${input.rules}` : ""}
${input.judgingCriteria ? `JUDGING CRITERIA:\n${input.judgingCriteria}` : ""}
${input.constraints ? `CONSTRAINTS:\n${input.constraints}` : ""}
${contextSection}

Return the structured JSON analysis now.`;

  const result = await generateStructured<HackathonAnalysis>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
    maxTokens: 3000,
  });

  // Basic validation
  if (!result.problemSummary || !result.coreProblem) {
    throw new Error("[HackathonAnalyzer] Invalid response structure from AI.");
  }

  return result;
}
