import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gradeAptitudeTest } from '@/lib/agents/self-assessment/aptitude-agent';
import { connectDb } from '@/config/db.config';
import AptitudeAttempt from '@/models/aptitudeAttempt.model';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { questions, userAnswers, timeTaken, category } = body;

    if (!questions || !Array.isArray(questions) || !userAnswers || !Array.isArray(userAnswers)) {
      return NextResponse.json({ error: 'questions and userAnswers arrays are required.' }, { status: 400 });
    }

    const result = gradeAptitudeTest({ questions, userAnswers, timeTaken: timeTaken || 0 });

    // Save attempt
    try {
      await connectDb();
      const userId = (session.user as any).id || (session.user as any)._id;
      if (userId) {
        const weakCategories = Object.entries(result.categoryBreakdown)
          .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.5)
          .map(([c]) => c);

        await AptitudeAttempt.create({
          userId: new mongoose.Types.ObjectId(userId),
          category: category || 'Mixed',
          questionCount: questions.length,
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          timeTaken: result.timeTaken,
          weakCategories,
        });
      }
    } catch (dbErr) {
      console.warn('[aptitude/submit] DB save failed (non-fatal):', dbErr);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit aptitude test.';
    console.error('[/api/self-assessment/aptitude/submit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
