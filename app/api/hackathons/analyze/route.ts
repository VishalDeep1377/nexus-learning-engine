/**
 * POST /api/hackathons/analyze
 * Runs Hackathon Analyzer + Idea Generator via orchestrator.
 * Returns: { analysis, ideasResult, trace }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { connectDb } from "@/config/db.config";
import User from "@/models/user.model";
import { runAnalyzeAndIdeate } from "@/lib/orchestrator/hackathonOrchestrator";
import type { CareerHackathonContext } from "@/types/hackathon";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      problemStatement,
      hackathonName,
      rules,
      judgingCriteria,
      constraints,
      deadline,
      teamSize,
    } = body;

    if (!problemStatement || problemStatement.trim().length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Problem statement must be at least 20 characters.",
          },
        },
        { status: 400 }
      );
    }

    // ── Build user career context ────────────────────────────────────────────
    let userContext: CareerHackathonContext | undefined;
    try {
      await connectDb();
      const user = await User.findById(session.user.id).populate("roadmaps").lean() as any;
      if (user) {
        const roadmaps: string[] = (user.roadmaps ?? []).map((r: any) => r.title || "").filter(Boolean);
        userContext = {
          userId: session.user.id,
          name: user.name,
          roadmaps,
        };
      }
    } catch (ctxErr) {
      console.warn("[analyze] Could not load user context (non-fatal):", ctxErr);
    }

    const result = await runAnalyzeAndIdeate({
      problemStatement: problemStatement.trim(),
      hackathonName: hackathonName?.trim(),
      rules: rules?.trim(),
      judgingCriteria: judgingCriteria?.trim(),
      constraints: constraints?.trim(),
      deadline,
      teamSize: teamSize ? Number(teamSize) : undefined,
      userContext,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[/api/hackathons/analyze]", err);

    // Don't expose internal details
    const userMessage = message.includes("GROQ_API_KEY")
      ? "AI service not configured. Please contact support."
      : message.includes("Rate limit")
      ? "AI service is temporarily busy. Please try again in a moment."
      : "Analysis failed. Please try again.";

    return NextResponse.json(
      { success: false, error: { code: "AGENT_ERROR", message: userMessage } },
      { status: 500 }
    );
  }
}
