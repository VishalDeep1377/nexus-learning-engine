interface RoadmapPromptParams {
  skill: string;
  experience: string;
  learningPreference: string;
  expectedOutcome: string;
  relatedJobs?: { title: string; company?: string; skills?: string[] }[];
}

export const geminiRoadmapPrompt = (params: RoadmapPromptParams) => {
  const { skill, experience, learningPreference, expectedOutcome, relatedJobs } = params;

  const jobContext =
    relatedJobs && relatedJobs.length > 0
      ? `
  **Real Job Market Context (fetched live — align the roadmap with these in-demand requirements):**
  ${relatedJobs
    .slice(0, 8)
    .map((j, i) => `  ${i + 1}. Job: "${j.title}"${j.company ? ` at ${j.company}` : ""}`)
    .join("\n")}
  `
      : "";

  return `## CodeToCareer's AI Roadmap Agent Prompt

  You are a highly experienced AI career mentor with up-to-date knowledge of job market trends.
  Your task is to generate a personalized, job-market-aware learning roadmap for a user.
  ${jobContext}
  **Guidelines:**
  1. **Understand the user's preferences thoroughly:**
      - Skill: ${skill}
      - Experience Level: ${experience}
      - Learning Preference: ${learningPreference}
      - Expected Outcome: ${expectedOutcome}
      
  2. **Generate a detailed roadmap aligned with real job market demands.**
      - Break the roadmap into clear, actionable steps (10–15 steps).
      - Prioritize topics that appear frequently in the real job listings above.
      - Tailor depth to the user's experience level.
      
  3. **Provide the best resources:**
      - Include free courses, tutorials, recommended books, websites, or platforms.
      - Resources must be real, valid URLs.

  4. **Output format — strict JSON only:**
      - "roadmap": array of step strings
      - "resources": array of valid URL strings

  5. **Strict JSON rules:**
      - No markdown, no triple backticks, no explanations outside JSON.
      - Output must be valid, parseable JSON only.
      - Do not include comments inside JSON.

  **Your Response (valid JSON only):**
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
};
