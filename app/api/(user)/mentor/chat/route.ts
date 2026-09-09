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
    const newChat = await Chat.create({
      name: 'New Chat',
      messages: [],
      user: currentUser._id,
    });

    currentUser.AiMentorChats.push(newChat._id);
    await currentUser.save();

    return NextResponse.json(
      { message: "Chat successfully created", chat: newChat },
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

// ── DELETE: remove a chat and all its messages ──────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as CustomSession;
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectDb();
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');
  if (!chatId) return NextResponse.json({ message: 'chatId required' }, { status: 400 });

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ message: 'Chat not found' }, { status: 404 });

    // Delete all messages belonging to this chat
    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    // Remove from user's chat list
    await User.findByIdAndUpdate(session.user.id, { $pull: { AiMentorChats: chatId } });

    return NextResponse.json({ message: 'Chat deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ message: 'Error deleting chat' }, { status: 500 });
  }
}

// ── PATCH: rename a chat ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as CustomSession;
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectDb();
  const { chatId, name } = await req.json();
  if (!chatId || !name) return NextResponse.json({ message: 'chatId and name required' }, { status: 400 });

  try {
    const updated = await Chat.findByIdAndUpdate(chatId, { name }, { new: true });
    if (!updated) return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    return NextResponse.json({ message: 'Chat renamed', chat: updated }, { status: 200 });
  } catch (error) {
    console.error('Error renaming chat:', error);
    return NextResponse.json({ message: 'Error renaming chat' }, { status: 500 });
  }
}
