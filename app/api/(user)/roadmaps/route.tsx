import { NextResponse,NextRequest } from "next/server";
import { connectDb } from "@/config/db.config";
import { User,Roadmap } from "@/models";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { CustomSession } from "../mentor/chat/route";
import mongoose from "mongoose";

export async function GET(){
      await connectDb();
            const session = await getServerSession(authOptions as any) as CustomSession;
        
            if (!session || !session.user?.id) {
              return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
            }
        
            const userId = session.user.id;

            try {
                const user = await User.findById(userId).populate<{ roadmaps: mongoose.Types.ObjectId[] }>({
                  path: "roadmaps",
                });
            
                if (!user || !user.roadmaps) {
                  return NextResponse.json({ message: "No roadmaps found for this user" }, { status: 400 });
                }
            
                return NextResponse.json({ message: "All roadmaps fetched", roadmaps: user.roadmaps }, { status: 200 });
              } catch (error) {
                console.log("Error fetching roadmaps", error);
                return NextResponse.json({ message: "Something went wrong while fetching roadmaps" }, { status: 500 });
              }
}

export async function PATCH(req: NextRequest) {
  await connectDb();
  const session = await getServerSession(authOptions as any) as CustomSession;
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const userId = session.user.id;
  
  try {
    const body = await req.json();
    const { roadmapId, stepIndex, completed } = body;
    
    if (!roadmapId || stepIndex === undefined) {
      return NextResponse.json({ message: "Roadmap ID and step index are required" }, { status: 400 });
    }
    
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      return NextResponse.json({ message: "Roadmap not found" }, { status: 404 });
    }
    
    const userProgressIndex = roadmap.completedSteps?.findIndex(
      (progress: { userId: mongoose.Types.ObjectId; stepIndices: number[] }) => progress.userId.toString() === userId
    );
    
    if (userProgressIndex === -1 || userProgressIndex === undefined) {
      roadmap.completedSteps = roadmap.completedSteps || [];
      roadmap.completedSteps.push({
        userId: new mongoose.Types.ObjectId(userId),
        stepIndices: completed ? [stepIndex] : []
      });
    } else {
      if (completed) {
        if (!roadmap.completedSteps[userProgressIndex].stepIndices.includes(stepIndex)) {
          roadmap.completedSteps[userProgressIndex].stepIndices.push(stepIndex);
        }
      } else {
        roadmap.completedSteps[userProgressIndex].stepIndices = 
          roadmap.completedSteps[userProgressIndex].stepIndices.filter((idx: number) => idx !== stepIndex);
      }
    }
    
    await roadmap.save();

    // ── Gamification: XP, Streak, Level & Badge ──────────────────────────────
    const user = await User.findById(userId);
    let gamificationUpdate: Record<string, unknown> = {};
    let newBadge: string | null = null;

    if (user && completed) {
      // ── XP: +50 per completed step ──────────────────────────────────────────
      const currentXp = (user.xp || 0) + 50;
      const newLevel = Math.floor(currentXp / 500) + 1;

      // ── Streak: check if consecutive day ───────────────────────────────────
      const now = new Date();
      const todayStr = now.toDateString();
      const lastActiveStr = user.streak?.lastActiveDate
        ? new Date(user.streak.lastActiveDate).toDateString()
        : null;

      let newCurrentStreak = user.streak?.current || 0;
      const newHighest = user.streak?.highest || 0;

      if (lastActiveStr !== todayStr) {
        // Check if yesterday was the last active day
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActiveStr === yesterdayStr) {
          newCurrentStreak += 1; // Consecutive day
        } else {
          newCurrentStreak = 1; // Streak broken — reset
        }
      }
      // else: already active today, don't bump streak

      gamificationUpdate = {
        xp: currentXp,
        level: newLevel,
        'streak.current': newCurrentStreak,
        'streak.highest': Math.max(newCurrentStreak, newHighest),
        'streak.lastActiveDate': now,
      };

      // ── Badge: award on 100% roadmap completion ─────────────────────────────
      const updatedProgress = roadmap.completedSteps?.find(
        (p: { userId: mongoose.Types.ObjectId; stepIndices: number[] }) => p.userId.toString() === userId
      );
      const totalSteps = roadmap.steps?.length || 0;
      const completedCount = updatedProgress?.stepIndices.length || 0;

      if (totalSteps > 0 && completedCount >= totalSteps) {
        const badgeName = `${roadmap.title} Conqueror`;
        const existingBadges: string[] = user.badges || [];
        if (!existingBadges.includes(badgeName)) {
          gamificationUpdate['$push'] = { badges: badgeName };
          newBadge = badgeName;
          // Bonus XP for full completion
          (gamificationUpdate as any).xp = currentXp + 500;
          (gamificationUpdate as any).level = Math.floor(((gamificationUpdate as any).xp as number) / 500) + 1;
        }
      }

      const { $push, ...setFields } = gamificationUpdate as any;
      const updateOp: Record<string, unknown> = { $set: setFields };
      if ($push) updateOp.$push = $push;
      await User.findByIdAndUpdate(userId, updateOp);
    }
    
    return NextResponse.json({ 
      message: "Roadmap progress updated successfully",
      completedSteps: roadmap.completedSteps?.find((progress: { userId: mongoose.Types.ObjectId; stepIndices: number[] }) => progress.userId.toString() === userId)?.stepIndices || [],
      gamification: user && completed ? {
        xp: (gamificationUpdate as any).xp,
        level: (gamificationUpdate as any).level,
        streak: (gamificationUpdate as any)['streak.current'],
        newBadge,
      } : null,
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error updating roadmap progress:", error);
    return NextResponse.json({ message: "Something went wrong while updating roadmap progress" }, { status: 500 });
  }
}


// ── DELETE: permanently remove a roadmap ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  await connectDb();
  const session = await getServerSession(authOptions as any) as CustomSession;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const roadmapId = searchParams.get("roadmapId");

  if (!roadmapId) {
    return NextResponse.json({ message: "roadmapId is required" }, { status: 400 });
  }

  try {
    const deleted = await Roadmap.findByIdAndDelete(roadmapId);
    if (!deleted) {
      return NextResponse.json({ message: "Roadmap not found" }, { status: 404 });
    }

    // Remove the reference from the user's roadmaps array
    await User.findByIdAndUpdate(userId, {
      $pull: { roadmaps: new mongoose.Types.ObjectId(roadmapId) }
    });

    return NextResponse.json({ message: "Roadmap deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json({ message: "Something went wrong while deleting the roadmap" }, { status: 500 });
  }
}