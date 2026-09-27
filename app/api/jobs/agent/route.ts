/**
 * app/api/jobs/agent/route.ts
 *
 * POST /api/jobs/agent — Bounded-Autonomous Job Intelligence Agent Endpoint.
 * Enforces strict limit of 3 searches per user.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { runJobIntelligenceAgent } from "@/lib/agents/jobIntelligence/jobIntelligenceAgent";
import { CustomSession } from "@/app/api/(user)/mentor/chat/route";
import { connectDb } from "@/config/db.config";
import User from "@/models/user.model";

// Allow up to 30 seconds execution time for Vercel serverless functions
export const maxDuration = 30;

const MAX_JOB_SEARCHES = 3;

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const user = await User.findById(session.user.id).lean();
    const count = (user as any)?.jobSearchCount || 0;
    const remaining = Math.max(0, MAX_JOB_SEARCHES - count);

    return NextResponse.json({
      success: true,
      jobSearchCount: count,
      maxSearches: MAX_JOB_SEARCHES,
      remainingSearches: remaining,
      limitReached: count >= MAX_JOB_SEARCHES,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized — Please sign in to access Job Intelligence Agent" },
        { status: 401 }
      );
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
          error: `Job Intelligence search limit reached (${MAX_JOB_SEARCHES} / ${MAX_JOB_SEARCHES} searches used). You have reached your maximum free agent searches.`,
          jobSearchCount: currentCount,
          maxSearches: MAX_JOB_SEARCHES,
          remainingSearches: 0,
          limitReached: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = body.message?.trim() || "Find suitable tech jobs and analyze my skill match.";

    console.log(`[JOB_AGENT_ROUTE] POST /api/jobs/agent triggered by user ${session.user.id} (${currentCount + 1}/${MAX_JOB_SEARCHES})`);

    // Increment usage count before running search
    user.jobSearchCount = currentCount + 1;
    await user.save();

    const result = await runJobIntelligenceAgent({
      userId: session.user.id,
      userMessage: message,
    });

    const newRemaining = Math.max(0, MAX_JOB_SEARCHES - user.jobSearchCount);

    return NextResponse.json(
      {
        ...result,
        jobSearchCount: user.jobSearchCount,
        maxSearches: MAX_JOB_SEARCHES,
        remainingSearches: newRemaining,
        limitReached: user.jobSearchCount >= MAX_JOB_SEARCHES,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[JOB_AGENT_ROUTE] Error processing agent request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute Job Intelligence Agent",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
