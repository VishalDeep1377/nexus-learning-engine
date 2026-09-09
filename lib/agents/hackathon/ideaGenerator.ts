/**
 * lib/agents/hackathon/ideaGenerator.ts
 *
 * Agent 2 — Idea Generator
 * Generates 3-5 personalized project ideas based on analysis + user context.
 */

import { generateStructured } from "@/lib/ai/groq";
import type {
  HackathonIdea,
  HackathonAnalysis,
  CareerHackathonContext,
} from "@/types/hackathon";

export interface IdeaGeneratorInput {
  analysis: HackathonAnalysis;
  hackathonName?: string;
  userContext?: CareerHackathonContext;
  problemStatement?: string;
}

export interface IdeaGeneratorOutput {
  ideas: HackathonIdea[];
  personalizedRecommendation: string;
  careerAlignment: string;
}

const SYSTEM_PROMPT = `You are a creative product strategist and senior software architect specializing in hackathon project ideation.

Generate 3-5 concrete, buildable project ideas for a hackathon. Each idea must be:
- Technically feasible within a hackathon timeframe (1-5 days)
- Innovative — not just another todo app
- Aligned with the judging criteria
- Specific, not vague

IMPORTANT RULES:
- All scores (1-10) are AI estimates for planning only. NOT official scores.
- Do NOT claim any win probability.
- Do NOT invent fake statistics or market data.
- If user context is provided, personalize ideas to match their skills.

Return ONLY valid JSON:
{
  "ideas": [
    {
      "title": "Project Name",
      "tagline": "One-line pitch",
      "problem": "Problem this solves",
      "solution": "How it solves it",
      "targetUsers": ["user type"],
      "coreFeatures": ["must-have feature 1", "feature 2"],
      "innovation": 8,
      "feasibility": 7,
      "demoImpact": 9,
      "technicalComplexity": 6,
      "recommendedStack": ["Next.js", "MongoDB"],
      "differentiator": "What makes this unique",
      "risks": ["potential challenge"]
    }
  ],
  "personalizedRecommendation": "Which idea is best for THIS developer and why",
  "careerAlignment": "How completing this project aligns with their career goals"
}`;

export async function runIdeaGenerator(
  input: IdeaGeneratorInput
): Promise<IdeaGeneratorOutput> {
  const { analysis, userContext, hackathonName, problemStatement } = input;

  const contextSection = userContext
    ? `
DEVELOPER PROFILE (personalize ideas to match):
Name: ${userContext.name || "Developer"}
Skills: ${userContext.skills?.join(", ") || "General"}
Target Role: ${userContext.targetRole || "Software Engineer"}
Experience: ${userContext.experienceLevel || "INTERMEDIATE"}
Current Technologies: ${userContext.existingTechnologies?.join(", ") || "Not specified"}
Learning Roadmaps: ${userContext.roadmaps?.join(", ") || "None specified"}
`
    : "";

  const userPrompt = `Generate project ideas for this hackathon.

HACKATHON: ${hackathonName || "Hackathon"}

ANALYSIS SUMMARY:
- Core Problem: ${analysis.coreProblem}
- Required Features: ${analysis.requiredFeatures.join(", ")}
- Judging Priorities: ${analysis.judgingCriteria.map((j) => `${j.criterion} (${j.importance}/10)`).join(", ")}
- Potential Differentiators: ${analysis.potentialDifferentiators.join(", ")}
- Estimated Complexity: ${analysis.estimatedComplexity}
- Winning Strategy: ${analysis.winningStrategy.join("; ")}
${contextSection}

${problemStatement ? `ORIGINAL PROBLEM STATEMENT:\n${problemStatement}` : ""}

Generate 3-5 creative, feasible project ideas now. Return as JSON.`;

  const result = await generateStructured<IdeaGeneratorOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.7,
    maxTokens: 4000,
  });

  if (!result.ideas || !Array.isArray(result.ideas) || result.ideas.length === 0) {
    throw new Error("[IdeaGenerator] No ideas returned from AI.");
  }

  return result;
}
