import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { CustomSession } from "@/app/api/(user)/mentor/chat/route";
import { connectDb } from "@/config/db.config";
import User from "@/models/user.model";
import LinkedIn from 'linkedin-jobs-api';

const MAX_JOB_SEARCHES = 3;

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const currentCount = user.jobSearchCount || 0;
    if (currentCount >= MAX_JOB_SEARCHES) {
      return NextResponse.json(
        {
          success: false,
          error: `Job search limit reached (${MAX_JOB_SEARCHES} / ${MAX_JOB_SEARCHES} searches used).`,
          jobSearchCount: currentCount,
          maxSearches: MAX_JOB_SEARCHES,
          remainingSearches: 0,
          limitReached: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { keyword, location, experienceLevel } = body;

    if (!keyword || !location || !experienceLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    user.jobSearchCount = currentCount + 1;
    await user.save();

    const queryOptions = {
      keyword,
      location,
      dateSincePosted: 'past Week',
      jobType: 'full time',
      remoteFilter: 'remote',
      salary: '100000',
      experienceLevel,
      limit: '20',
      page: "0",
    };

    try {
      const response = await LinkedIn.query(queryOptions);
      return NextResponse.json(response);
    } catch (linkedinError) {
      console.error('LinkedIn API Error:', linkedinError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs from LinkedIn' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}