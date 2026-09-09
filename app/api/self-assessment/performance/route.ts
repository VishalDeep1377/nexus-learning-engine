import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDb } from '@/config/db.config';
import CodingAttempt from '@/models/codingAttempt.model';
import SpeechAttempt from '@/models/speechAttempt.model';
import QuizAttempt from '@/models/quizAttempt.model';
import AptitudeAttempt from '@/models/aptitudeAttempt.model';
import mongoose from 'mongoose';
import { analysePerformance } from '@/lib/agents/self-assessment/assessment-analysis-agent';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDb();
    const userId = new mongoose.Types.ObjectId((session.user as any).id || (session.user as any)._id);

    // Aggregate coding
    const codingAttempts = await CodingAttempt.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    const codingScore = codingAttempts.length
      ? Math.round(codingAttempts.reduce((s: number, a: any) => s + a.score, 0) / codingAttempts.length)
      : 0;
    const codingWeakTopics = [...new Set(
      codingAttempts.filter((a: any) => a.score < 60).map((a: any) => a.topic)
    )].slice(0, 5);

    // Aggregate speech
    const speechAttempts = await SpeechAttempt.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    const speechScore = speechAttempts.length
      ? Math.round((speechAttempts.reduce((s: number, a: any) => s + a.scores.overall, 0) / speechAttempts.length) * 10) / 10
      : 0;
    const speechWeakAreas = [...new Set(
      speechAttempts.filter((a: any) => a.scores.overall < 6).flatMap((a: any) => a.weaknesses)
    )].slice(0, 3) as string[];

    // Aggregate quizzes
    const quizAttempts = await QuizAttempt.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    const quizAccuracy = quizAttempts.length
      ? Math.round(quizAttempts.reduce((s: number, a: any) => s + a.percentage, 0) / quizAttempts.length)
      : 0;
    const quizWeakTopics = [...new Set(quizAttempts.flatMap((a: any) => a.weakTopics))].slice(0, 5) as string[];

    // Aggregate aptitude
    const aptitudeAttempts = await AptitudeAttempt.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    const aptAccuracy = aptitudeAttempts.length
      ? Math.round(aptitudeAttempts.reduce((s: number, a: any) => s + a.percentage, 0) / aptitudeAttempts.length)
      : 0;
    const aptWeakCategories = [...new Set(aptitudeAttempts.flatMap((a: any) => a.weakCategories))].slice(0, 5) as string[];

    // Recent activity
    const recentCoding = codingAttempts.slice(0, 3).map((a: any) => ({
      type: 'coding', label: a.challengeTitle, score: `${a.score}%`, createdAt: a.createdAt,
    }));
    const recentSpeech = speechAttempts.slice(0, 3).map((a: any) => ({
      type: 'speech', label: String(a.question).slice(0, 50), score: `${a.scores.overall}/10`, createdAt: a.createdAt,
    }));
    const recentQuiz = quizAttempts.slice(0, 3).map((a: any) => ({
      type: 'quiz', label: a.topic, score: `${a.score}/${a.total}`, createdAt: a.createdAt,
    }));
    const recentAptitude = aptitudeAttempts.slice(0, 3).map((a: any) => ({
      type: 'aptitude', label: a.category, score: `${a.score}/${a.total}`, createdAt: a.createdAt,
    }));

    const recentActivity = [...recentCoding, ...recentSpeech, ...recentQuiz, ...recentAptitude]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 8);

    const performanceData = {
      coding: { problemsSolved: codingAttempts.length, averageScore: codingScore, recentWeakTopics: codingWeakTopics as string[] },
      speech: { sessions: speechAttempts.length, averageScore: speechScore, recentWeakAreas: speechWeakAreas },
      quizzes: { questionsSolved: quizAttempts.reduce((s: number, a: any) => s + a.questionCount, 0), accuracy: quizAccuracy, weakTopics: quizWeakTopics },
      aptitude: { questionsSolved: aptitudeAttempts.reduce((s: number, a: any) => s + a.questionCount, 0), accuracy: aptAccuracy, weakCategories: aptWeakCategories },
    };
    const skillGap = analysePerformance(performanceData);

    return NextResponse.json({
      success: true,
      data: {
        coding: { problemsSolved: codingAttempts.length, averageScore: codingScore, weakTopics: codingWeakTopics },
        speech: { sessions: speechAttempts.length, averageScore: speechScore, weakAreas: speechWeakAreas },
        quizzes: { questionsSolved: performanceData.quizzes.questionsSolved, accuracy: quizAccuracy, weakTopics: quizWeakTopics },
        aptitude: { questionsSolved: performanceData.aptitude.questionsSolved, accuracy: aptAccuracy, weakCategories: aptWeakCategories },
        recentActivity,
        skillGap,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch performance.';
    console.error('[/api/self-assessment/performance]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
