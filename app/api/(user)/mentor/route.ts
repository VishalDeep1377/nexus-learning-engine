import { getServerSession } from 'next-auth';
import { NextResponse, NextRequest } from "next/server";
import mongoose from 'mongoose';
import User from "@/models/user.model";
import Chat from "@/models/chat.model";
import Message from "@/models/message.model";
import Roadmap from "@/models/roadmap.model";
import CodingAttempt from '@/models/codingAttempt.model';
import SpeechAttempt from '@/models/speechAttempt.model';
import QuizAttempt from '@/models/quizAttempt.model';
import AptitudeAttempt from '@/models/aptitudeAttempt.model';
import HackathonProject from '@/models/hackathonProject.model';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiMentorPrompt, geminiChatNamePrompt } from '@/lib/geminiMentorPrompt';
import { CustomSession } from "./chat/route";
import authOptions from '@/lib/auth';
import { connectDb } from '@/config/db.config';
import { analysePerformance } from '@/lib/agents/self-assessment/assessment-analysis-agent';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const mentorModel = genAI.getGenerativeModel({
  model: "gemini-3.6-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
});

const namerModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.status === 429 || String(err?.message).includes('429') || String(err?.message).includes('Too Many Requests');
      const is503 = err?.status === 503 || String(err?.message).includes('503') || String(err?.message).includes('Service Unavailable');
      if ((is429 || is503) && attempt < retries) {
        console.warn(`Gemini 429/503 – retrying in ${delayMs}ms (attempt ${attempt}/${retries})`);
        await new Promise(res => setTimeout(res, delayMs));
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await getServerSession(authOptions as any) as CustomSession;
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { chatId, message } = await req.json();

    if (!chatId || !message) {
      return NextResponse.json({ message: "chatId and message are required" }, { status: 400 });
    }

    // ── 1. Fetch user & chat ─────────────────────────────────────────────────────
    const [currentUser, currentChat] = await Promise.all([
      User.findById(userId),
      Chat.findById(chatId).populate('messages'),
    ]);

    if (!currentUser) return NextResponse.json({ message: "User not found" }, { status: 400 });
    if (!currentChat) return NextResponse.json({ message: "Chat not found" }, { status: 400 });

    const userMsg = await Message.create({ content: message, senderId: currentUser._id, chatId: currentChat._id });
    currentChat.messages.push(userMsg._id);

    // Auto-name chat on first message
    const isFirstMessage = (currentChat.messages.length <= 1) || !currentChat.name || currentChat.name === 'New Chat';
    if (isFirstMessage) {
      withRetry(() => namerModel.generateContent(geminiChatNamePrompt(message)))
        .then(res => {
          const generatedName = res.response.text().trim().replace(/["']/g, '').slice(0, 60);
          if (generatedName) { currentChat.name = generatedName; currentChat.save(); }
        }).catch(e => console.warn('[Mentor] Auto-naming failed:', e));
    }

    const chatHistory = currentChat.messages
      .map((msg: any) => `${msg.senderId?.toString() === currentUser._id.toString() ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n') || '';

    // ── 2. Aggregating Platform-wide Context ────────────────────────────────────
    let contextPrefix = "";
    try {
      const dbUserId = new mongoose.Types.ObjectId(userId);

      // Perform parallel DB aggregation for extreme speed
      const [
        userWithRoadmaps, hackathons, codingAttempts, speechAttempts, quizAttempts, aptitudeAttempts
      ] = await Promise.all([
        User.findById(userId).populate("roadmaps").lean(),
        HackathonProject.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(3).lean(),
        CodingAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(20).lean(),
        SpeechAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
        QuizAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
        AptitudeAttempt.find({ userId: dbUserId }).sort({ createdAt: -1 }).limit(10).lean(),
      ]);

      let ctxStr = `**INTERNAL CONTEXT FOR ZENO (DO NOT OUTPUT DIRECTLY, JUST USE IT):**\n\n`;
      let hasData = false;

      // -- A. Roadmaps Context --
      const roadmaps = (userWithRoadmaps as any)?.roadmaps || [];
      if (roadmaps.length > 0) {
        hasData = true;
        const targetRoles = roadmaps.map((r: any) => r.title).filter(Boolean);
        const allStepsSummary = roadmaps.map((r: any) => `- **${r.title}**: ${(r.steps ?? []).join(" → ")}`).join("\n");
        ctxStr += `### Learning Roadmaps\nStudent is currently studying for: ${targetRoles.join(", ")}\n${allStepsSummary}\n\n`;
      }

      // -- B. Hackathon Context --
      if (hackathons && hackathons.length > 0) {
        hasData = true;
        const hackSummary = hackathons.map((h: any) => `- **${h.title}** (Event: ${h.hackathonName || 'Independent'} | Status: ${h.status}): ${h.problemStatement?.slice(0, 50)}...`).join("\n");
        ctxStr += `### Active Hackathons/Projects\n${hackSummary}\n\n`;
      }

      // -- C. Self Assessment Context (Skill Gap Analysis) --
      const perfData = {
        coding: { 
          problemsSolved: codingAttempts.length, 
          averageScore: codingAttempts.length ? Math.round(codingAttempts.reduce((s: number, a: any) => s + a.score, 0) / codingAttempts.length) : 0, 
          recentWeakTopics: [...new Set(codingAttempts.filter((a: any) => a.score < 60).map((a: any) => a.topic))].slice(0, 3) as string[]
        },
        speech: { 
          sessions: speechAttempts.length, 
          averageScore: speechAttempts.length ? Math.round((speechAttempts.reduce((s: number, a: any) => s + (a.scores?.overall || 0), 0) / speechAttempts.length) * 10) / 10 : 0, 
          recentWeakAreas: [...new Set(speechAttempts.filter((a: any) => (a.scores?.overall || 10) < 6).flatMap((a: any) => a.weaknesses || []))].slice(0, 3) as string[]
        },
        quizzes: { 
          questionsSolved: quizAttempts.reduce((s: number, a: any) => s + a.questionCount, 0), 
          accuracy: quizAttempts.length ? Math.round(quizAttempts.reduce((s: number, a: any) => s + a.percentage, 0) / quizAttempts.length) : 0, 
          weakTopics: [...new Set(quizAttempts.flatMap((a: any) => a.weakTopics || []))].slice(0, 3) as string[]
        },
        aptitude: { 
          questionsSolved: aptitudeAttempts.reduce((s: number, a: any) => s + a.questionCount, 0), 
          accuracy: aptitudeAttempts.length ? Math.round(aptitudeAttempts.reduce((s: number, a: any) => s + a.percentage, 0) / aptitudeAttempts.length) : 0, 
          weakCategories: [...new Set(aptitudeAttempts.flatMap((a: any) => a.weakCategories || []))].slice(0, 3) as string[]
        },
      };

      if (perfData.coding.problemsSolved > 0 || perfData.quizzes.questionsSolved > 0) {
        hasData = true;
        const skillGap = analysePerformance(perfData);
        ctxStr += `### Self Assessment Analytics\n`;
        ctxStr += `- **Overall Level**: ${skillGap.overall}\n`;
        ctxStr += `- **Coding Skills**: ${skillGap.coding} (Weak: ${perfData.coding.recentWeakTopics.join(', ') || 'None'})\n`;
        ctxStr += `- **Communication/Interviews**: ${skillGap.communication} (Weak: ${perfData.speech.recentWeakAreas.join(', ') || 'None'})\n`;
        ctxStr += `- **Technical Knowledge**: ${skillGap.technicalKnowledge} (Weak: ${perfData.quizzes.weakTopics.join(', ') || 'None'})\n`;
        ctxStr += `- **Aptitude**: ${skillGap.aptitude} (Weak: ${perfData.aptitude.weakCategories.join(', ') || 'None'})\n`;
        ctxStr += `- **Top AI Recommendations**: ${skillGap.topRecommendations.join(' | ')}\n\n`;
      }

      if (hasData) {
        ctxStr += `Student Name: ${currentUser?.name ?? "the student"}\n---\n\n`;
        contextPrefix = ctxStr;
      }
    } catch (ctxErr) {
      console.warn("[Mentor] Comprehensive Context fetch failed:", ctxErr);
    }

    // ── 3. Generate streaming response ───────────────────────────────────────────
    const prompt = geminiMentorPrompt(chatHistory, message, contextPrefix);
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamResult = await withRetry(() => mentorModel.generateContentStream(prompt));

          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            controller.enqueue(new TextEncoder().encode(chunkText));
          }

          const aiMsg = await Message.create({ content: fullResponse.trim() || "Sorry, I couldn't generate a response.", receiverId: currentUser._id, chatId: currentChat._id });
          currentChat.messages.push(aiMsg._id);
          await currentChat.save();

          controller.close();
        } catch (err: any) {
          const errMsg = "⚠️ Zeno is momentarily unavailable (Google API demand spike). Please try sending your message again.";
          controller.enqueue(new TextEncoder().encode(errMsg));
          try {
            const errorAiMsg = await Message.create({ content: errMsg, receiverId: currentUser._id, chatId: currentChat._id });
            currentChat.messages.push(errorAiMsg._id);
            await currentChat.save();
          } catch (dbErr) { console.error("[Mentor] Failed to save error message:", dbErr); }
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' } });

  } catch (error: any) {
    console.error("[Mentor] Unhandled error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}