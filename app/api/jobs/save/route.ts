import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { connectDb } from "@/config/db.config";
import User from "@/models/user.model";
import { CustomSession } from "@/app/api/(user)/mentor/chat/route";

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      savedJobs: (user as any).savedJobs || [],
    });
  } catch (err: any) {
    console.error("[JOB_SAVE_GET_ERROR]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch saved jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { jobId, title, company, location, jobUrl, salary, postedAgo } = body;

    if (!jobId || !title) {
      return NextResponse.json({ success: false, error: "Missing required job details" }, { status: 400 });
    }

    await connectDb();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.savedJobs) {
      user.savedJobs = [];
    }

    const existingIndex = user.savedJobs.findIndex(
      (j: any) => j.jobId === jobId || (j.title?.toLowerCase() === title?.toLowerCase() && j.company?.toLowerCase() === company?.toLowerCase())
    );
    let isSaved = false;

    if (existingIndex >= 0) {
      // Unsave job
      user.savedJobs.splice(existingIndex, 1);
      isSaved = false;
    } else {
      // Save job
      user.savedJobs.push({
        jobId,
        title,
        company: company || "Tech Company",
        location: location || "Remote",
        jobUrl: jobUrl || "#",
        salary,
        postedAgo,
        savedAt: new Date(),
      });
      isSaved = true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      isSaved,
      savedJobs: user.savedJobs,
    });
  } catch (err: any) {
    console.error("[JOB_SAVE_POST_ERROR]", err);
    return NextResponse.json({ success: false, error: "Failed to save job" }, { status: 500 });
  }
}
