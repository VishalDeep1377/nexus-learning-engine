import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from "next/server";
import User from "@/models/user.model";
import Chat from "@/models/chat.model";
import Message from "@/models/message.model";
import Roadmap from "@/models/roadmap.model"; // needed so Mongoose can populate user.roadmaps
import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiMentorPrompt } from '@/lib/geminiMentorPrompt';
import { CustomSession } from "./chat/route";
import authOptions from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Fetch session details
    const session = await getServerSession(authOptions as any) as CustomSession;

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const reqBody = await req.json();
    const { chatId, message } = reqBody;

    if (!userId || !chatId || !message) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Fetch current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ message: "Not a valid user" }, { status: 400 });
    }

    // Fetch current chat
    const currentChat = await Chat.findById(chatId).populate('messages');  // Populate messages
    if (!currentChat) {
      return NextResponse.json({ message: "Invalid chatId" }, { status: 400 });
    }

    // Create a new message with the user's message
    const newMessage = await Message.create({
      content: message,
      senderId: currentUser._id,
      chatId: currentChat._id,
    });
    newMessage.save();
    console.log("New message created.");

    // Add the new message to the chat
    currentChat.messages.push(newMessage._id);
    console.log("Message saved in the chat.");

    // Fetch updated chat and messages
    const updatedChat = await Chat.findById(chatId).populate('messages');
    const messagesArray = updatedChat?.messages;

    // Extract the text content of each message for the prompt
    const chatHistory = messagesArray?.slice().map((msg: any) =>
      `${msg.senderId === currentUser._id ? 'User' : 'AI'}: ${msg.content}`).join('\n') || '';
    console.log("this chats messages history is", chatHistory);
    const latestMessage = message;
    console.log("is this latest message", latestMessage);
    // Generate AI response using Gemini API
    const apiKey = process.env.GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(apiKey);
    // ── Mentor Context: read student's roadmaps directly from DB ─────────────
    // No separate server needed — queries MongoDB inline so context is always
    // available as long as Next.js is running.
    let contextPrefix = "";
    try {
      const userWithRoadmaps = await User.findById(userId)
        .populate<{ roadmaps: any[] }>("roadmaps")
        .lean();

      const roadmaps: any[] = userWithRoadmaps?.roadmaps ?? [];

      if (roadmaps.length > 0) {
        const targetRoles = roadmaps.map((r: any) => r.title).filter(Boolean);

        // Infer weak areas: first 2–3 foundational steps of the latest roadmap
        const latestSteps: string[] = roadmaps[roadmaps.length - 1]?.steps ?? [];
        const weakKeywords = ["basic", "beginner", "intro", "introduction", "fundamentals", "foundation", "overview"];
        const weakAreas = latestSteps
          .filter((s: string) => weakKeywords.some((kw) => s.toLowerCase().includes(kw)))
          .slice(0, 3);
        const displayWeak = weakAreas.length > 0 ? weakAreas : latestSteps.slice(0, 2);

        // Build the full roadmap steps context so the mentor knows EXACTLY what's in it
        const allStepsSummary = roadmaps.map((r: any) =>
          `Roadmap "${r.title}": ${(r.steps ?? []).join(" → ")}`
        ).join("\n");

        contextPrefix =
          `You are mentoring a specific student. Here is everything you know about them:\n` +
          `- Their learning roadmaps: ${targetRoles.join(", ")}\n` +
          `- Full roadmap content:\n${allStepsSummary}\n` +
          `- Current weak/foundational areas to focus on: ${displayWeak.join(", ") || "early steps"}\n` +
          `- Student name: ${userWithRoadmaps?.name ?? "the student"}\n\n` +
          `Use this information to give SPECIFIC, PERSONALIZED advice. ` +
          `Reference their actual roadmap topics and weak areas directly. ` +
          `Do NOT give generic advice or pretend you don't know their situation.\n\n`;

        console.log("[Mentor] Context injected for user:", userId, "| Roadmaps:", targetRoles);
      }
    } catch (ctxErr) {
      // Silent fallback — mentor continues with original prompt unchanged
      console.warn("[Mentor] Context fetch failed (non-fatal):", ctxErr);
    }
    // ─────────────────────────────────────────────────────────────────────────


    const prompt = geminiMentorPrompt(chatHistory, latestMessage, contextPrefix);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });


    // Retry helper with exponential backoff for 429 rate-limit errors
    async function generateWithRetry(retries = 3, delayMs = 2000): Promise<any> {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await model.generateContent(prompt);
        } catch (err: any) {
          const is429 = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("Too Many Requests");
          if (is429 && attempt < retries) {
            console.warn(`Gemini 429 rate limit hit. Retrying in ${delayMs}ms... (attempt ${attempt}/${retries})`);
            await new Promise(res => setTimeout(res, delayMs));
            delayMs *= 2; // exponential backoff
          } else {
            throw err;
          }
        }
      }
    }

    try {
      const result = await generateWithRetry();

      // Get response safely
      const responseText = result?.response?.text?.() || "";
      // console.log("Raw response from the model:", responseText);

      // No need to parse if it's not JSON
      const geminiReply = responseText.trim() || "Sorry, I couldn't understand that.";

      // Save the Gemini response as a new message
      const newMessage2 = await Message.create({
        content: geminiReply,
        receiverId: currentUser._id,
        chatId: currentChat._id,
      });

      newMessage2.save();
      currentChat.messages.push(newMessage2._id);
      await currentChat.save();
      console.log("Gemini response saved in the chat.");

      return NextResponse.json({ message: "Message received by mentor" }, { status: 200 });

    } catch (error: any) {
      const is429 = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Too Many Requests");
      console.error("Error processing Gemini response:", error);
      if (is429) {
        return NextResponse.json(
          { error: "AI mentor is busy right now (rate limit). Please wait a moment and try again." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Failed to get a valid response from Gemini." }, { status: 500 });
    }


  } catch (error) {
    console.log(error)
  }
}