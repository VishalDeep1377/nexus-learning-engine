/**
 * lib/agents/self-assessment/aptitude-agent.ts
 * Responsible for: generating aptitude questions with step-by-step solutions.
 *
 * IMPORTANT: AI-generated math must be validated. We generate + verify separately.
 */

import { generateStructured } from '@/lib/ai/groq';

export interface AptitudeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  solution: {
    steps: string[];
    finalAnswer: string;
    formula?: string;
  };
  category: string;
  subCategory: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimitSeconds: number;
}

export interface AptitudeTest {
  category: string;
  questions: AptitudeQuestion[];
  totalTimeSeconds: number;
  estimatedMinutes: number;
}

export interface AptitudeResult {
  score: number;
  total: number;
  percentage: number;
  timeTaken: number;
  categoryBreakdown: Record<string, { correct: number; total: number }>;
  recommendations: string[];
}

export async function generateAptitudeQuestions(params: {
  category: string;
  subCategory?: string;
  count: 5 | 10 | 15 | 20;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
}): Promise<AptitudeTest> {
  const { category, subCategory, count, difficulty = 'Mixed' } = params;
  const topic = subCategory || category;
  const timePerQuestion = 90;

  const systemPrompt = `You are an expert aptitude test creator specializing in placement exams (CAT, GMAT, etc.).
Generate precise, solvable questions with accurate step-by-step solutions.
For quantitative questions, verify your arithmetic before outputting.
Always respond with valid JSON only. No markdown fences. No extra text.`;

  const userPrompt = `Generate ${count} aptitude questions for: "${topic}" (${category}).
Difficulty: ${difficulty}
Time per question: ${timePerQuestion} seconds

Return ONLY this JSON:
{
  "category": "${category}",
  "questions": [
    {
      "id": "q1",
      "question": "Full question text with all numbers/data",
      "options": ["A) value1", "B) value2", "C) value3", "D) value4"],
      "correctAnswer": 0,
      "solution": {
        "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
        "finalAnswer": "Answer with unit",
        "formula": "Formula used (if applicable)"
      },
      "category": "${category}",
      "subCategory": "${topic}",
      "difficulty": "Easy|Medium|Hard",
      "timeLimitSeconds": ${timePerQuestion}
    }
  ],
  "totalTimeSeconds": ${count * timePerQuestion},
  "estimatedMinutes": ${Math.round((count * timePerQuestion) / 60)}
}

Important rules:
- For math: double-check arithmetic. The correct answer MUST match the solution steps.
- Make distractors realistic (common calculation errors)
- Mix difficulty if "Mixed"
- Include all data needed in the question itself`;

  const result = await generateStructured<AptitudeTest>({
    systemPrompt,
    userPrompt,
    temperature: 0.4,
    maxTokens: 4000,
  });

  if (!result.questions || result.questions.length === 0) {
    throw new Error('Failed to generate aptitude questions. Please try again.');
  }

  // Validate and sanitize
  result.questions = result.questions.slice(0, count).map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4
      ? q.options
      : ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
    correctAnswer:
      typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
        ? q.correctAnswer
        : 0,
    timeLimitSeconds: q.timeLimitSeconds || timePerQuestion,
    solution: q.solution || { steps: ['Solution not available.'], finalAnswer: 'See steps.' },
  }));

  result.totalTimeSeconds = result.questions.length * timePerQuestion;
  result.estimatedMinutes = Math.round(result.totalTimeSeconds / 60);

  return result;
}

export function gradeAptitudeTest(params: {
  questions: AptitudeQuestion[];
  userAnswers: (number | null)[];
  timeTaken: number;
}): AptitudeResult {
  const { questions, userAnswers, timeTaken } = params;

  let correct = 0;
  const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

  questions.forEach((q, i) => {
    const cat = q.subCategory || q.category;
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { correct: 0, total: 0 };
    categoryBreakdown[cat].total++;

    if (userAnswers[i] === q.correctAnswer) {
      correct++;
      categoryBreakdown[cat].correct++;
    }
  });

  const percentage = Math.round((correct / questions.length) * 100);

  const recommendations: string[] = [];
  const weakAreas = Object.entries(categoryBreakdown)
    .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.5)
    .map(([c]) => c);

  if (weakAreas.length > 0) {
    recommendations.push(`Practice more: ${weakAreas.join(', ')}`);
  }
  if (percentage < 50) {
    recommendations.push('Start with concept revision before timed practice.');
  } else if (percentage >= 80) {
    recommendations.push('Strong performance! Try Mixed Topic Test for broader coverage.');
  }

  return {
    score: correct,
    total: questions.length,
    percentage,
    timeTaken,
    categoryBreakdown,
    recommendations,
  };
}
