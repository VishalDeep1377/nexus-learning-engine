import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gradeQuiz } from '@/lib/agents/self-assessment/quiz-agent';
import { connectDb } from '@/config/db.config';
import QuizAttempt from '@/models/quizAttempt.model';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { questions, userAnswers, topic } = body;

    if (!questions || !Array.isArray(questions) || !userAnswers || !Array.isArray(userAnswers)) {
      return NextResponse.json({ error: 'questions and userAnswers arrays are required.' }, { status: 400 });
    }

    const result = gradeQuiz(questions, userAnswers);

    // Save attempt
    try {
      await connectDb();
      const userId = (session.user as any).id || (session.user as any)._id;
      if (userId) {
        await QuizAttempt.create({
          userId: new mongoose.Types.ObjectId(userId),
          topic: topic || 'General',
          questionCount: questions.length,
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          weakTopics: result.weakTopics,
          strongTopics: result.strongTopics,
        });
      }
    } catch (dbErr) {
      console.warn('[quizzes/submit] DB save failed (non-fatal):', dbErr);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit quiz.';
    console.error('[/api/self-assessment/quizzes/submit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
