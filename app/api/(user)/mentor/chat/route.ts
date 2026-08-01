import { NextRequest, NextResponse } from "next/server";
import Chat from "@/models/chat.model";
import { randomUUID } from "crypto";
import User from "@/models/user.model";
import { getServerSession } from "next-auth";
import { connectDb } from "@/config/db.config";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import Message from "@/models/message.model";

export interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as CustomSession;

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  console.log("User ID creating the chat:", userId);

  await connectDb();
  
  const currentUser = await User.findById(userId);
  if (!currentUser) {
    return NextResponse.json(
      { message: "Invalid user" },
      { status: 400 }
    );
  }

  try {
    // Create a new chat
    const randomName = randomUUID();
    const newChat = await Chat.create({
      name: randomName,
      messages: [],
      user: currentUser._id,
    });

    currentUser.AiMentorChats.push(newChat._id);
    console.log("chat creation successfull");
    console.log("message is in the chat",newChat._id);
    await currentUser.save();

    return NextResponse.json(
      { message: "Chat successfully created", chatId: newChat._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating new chat:", error);
    return NextResponse.json(
      { message: "Error creating new chat" },
      { status: 500 }
    );
  }
}



