import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { connectDb } from '@/config/db.config';
import User from '@/models/user.model';
import Roadmap from '@/models/roadmap.model';
import { AptitudeAttempt } from '@/models/aptitudeAttempt.model';
import { SpeechAttempt } from '@/models/speechAttempt.model';
import { CodingAttempt } from '@/models/codingAttempt.model';
import { QuizAttempt } from '@/models/quizAttempt.model';
import HackathonProject from '@/models/hackathonProject.model';
import Post from '@/models/post.model';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await connectDb();

    // Fetch user first to get roadmap IDs
    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fan-out all other queries in parallel — zero waterfalls
    const [roadmaps, latestAptitude, latestSpeech, latestCoding, latestQuiz, latestHackathon, recentPosts] =
      await Promise.all([
        Roadmap.find({ _id: { $in: (user as any).roadmaps || [] } })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean(),
        AptitudeAttempt.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        SpeechAttempt.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        CodingAttempt.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        QuizAttempt.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        HackathonProject.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        Post.find()
          .sort({ createdAt: -1 })
          .limit(3)
          .populate('user', 'name image')
          .lean(),
      ]);

    const activeRoadmap = roadmaps[0] || null;

    // Compute roadmap progress defensively
    let roadmapProgress = 0;
    if (activeRoadmap) {
      const totalSteps = (activeRoadmap as any).steps?.length || 0;
      const completedEntry = ((activeRoadmap as any).completedSteps || []).find(
        (cs: any) => cs.userId?.toString() === userId
      );
      const completedCount = completedEntry?.stepIndices?.length || 0;
      roadmapProgress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
    }

    return NextResponse.json({
      user: {
        name: (user as any).name,
        email: (user as any).email,
        image: (user as any).image,
        bio: (user as any).bio,
        githubUrl: (user as any).githubUrl,
        linkedinUrl: (user as any).linkedinUrl,
        userName: (user as any).userName,
        createdAt: (user as any).createdAt,
        roadmapCount: ((user as any).roadmaps || []).length,
        chatCount: ((user as any).AiMentorChats || []).length,
        questionsAsked: ((user as any).questionsAsked || []).length,
        answersGiven: ((user as any).answersGiven || []).length,
      },
      activeRoadmap: activeRoadmap
        ? {
            title: (activeRoadmap as any).title,
            totalSteps: (activeRoadmap as any).steps?.length || 0,
            progress: roadmapProgress,
          }
        : null,
      telemetry: {
        aptitude: latestAptitude ? (latestAptitude as any).percentage : null,
        speech: latestSpeech ? Math.round(((latestSpeech as any).scores?.overall || 0) * 10) : null,
        coding: latestCoding ? (latestCoding as any).score : null,
        quiz: latestQuiz ? (latestQuiz as any).percentage : null,
      },
      hackathon: latestHackathon
        ? {
            id: (latestHackathon as any)._id,
            title: (latestHackathon as any).title,
            status: (latestHackathon as any).status,
            progress: (latestHackathon as any).progress || 0,
            totalTasks: ((latestHackathon as any).tasks || []).length,
            completedTasks: ((latestHackathon as any).tasks || []).filter(
              (t: any) => t.status === 'COMPLETED'
            ).length,
          }
        : null,
      recentPosts: recentPosts.map((p: any) => ({
        id: p._id,
        title: p.title,
        description: p.description?.slice(0, 100),
        tags: p.tags || [],
        authorName: p.user?.name || 'Anonymous',
        authorImage: p.user?.image,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Dashboard API Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
