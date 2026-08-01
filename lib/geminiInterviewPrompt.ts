interface InterviewPromptParams {
  skill: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  count?: number;
}

export const geminiInterviewPrompt = ({
  skill,
  difficulty,
  count = 10,
}: InterviewPromptParams): string => {
  return `## CodeToCareer Interview Question Generator

You are an expert technical interviewer. Generate exactly ${count} multiple-choice interview questions for the following:

- **Topic / Skill:** ${skill}
- **Difficulty Level:** ${difficulty}

**Requirements:**
1. Each question must have exactly 4 options (A, B, C, D).
2. Exactly one option must be correct.
3. Questions must cover a mix of: concepts, practical usage, best practices, common pitfalls.
4. Tailor question depth to the "${difficulty}" level.
5. Include a short explanation for the correct answer.

**Strict JSON output rules:**
- Output must be valid, parseable JSON only.
- No markdown, no triple backticks, no text outside the JSON.
- Do not include comments inside the JSON.

**Your Response (valid JSON only):**
{
  "skill": "${skill}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}`;
};
