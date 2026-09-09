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
      (progress) => progress.userId.toString() === userId
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
          roadmap.completedSteps[userProgressIndex].stepIndices.filter(idx => idx !== stepIndex);
      }
    }
    
    await roadmap.save();
    
    return NextResponse.json({ 
      message: "Roadmap progress updated successfully",
      completedSteps: roadmap.completedSteps?.find(progress => progress.userId.toString() === userId)?.stepIndices || []
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