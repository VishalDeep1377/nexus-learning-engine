import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { evaluateSpeechResponse } from '@/lib/agents/self-assessment/speech-agent';
import { connectDb } from '@/config/db.config';
import SpeechAttempt from '@/models/speechAttempt.model';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { question, transcript, category } = body;

    if (!question || !transcript) {
      return NextResponse.json({ error: 'question and transcript are required.' }, { status: 400 });
    }
    if (transcript.trim().length < 20) {
      return NextResponse.json({ error: 'Please provide a longer response (at least a few sentences).' }, { status: 400 });
    }

    const evaluation = await evaluateSpeechResponse({ question, transcript, category: category || 'general' });

    // Save attempt
    try {
      await connectDb();
      const userId = (session.user as any).id || (session.user as any)._id;
      if (userId) {
        await SpeechAttempt.create({
          userId: new mongoose.Types.ObjectId(userId),
          question,
          category: category || 'general',
          transcript,
          scores: {
            overall: evaluation.overallScore,
            relevance: evaluation.relevance,
            structure: evaluation.structure,
            clarity: evaluation.clarity,
            conciseness: evaluation.conciseness,
            grammar: evaluation.grammar,
          },
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          suggestions: evaluation.suggestions,
          improvedAnswer: evaluation.improvedAnswer,
        });
      }
    } catch (dbErr) {
      console.warn('[speech/evaluate] DB save failed (non-fatal):', dbErr);
    }

    return NextResponse.json({ success: true, data: evaluation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to evaluate speech response.';
    console.error('[/api/self-assessment/speech/evaluate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
