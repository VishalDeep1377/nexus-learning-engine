import { NextRequest,NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { CustomSession } from "../route";
import authOptions from "@/lib/auth";
import { User, Chat, Message } from "@/models/index";
import mongoose from "mongoose";
import { connectDb } from "@/config/db.config";


//get all messages
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any) as CustomSession;
  
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    await connectDb(); 
  
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { message: "Invalid user" },
        { status: 400 }
      );
    }
  
    try {
      // Fetch all user chats
      const allChats = await Chat.find({ user: currentUser._id })
        .populate<{ messages: mongoose.Types.ObjectId[] }>({
          path: "messages",
        }).lean();
      // console.log("All chats:", allChats);
  
      return NextResponse.json(
        { allChats, message: "All chats fetched successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching all chats:", error);
      return NextResponse.json(
        { message: "Error fetching all chats" },
        { status: 500 }
      );
    }
  }