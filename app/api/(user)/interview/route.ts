import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiInterviewPrompt } from "@/lib/geminiInterviewPrompt";
import { CustomSession } from "../mentor/chat/route";

// POST /api/interview — Generate AI interview questions for a given skill
export async function POST(req: NextRequest) {
    const session = (await getServerSession(authOptions as any)) as CustomSession;

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { skill, difficulty = "intermediate", count = 10 } = body;

        if (!skill) {
            return NextResponse.json({ message: "Skill is required" }, { status: 400 });
        }

        const validDifficulties = ["beginner", "intermediate", "advanced"];
        if (!validDifficulties.includes(difficulty)) {
            return NextResponse.json(
                { message: "Difficulty must be beginner, intermediate, or advanced" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY!;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

        const prompt = geminiInterviewPrompt({ skill, difficulty, count });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Strip any accidental markdown code fences
        const cleaned = responseText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseError) {
            console.error("[Interview API] Failed to parse Gemini response:", parseError);
            console.error("[Interview API] Raw response:", cleaned);
            return NextResponse.json(
                { message: "Failed to parse interview questions from AI" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Interview questions generated successfully",
            skill: parsed.skill || skill,
            difficulty: parsed.difficulty || difficulty,
            questions: parsed.questions,
        }, { status: 200 });

    } catch (error) {
        console.error("[Interview API] Error:", error);
        return NextResponse.json(
            { message: "Failed to generate interview questions" },
            { status: 500 }
        );
    }
}
