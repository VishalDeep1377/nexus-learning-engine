import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewCode } from '@/lib/agents/self-assessment/coding-agent';
import { connectDb } from '@/config/db.config';
import CodingAttempt from '@/models/codingAttempt.model';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { challenge, userCode, language } = body;

    if (!challenge || !userCode || !language) {
      return NextResponse.json({ error: 'challenge, userCode, and language are required.' }, { status: 400 });
    }
    if (!userCode.trim()) {
      return NextResponse.json({ error: 'Code cannot be empty.' }, { status: 400 });
    }

    const result = await reviewCode({ challenge, userCode, language });

    // Save attempt to DB
    try {
      await connectDb();
      const userId = (session.user as any).id || (session.user as any)._id;
      if (userId) {
        await CodingAttempt.create({
          userId: new mongoose.Types.ObjectId(userId),
          challengeTitle: challenge.title,
          language,
          topic: challenge.topic,
          difficulty: challenge.difficulty,
          code: userCode,
          passedTests: result.passedTests,
          totalTests: result.totalTests,
          score: result.score,
          timeComplexity: result.timeComplexity,
          spaceComplexity: result.spaceComplexity,
          feedback: {
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            suggestions: result.suggestions,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[coding/review] DB save failed (non-fatal):', dbErr);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to review code.';
    console.error('[/api/self-assessment/coding/review]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
