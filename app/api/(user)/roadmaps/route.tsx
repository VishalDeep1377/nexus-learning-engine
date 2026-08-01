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
            
                // Extract only the roadmaps and return them in the response
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
    
    // Find the roadmap
    const roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      return NextResponse.json({ message: "Roadmap not found" }, { status: 404 });
    }
    
    // Check if this user already has progress recorded for this roadmap
    const userProgressIndex = roadmap.completedSteps?.findIndex(
      (progress) => progress.userId.toString() === userId
    );
    
    if (userProgressIndex === -1 || userProgressIndex === undefined) {
      // User doesn't have progress yet, create a new entry
      roadmap.completedSteps = roadmap.completedSteps || [];
      roadmap.completedSteps.push({
        userId: new mongoose.Types.ObjectId(userId),
        stepIndices: completed ? [stepIndex] : []
      });
    } else {
      // User already has progress
      if (completed) {
        // Add the step if it's not already there
        if (!roadmap.completedSteps[userProgressIndex].stepIndices.includes(stepIndex)) {
          roadmap.completedSteps[userProgressIndex].stepIndices.push(stepIndex);
        }
      } else {
        // Remove the step if it's there
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