/**
 * lib/agents/self-assessment/speech-agent.ts
 * Responsible for: generating interview questions, evaluating transcripts, STAR analysis.
 */

import { generateStructured, generateText } from '@/lib/ai/groq';

export interface SpeechQuestion {
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'general';
  tips: string[];
  expectedStructure?: string;
}

export interface SpeechEvaluation {
  overallScore: number;
  relevance: number;
  structure: number;
  clarity: number;
  conciseness: number;
  grammar: number;
  technicalCommunication: number;
  interviewQuality: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  starAnalysis?: {
    situation: string;
    task: string;
    action: string;
    result: string;
    score: number;
  };
  improvedAnswer: string;
}

const INTERVIEW_QUESTION_BANK = [
  { question: 'Tell me about yourself and your background.', category: 'general' as const },
  { question: 'Describe a time you solved a difficult technical problem.', category: 'behavioral' as const },
  { question: 'What are your greatest strengths as a developer?', category: 'general' as const },
  { question: 'Why should we hire you for this role?', category: 'general' as const },
  { question: 'Where do you see yourself in five years?', category: 'general' as const },
  { question: 'Describe a situation where you had to work under pressure with a tight deadline.', category: 'situational' as const },
  { question: 'How do you handle disagreements with team members?', category: 'behavioral' as const },
  { question: 'Explain a complex technical concept to a non-technical audience.', category: 'technical' as const },
];

export async function generateSpeechQuestion(params?: {
  category?: string;
  role?: string;
}): Promise<SpeechQuestion> {
  const { category, role } = params || {};

  const systemPrompt = `You are an expert interview coach. Generate realistic interview questions.
Always respond with valid JSON only. No markdown fences. No extra text.`;

  const userPrompt = `Generate an interview question${category ? ` for category: ${category}` : ''}${role ? ` for a ${role} role` : ''}.

Return ONLY this JSON:
{
  "question": "The interview question",
  "category": "behavioral|technical|situational|general",
  "tips": ["tip 1 for answering", "tip 2"],
  "expectedStructure": "STAR method / direct answer / etc"
}`;

  try {
    return await generateStructured<SpeechQuestion>({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 500,
    });
  } catch {
    // Fallback to question bank
    const random = INTERVIEW_QUESTION_BANK[Math.floor(Math.random() * INTERVIEW_QUESTION_BANK.length)];
    return {
      ...random,
      tips: ['Structure your answer clearly', 'Use specific examples', 'Keep it concise (1-2 minutes)'],
      expectedStructure: random.category === 'behavioral' ? 'STAR method' : 'Direct + Example',
    };
  }
}

export function getRandomQuestion(): SpeechQuestion {
  const random = INTERVIEW_QUESTION_BANK[Math.floor(Math.random() * INTERVIEW_QUESTION_BANK.length)];
  return {
    ...random,
    tips: ['Structure your answer clearly', 'Use specific examples', 'Keep it concise'],
    expectedStructure: random.category === 'behavioral' ? 'STAR method' : 'Direct answer with examples',
  };
}

export async function evaluateSpeechResponse(params: {
  question: string;
  transcript: string;
  category: string;
}): Promise<SpeechEvaluation> {
  const { question, transcript, category } = params;

  const systemPrompt = `You are an expert interview coach and communication trainer. Evaluate speech responses objectively.
Score all metrics from 0-10. Be encouraging but honest.
Always respond with valid JSON only. No markdown fences. No extra text.`;

  const userPrompt = `Evaluate this interview response.

Question: "${question}"
Category: ${category}

Transcript:
"${transcript}"

Return ONLY this JSON:
{
  "overallScore": 7.5,
  "relevance": 8,
  "structure": 7,
  "clarity": 8,
  "conciseness": 6,
  "grammar": 9,
  "technicalCommunication": 7,
  "interviewQuality": 7,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1"],
  "suggestions": ["actionable suggestion 1", "suggestion 2"],
  "starAnalysis": {
    "situation": "Was situation established? Brief assessment.",
    "task": "Was task defined? Brief assessment.",
    "action": "Were actions clear? Brief assessment.",
    "result": "Was result quantified? Brief assessment.",
    "score": 7
  },
  "improvedAnswer": "A better version of this response in 2-3 sentences."
}`;

  return generateStructured<SpeechEvaluation>({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 2000,
  });
}
