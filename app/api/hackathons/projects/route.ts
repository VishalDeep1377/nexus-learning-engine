/**
 * GET  /api/hackathons/projects — list the current user's projects
 * POST /api/hackathons/projects — create a new project
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { connectDb } from "@/config/db.config";
import HackathonProject from "@/models/hackathonProject.model";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    await connectDb();
    const projects = await HackathonProject.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: projects });
  } catch (err) {
    console.error("[GET /api/hackathons/projects]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to load projects." } },
      { status: 500 }
    );
  }
}

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
    const {
      title,
      tagline,
      problemStatement,
      hackathonName,
      hackathonRules,
      hackathonJudgingCriteria,
      deadline,
      teamSize,
      selectedIdea,
      analysis,
      tasks,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Project title is required." } },
        { status: 400 }
      );
    }

    const VALID_PRIORITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
    const VALID_STATUSES   = new Set(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']);

    // Priority aliases from OSS models → canonical enum
    const PRIORITY_MAP: Record<string, string> = {
      IMPORTANT: 'HIGH',
      NORMAL:    'MEDIUM',
      NICE:      'LOW',
      'NICE-TO-HAVE': 'LOW',
      URGENT:    'CRITICAL',
      ESSENTIAL: 'CRITICAL',
    };

    const sanitizeTasks = (rawTasks: any[]) =>
      rawTasks.map((t: any, i: number) => {
        const p = String(t.priority ?? '').toUpperCase();
        const s = String(t.status   ?? '').toUpperCase();
        return {
          ...t,
          id:       t.id       || `task-${i + 1}`,
          priority: VALID_PRIORITIES.has(p) ? p : (PRIORITY_MAP[p] ?? 'MEDIUM'),
          status:   VALID_STATUSES.has(s)   ? s : 'TODO',
        };
      });

    await connectDb();

    const project = await HackathonProject.create({
      userId: session.user.id,
      title: title.trim(),
      tagline: tagline?.trim(),
      problemStatement: problemStatement?.trim(),
      hackathonName: hackathonName?.trim(),
      hackathonRules: hackathonRules?.trim(),
      hackathonJudgingCriteria: hackathonJudgingCriteria?.trim(),
      deadline: deadline ? new Date(deadline) : undefined,
      teamSize: teamSize ? Number(teamSize) : 1,
      selectedIdea,
      analysis,
      tasks: tasks ? sanitizeTasks(tasks) : [],
      progress: tasks ? computeProgress(tasks) : 0,
      status: "IDEATION",
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/hackathons/projects]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to create project." } },
      { status: 500 }
    );
  }
}

function computeProgress(tasks: { status: string }[]): number {
  if (!tasks?.length) return 0;
  const done = tasks.filter((t) => t.status === "COMPLETED").length;
  return Math.round((done / tasks.length) * 100);
}
