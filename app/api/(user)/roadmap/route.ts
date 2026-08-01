import { CustomSession } from './../mentor/chat/route';
import { NextResponse, NextRequest } from "next/server";
import { Roadmap, User } from "@/models";
import { connectDb } from "@/config/db.config";
import { getServerSession } from "next-auth";
import { geminiRoadmapPrompt } from "@/lib/geminiRoadmapPrompt";
import authOptions from '@/lib/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";
import LinkedIn from "linkedin-jobs-api";

// ──────────────────────────────────────────────────────────────────────────────
// Helper: fetch related jobs from LinkedIn for AI context
// ──────────────────────────────────────────────────────────────────────────────
async function fetchRelatedJobs(skill: string) {
    try {
        const queryOptions = {
            keyword: skill,
            location: "",
            dateSincePosted: "past month",
            jobType: "full time",
            remoteFilter: "remote",
            salary: "",
            experienceLevel: "",
            limit: "10",
            page: "0",
        };
        const jobs = await LinkedIn.query(queryOptions);
        // Map to a lightweight shape for the prompt
        return (jobs as any[]).slice(0, 8).map((j: any) => ({
            title: j.position || j.title || "",
            company: j.company || "",
        }));
    } catch (err) {
        // Non-fatal: if job search fails, roadmap is still generated without context
        console.warn("[RoadmapAgent] Job search failed, skipping context:", err);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/roadmap — Generate a job-market-aware roadmap
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    await connectDb();
    const session = await getServerSession(authOptions as any) as CustomSession;

    if (!session || !session.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const reqBody = await req.json();
    const { skill, experience, learningPreference, expectedOutcome } = reqBody;

    if (!skill || !experience || !learningPreference || !expectedOutcome) {
        return NextResponse.json({ message: "All fields are mandatory" }, { status: 400 });
    }

    try {
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return NextResponse.json({ message: "Not a valid user" }, { status: 400 });
        }

        // ── Step 1: Agent searches for related jobs ──────────────────────────
        console.log(`[RoadmapAgent] Searching jobs for skill: "${skill}"`);
        const relatedJobs = await fetchRelatedJobs(skill);
        console.log(`[RoadmapAgent] Found ${relatedJobs.length} related jobs`);

        // ── Step 2: Generate roadmap with job market context ─────────────────
        const apiKey = process.env.GEMINI_API_KEY!;
        const genAI = new GoogleGenerativeAI(apiKey);
        const prompt = geminiRoadmapPrompt({
            skill,
            experience,
            learningPreference,
            expectedOutcome,
            relatedJobs,
        });

        const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            // Strip any accidental markdown code fences
            const cleanedResponseText = responseText
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();

            try {
                const parsedResult = JSON.parse(cleanedResponseText);
                const roadmapTitle = skill;
                const roadmapSteps = parsedResult.roadmap;
                const roadmapResources = parsedResult.resources;

                console.log("[RoadmapAgent] Roadmap generated:", { roadmapTitle, steps: roadmapSteps?.length });

                const newRoadmap = await Roadmap.create({
                    title: roadmapTitle,
                    steps: roadmapSteps,
                    resources: roadmapResources,
                });

                currentUser.roadmaps.push(newRoadmap._id);
                await currentUser.save();
            } catch (parseError) {
                console.error("[RoadmapAgent] Failed to parse Gemini response:", parseError);
                return NextResponse.json({ message: "Failed to parse roadmap from AI" }, { status: 500 });
            }
        } catch (geminiError) {
            console.error("[RoadmapAgent] Gemini request failed:", geminiError);
            return NextResponse.json({ message: "Failed to get response from AI" }, { status: 500 });
        }

        return NextResponse.json({
            message: "Roadmap created successfully",
            jobsUsedForContext: relatedJobs.length,
        }, { status: 200 });

    } catch (error) {
        console.error("[RoadmapAgent] Unexpected error:", error);
        return NextResponse.json({ message: "Error occurred in roadmap generation" }, { status: 500 });
    }
}
