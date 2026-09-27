import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { CustomSession } from "../../(user)/mentor/chat/route";
import User from "@/models/user.model";
import { connectDb } from "@/config/db.config";

/**
 * GET /api/user/adaptation-notice
 * Returns the active adaptation notice for the current user if adaptation is required and not dismissed.
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const notice = currentUser.adaptationNotice;
    if (notice && notice.adaptationRequired && !notice.dismissed) {
      return NextResponse.json({ notice }, { status: 200 });
    }

    return NextResponse.json({ notice: null }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/user/adaptation-notice] Error:", error);
    return NextResponse.json({ message: "Error fetching adaptation notice" }, { status: 500 });
  }
}

/**
 * POST /api/user/adaptation-notice
 * Dismisses or clears the current adaptation notice.
 * Body: { action: "dismiss" | "clear" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as CustomSession;
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.adaptationNotice) {
      currentUser.adaptationNotice.dismissed = true;
      currentUser.adaptationNotice.adaptationRequired = false;
      await currentUser.save();
    }

    return NextResponse.json({ message: "Adaptation notice updated" }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/user/adaptation-notice] Error:", error);
    return NextResponse.json({ message: "Error updating adaptation notice" }, { status: 500 });
  }
}
