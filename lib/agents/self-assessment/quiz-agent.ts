/**
 * lib/agents/self-assessment/quiz-agent.ts
 * Responsible for: generating quiz questions, explanations, identifying weak topics.
 */

import { generateStructured } from '@/lib/ai/groq';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export interface GeneratedQuiz {
  topic: string;
  questions: QuizQuestion[];
  estimatedMinutes: number;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  correctAnswers: number[];
  weakTopics: string[];
  strongTopics: string[];
  recommendations: string[];
  breakdown: {
    questionId: string;
    correct: boolean;
    topic: string;
    difficulty: string;
  }[];
}

export async function generateQuiz(params: {
  topic: string;
  count: 5 | 10 | 15 | 20;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
}): Promise<GeneratedQuiz> {
  const { topic, count, difficulty = 'Mixed' } = params;

  const systemPrompt = `You are an expert quiz generator. Create clear, unambiguous multiple-choice questions.
Each question must have exactly 4 options. Only one is correct.
Always respond with valid JSON only. No markdown fences. No extra text.`;

  const userPrompt = `Generate ${count} multiple-choice quiz questions about "${topic}".
Difficulty: ${difficulty}

Return ONLY this JSON:
{
  "topic": "${topic}",
  "estimatedMinutes": ${Math.ceil(count * 1.2)},
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct and others are wrong.",
      "difficulty": "Easy|Medium|Hard",
      "topic": "sub-topic"
    }
  ]
}

Rules:
- correctAnswer is the index (0-3) of the correct option
- Make distractors plausible but clearly wrong on reflection
- Explanation should be educational
- Vary difficulty if Mixed
- Cover different sub-topics within "${topic}"`;

  const result = await generateStructured<GeneratedQuiz>({
    systemPrompt,
    userPrompt,
    temperature: 0.6,
    maxTokens: 4000,
  });

  // Validate: ensure we have the correct number of questions
  if (!result.questions || result.questions.length === 0) {
    throw new Error('AI returned no quiz questions. Please try again.');
  }

  // Validate each question structure
  result.questions = result.questions.slice(0, count).map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
  }));

  return result;
}

export function gradeQuiz(
  questions: QuizQuestion[],
  userAnswers: number[]
): QuizResult {
  const breakdown = questions.map((q, i) => ({
    questionId: q.id,
    correct: userAnswers[i] === q.correctAnswer,
    topic: q.topic,
    difficulty: q.difficulty,
  }));

  const correctAnswerIndices = breakdown
    .map((b, i) => (b.correct ? i : -1))
    .filter((i) => i !== -1);

  const score = correctAnswerIndices.length;
  const total = questions.length;
  const percentage = Math.round((score / total) * 100);

  // Group by topic
  const topicStats: Record<string, { correct: number; total: number }> = {};
  breakdown.forEach((b) => {
    if (!topicStats[b.topic]) topicStats[b.topic] = { correct: 0, total: 0 };
    topicStats[b.topic].total++;
    if (b.correct) topicStats[b.topic].correct++;
  });

  const weakTopics = Object.entries(topicStats)
    .filter(([, s]) => s.correct / s.total < 0.6)
    .map(([topic]) => topic);

  const strongTopics = Object.entries(topicStats)
    .filter(([, s]) => s.correct / s.total >= 0.8)
    .map(([topic]) => topic);

  const recommendations: string[] = [];
  if (weakTopics.length > 0) {
    recommendations.push(`Focus on: ${weakTopics.join(', ')}`);
  }
  if (percentage < 60) {
    recommendations.push('Review foundational concepts before attempting harder questions.');
  } else if (percentage >= 90) {
    recommendations.push('Excellent performance! Try a harder difficulty level.');
  }

  return {
    score,
    total,
    percentage,
    correctAnswers: correctAnswerIndices,
    weakTopics,
    strongTopics,
    recommendations,
    breakdown,
  };
}
