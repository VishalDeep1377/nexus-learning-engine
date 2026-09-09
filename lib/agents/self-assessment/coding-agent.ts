/**
 * lib/agents/self-assessment/coding-agent.ts
 * Responsible for: generating challenges, hints, reviewing code, suggesting improvements.
 */

import { generateStructured, generateText } from '@/lib/ai/groq';

export interface CodingChallenge {
  title: string;
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  inputFormat: string;
  outputFormat: string;
  starterCode: string;
  testCases: { input: string; expectedOutput: string; hidden: boolean }[];
  hints: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

export interface CodeReviewResult {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  timeComplexity: string;
  spaceComplexity: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedApproach?: string;
  score: number;
}

export async function generateCodingChallenge(params: {
  language: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}): Promise<CodingChallenge> {
  const { language, difficulty, topic } = params;

  const systemPrompt = `You are an expert competitive programming coach. Generate well-structured coding challenges.
Always respond with valid JSON only. No markdown fences. No extra text.`;

  const userPrompt = `Generate a ${difficulty} coding challenge about "${topic}" for ${language}.

Return ONLY this JSON structure (no other text):
{
  "title": "Problem title",
  "description": "Full problem description (3-5 paragraphs)",
  "constraints": ["constraint 1", "constraint 2"],
  "examples": [
    { "input": "example input", "output": "expected output", "explanation": "why" }
  ],
  "inputFormat": "How input is structured",
  "outputFormat": "What output should look like",
  "starterCode": "// Starter code in ${language}\\nfunction solution() {\\n  // your code here\\n}",
  "testCases": [
    { "input": "test input 1", "expectedOutput": "expected 1", "hidden": false },
    { "input": "test input 2", "expectedOutput": "expected 2", "hidden": true }
  ],
  "hints": ["hint 1 - vague", "hint 2 - more specific", "hint 3 - almost the answer"],
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)"
}`;

  return generateStructured<CodingChallenge>({
    systemPrompt,
    userPrompt,
    temperature: 0.5,
    maxTokens: 3000,
  });
}

export async function reviewCode(params: {
  challenge: CodingChallenge;
  userCode: string;
  language: string;
}): Promise<CodeReviewResult> {
  const { challenge, userCode, language } = params;

  const systemPrompt = `You are an expert code reviewer. Analyze code for correctness, efficiency, and style.
Always respond with valid JSON only. No markdown fences. No extra text.`;

  const userPrompt = `Review this ${language} code for the problem: "${challenge.title}".

Problem: ${challenge.description}

Test Cases: ${JSON.stringify(challenge.testCases.filter((t) => !t.hidden))}

User's Code:
\`\`\`${language}
${userCode}
\`\`\`

Evaluate and return ONLY this JSON:
{
  "passed": true/false,
  "passedTests": number,
  "totalTests": ${challenge.testCases.length},
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1"],
  "suggestions": ["actionable suggestion 1", "suggestion 2"],
  "improvedApproach": "Brief description of optimal approach",
  "score": 0-100
}`;

  return generateStructured<CodeReviewResult>({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 2000,
  });
}

export async function generateHint(params: {
  challenge: CodingChallenge;
  hintIndex: number;
  userCode?: string;
}): Promise<string> {
  const { challenge, hintIndex, userCode } = params;

  if (challenge.hints[hintIndex]) {
    return challenge.hints[hintIndex];
  }

  return generateText({
    systemPrompt: 'You are a helpful coding mentor. Give precise, progressive hints without revealing the full solution.',
    userPrompt: `For this problem: "${challenge.title}", give hint #${hintIndex + 1}. Be progressively more specific.${
      userCode ? `\n\nUser's current code:\n${userCode}` : ''
    }`,
    temperature: 0.4,
    maxTokens: 300,
  });
}
