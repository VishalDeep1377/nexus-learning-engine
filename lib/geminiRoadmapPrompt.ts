/**
 * lib/geminiRoadmapPrompt.ts
 *
 * Generates the Gemini prompt for roadmap generation.
 * Updated to accept GeminiLearnerContext from MCP (or fallback).
 *
 * IMPORTANT: The output schema is frozen:
 *   { "roadmap": string[], "resources": string[] }
 * Do NOT change the output contract — the frontend depends on this.
 */

import { GeminiLearnerContext } from "@/types/mcp";

// ── Legacy interface (kept for backward-compat if anything still imports it) ──
interface LegacyRoadmapPromptParams {
  skill: string;
  experience: string;
  learningPreference: string;
  expectedOutcome: string;
  relatedJobs?: { title: string; company?: string; skills?: string[] }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPerformanceSection(ctx: GeminiLearnerContext): string {
  const lines: string[] = [];
  const { coding, quiz, aptitude, speech } = ctx.performance;

  if (coding && coding.attempts > 0) {
    lines.push(`- Coding: ${coding.attempts} attempts, avg score ${coding.averageScore}/100`);
    if (coding.weakTopics.length > 0) lines.push(`  Weak topics: ${coding.weakTopics.join(", ")}`);
    if (coding.strongTopics.length > 0) lines.push(`  Strong topics: ${coding.strongTopics.join(", ")}`);
  }
  if (quiz && quiz.attempts > 0) {
    lines.push(`- Quizzes: ${quiz.attempts} attempts, avg accuracy ${quiz.accuracy}%`);
    if (quiz.weakTopics.length > 0) lines.push(`  Weak topics: ${quiz.weakTopics.join(", ")}`);
  }
  if (aptitude && aptitude.attempts > 0) {
    lines.push(`- Aptitude: ${aptitude.attempts} attempts, avg accuracy ${aptitude.accuracy}%`);
    if (aptitude.weakCategories.length > 0) lines.push(`  Weak areas: ${aptitude.weakCategories.join(", ")}`);
  }
  if (speech && speech.attempts > 0) {
    lines.push(`- Speech/Interview: ${speech.attempts} sessions, avg score ${speech.averageScore}/10`);
    if (speech.weakAreas.length > 0) lines.push(`  Weak areas: ${speech.weakAreas.join(", ")}`);
  }

  return lines.length > 0 ? lines.join("\n") : "  No assessment data available yet.";
}

function formatJobMarketSection(ctx: GeminiLearnerContext): string {
  const jm = ctx.jobMarket;
  if (!jm || jm.jobCount === 0) return "  No job market data available.";

  const lines: string[] = [
    `Source: ${jm.source} (retrieved: ${jm.retrievedAt})`,
    `Jobs analysed: ${jm.jobCount}`,
  ];

  if (jm.topSkills.length > 0) {
    lines.push("Top in-demand skills:");
    jm.topSkills.slice(0, 8).forEach(s => {
      lines.push(`  - ${s.skill}: ${s.frequency}/${jm.jobCount} jobs`);
    });
  } else {
    lines.push("  Skills: Could not extract from available job listings.");
  }

  if (jm.jobs.length > 0) {
    lines.push("Recent job titles:");
    jm.jobs.slice(0, 6).forEach((j, i) => {
      lines.push(`  ${i + 1}. "${j.title}"${j.company ? ` — ${j.company}` : ""}`);
    });
  }

  return lines.join("\n");
}

function formatSkillGapSection(ctx: GeminiLearnerContext): string {
  const sg = ctx.skillGap;
  const lines: string[] = [];

  if (sg.strengths.length > 0) {
    lines.push(`Strong areas (do not repeat as primary focus): ${sg.strengths.join(", ")}`);
  }
  if (sg.weakAreas.length > 0) {
    lines.push(`Weak areas (prioritise in roadmap): ${sg.weakAreas.join(", ")}`);
  }
  if (sg.missingSkills.length > 0) {
    lines.push(`Missing market skills (include in roadmap): ${sg.missingSkills.join(", ")}`);
  }
  if (lines.length === 0) {
    lines.push("No skill gap data available — use career goal to guide the roadmap.");
  }

  return lines.join("\n");
}

// ── Main prompt builder (MCP-aware) ──────────────────────────────────────────

export const geminiRoadmapPrompt = (
  params: LegacyRoadmapPromptParams | GeminiLearnerContext
): string => {

  // ── Detect whether caller passed LearnerContext or legacy params ──────────
  if ("profile" in params && "skillGap" in params) {
    // New path: full GeminiLearnerContext from MCP
    const ctx = params as GeminiLearnerContext;
    const { career, profile, learning, summary } = ctx;

    const existingRoadmaps = learning.activeRoadmapTitles.length > 0
      ? `Existing learning paths: ${learning.activeRoadmapTitles.join(", ")} (${learning.totalCompletedSteps} steps completed)`
      : "No existing roadmaps yet.";

    const activeProjects = ctx.projects?.activeHackathonProjects?.length > 0
      ? ctx.projects.activeHackathonProjects.map(p => `- ${p.title} (${p.status})`).join("\n")
      : "None.";

    return `## CodeToCareer AI Roadmap Agent

You are an expert career mentor AI generating a personalised, job-market-aware learning roadmap.

---
### LEARNER PROFILE
Name: ${profile.name ?? "Learner"}
Experience Level: ${profile.experienceLevel ?? career.experience}
Current Skills: ${(profile.currentSkills ?? []).join(", ") || "None identified yet"}

---
### CAREER GOAL
Target Skill: ${career.skill}
Experience Level: ${career.experience}
Learning Preference: ${career.learningPreference}
Expected Outcome: ${career.expectedOutcome}

---
### LEARNING HISTORY
${existingRoadmaps}

---
### ASSESSMENT PERFORMANCE
${formatPerformanceSection(ctx)}

---
### SKILL GAP ANALYSIS
${formatSkillGapSection(ctx)}

---
### ACTIVE PROJECTS
${activeProjects}

---
### JOB MARKET SIGNALS (live data)
${formatJobMarketSection(ctx)}

---
### ROADMAP GENERATION INSTRUCTIONS
Generate a step-by-step learning roadmap using the data above. Follow this exact priority order:

1. Address the learner's identified WEAK AREAS first (from assessments)
2. Fill MISSING MARKET SKILLS that the learner doesn't already know
3. Build toward the CAREER GOAL (${career.skill} — ${career.expectedOutcome})
4. Align with JOB MARKET DEMAND (prioritise skills appearing in multiple job listings)
5. Match LEARNING PREFERENCE (${career.learningPreference})
6. Do NOT recommend topics where the learner is already STRONG unless they are prerequisites

Summary context (for reference):
- Current level: ${summary.currentLevel}
- Target role: ${summary.targetRole}
- Priority areas: ${summary.priorityAreas.join(", ") || "See career goal"}

Guidelines:
- Generate 10–15 clear, actionable steps
- Each step should be a concrete learning task or milestone
- Include 6–10 real, valid resource URLs (courses, docs, tutorials)
- Resources must be real and accessible
- Tailor depth to ${career.experience} experience level

---
### REQUIRED OUTPUT FORMAT (strict JSON only)
No markdown. No explanation. Only valid JSON:

{
  "roadmap": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "resources": [
    "https://...",
    "https://..."
  ]
}`;

  } else {
    // Legacy path: simple params (used if MCP and fallback both fail catastrophically)
    const { skill, experience, learningPreference, expectedOutcome, relatedJobs } =
      params as LegacyRoadmapPromptParams;

    const jobContext = relatedJobs && relatedJobs.length > 0
      ? `\n**Job Market Context:**\n${relatedJobs
          .slice(0, 8)
          .map((j, i) => `  ${i + 1}. "${j.title}"${j.company ? ` at ${j.company}` : ""}`)
          .join("\n")}\n`
      : "";

    return `## CodeToCareer AI Roadmap Agent

You are an expert career mentor AI generating a personalised learning roadmap.
${jobContext}
### CAREER GOAL
- Skill: ${skill}
- Experience: ${experience}
- Learning Preference: ${learningPreference}
- Expected Outcome: ${expectedOutcome}

### INSTRUCTIONS
Generate 10–15 actionable learning steps tailored to the above goal.
Include 6–10 real, valid resource URLs.

### REQUIRED OUTPUT FORMAT (strict JSON only)
No markdown. No explanation outside JSON:

{
  "roadmap": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "resources": [
    "https://...",
    "https://..."
  ]
}`;
  }
};
