/**
 * POST /api/hackathons/plan
 * Generates a build plan for a selected project idea.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { connectDb } from "@/config/db.config";
import User from "@/models/user.model";
import { runBuildPlan } from "@/lib/orchestrator/hackathonOrchestrator";
import type { CareerHackathonContext } from "@/types/hackathon";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { selectedIdea, analysis, hackathonName, deadline, teamSize } = body;

    if (!selectedIdea || !analysis) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "selectedIdea and analysis are required." },
        },
        { status: 400 }
      );
    }

    // Load user context
    let userContext: CareerHackathonContext | undefined;
    try {
      await connectDb();
      const user = await User.findById(session.user.id).lean() as any;
      if (user) {
        userContext = {
          userId: session.user.id,
          name: user.name,
        };
      }
    } catch (e) {
      console.warn("[plan] User context failed (non-fatal):", e);
    }

    const result = await runBuildPlan({
      selectedIdea,
      analysis,
      hackathonName,
      deadline,
      teamSize: teamSize ? Number(teamSize) : 1,
      userContext,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/hackathons/plan]", err);

    const userMessage = message.includes("GROQ_API_KEY")
      ? "AI service not configured."
      : "Failed to generate build plan. Please try again.";

    return NextResponse.json(
      { success: false, error: { code: "AGENT_ERROR", message: userMessage } },
      { status: 500 }
    );
  }
}
