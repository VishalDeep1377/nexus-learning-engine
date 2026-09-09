import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAptitudeQuestions } from '@/lib/agents/self-assessment/aptitude-agent';

const VALID_COUNTS = [5, 10, 15, 20];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category, subCategory, count = 10, difficulty = 'Mixed' } = body;

    if (!category) {
      return NextResponse.json({ error: 'category is required.' }, { status: 400 });
    }
    if (!VALID_COUNTS.includes(Number(count))) {
      return NextResponse.json({ error: 'count must be 5, 10, 15, or 20.' }, { status: 400 });
    }

    const test = await generateAptitudeQuestions({
      category,
      subCategory,
      count: Number(count) as 5 | 10 | 15 | 20,
      difficulty,
    });

    return NextResponse.json({ success: true, data: test });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate aptitude questions.';
    console.error('[/api/self-assessment/aptitude/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
