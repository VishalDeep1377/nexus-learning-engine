/**
 * GET   /api/hackathons/projects/[id] — get a single project (owner only)
 * PATCH /api/hackathons/projects/[id] — update a project (owner only)
 * DELETE /api/hackathons/projects/[id] — delete a project (owner only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { connectDb } from "@/config/db.config";
import HackathonProject from "@/models/hackathonProject.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyOwnership(projectId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return null;
  const project = await HackathonProject.findOne({
    _id: projectId,
    userId,
  }).lean();
  return project;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    await connectDb();
    const project = await verifyOwnership(id, session.user.id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (err) {
    console.error("[GET /api/hackathons/projects/[id]]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to load project." } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    await connectDb();
    const existing = await verifyOwnership(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    const body = await req.json();
    // Whitelist updatable fields — never let userId or _id be overwritten
    const allowed = [
      "title", "tagline", "problemStatement", "selectedIdea", "analysis",
      "architecture", "tasks", "progress", "status", "submission",
      "reviewResult", "pitch", "agentTrace", "deadline", "teamSize",
      "hackathonName", "hackathonRules", "hackathonJudgingCriteria",
    ];

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    // Auto-compute progress from tasks if tasks are being updated
    if (body.tasks && Array.isArray(body.tasks)) {
      const done = body.tasks.filter((t: { status: string }) => t.status === "COMPLETED").length;
      update.progress = Math.round((done / body.tasks.length) * 100);
    }

    const updated = await HackathonProject.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, lean: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /api/hackathons/projects/[id]]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update project." } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions as any) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    await connectDb();
    const existing = await verifyOwnership(id, session.user.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    await HackathonProject.findByIdAndDelete(id);

    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    console.error("[DELETE /api/hackathons/projects/[id]]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to delete project." } },
      { status: 500 }
    );
  }
}
