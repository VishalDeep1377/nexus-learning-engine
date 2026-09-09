import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSpeechQuestion } from '@/lib/agents/self-assessment/speech-agent';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { category, role } = body;

    const question = await generateSpeechQuestion({ category, role });

    return NextResponse.json({ success: true, data: question });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate question.';
    console.error('[/api/self-assessment/speech/question]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
