import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCodingChallenge } from '@/lib/agents/self-assessment/coding-agent';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { language, difficulty, topic } = body;

    if (!language || !difficulty || !topic) {
      return NextResponse.json({ error: 'language, difficulty, and topic are required.' }, { status: 400 });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty. Must be Easy, Medium, or Hard.' }, { status: 400 });
    }

    const challenge = await generateCodingChallenge({ language, difficulty, topic });

    return NextResponse.json({ success: true, data: challenge });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate challenge.';
    console.error('[/api/self-assessment/coding/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
