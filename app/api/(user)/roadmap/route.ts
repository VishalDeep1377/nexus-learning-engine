/**
 * app/api/(user)/roadmap/route.ts
 *
 * POST /api/roadmap — Generate a personalised, job-market-aware learning roadmap.
 *
 * Pipeline:
 *   1. Authenticate (NextAuth)
 *   2. Validate request body
 *   3. Fetch LinkedIn jobs
 *   4. Normalize jobs + extract skill frequency signals
 *   5. Call MCP Context Server (POST /context, 5s timeout)
 *   6. Fallback: build context directly from MongoDB if MCP unavailable
 *   7. Build Gemini prompt from context
 *   8. Generate roadmap via Gemini
 *   9. Validate AI output
 *  10. Save Roadmap document to MongoDB
 *  11. Link roadmap to User
 *  12. Return response (no internal MCP status exposed to browser)
 */

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import LinkedIn from "linkedin-jobs-api";

import { connectDb } from "@/config/db.config";
import { Roadmap, User } from "@/models";
import authOptions from "@/lib/auth";
import { geminiRoadmapPrompt } from "@/lib/geminiRoadmapPrompt";
import { buildLearnerContext } from "@/lib/buildLearnerContext";
import { CustomSession } from "./../mentor/chat/route";
import type {
  CareerParams,
  JobContext,
  SkillSignal,
  GeminiLearnerContext,
  MCPContextResponse,
  RoadmapRequestBody,
  RoadmapAIOutput,
} from "@/types/mcp";

// ── Environment ───────────────────────────────────────────────────────────────

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:3001";
const MCP_SERVER_SECRET = process.env.MCP_SERVER_SECRET ?? "";
const MCP_TIMEOUT_MS = 5000;

// ── Job normalisation + skill extraction ──────────────────────────────────────

/**
 * Common tech skills used to match against job titles/descriptions
 * when no structured description is available.
 */
const KNOWN_SKILLS = [
  "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Swift",
  "Kotlin", "Ruby", "Scala", "R", "MATLAB", "Dart",
  "React", "Next.js", "Vue", "Angular", "Svelte", "Node.js", "Express", "FastAPI", "Django",
  "Flask", "Spring", "Laravel", "Rails",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "DynamoDB", "Cassandra",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD", "GitHub Actions",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "scikit-learn",
  "REST API", "GraphQL", "gRPC", "WebSockets",
  "Git", "Linux", "Bash", "SQL", "Data Structures", "Algorithms", "System Design",
];

function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_SKILLS.filter(skill =>
    lower.includes(skill.toLowerCase())
  );
}

function normalizeJobs(rawJobs: any[]): JobContext[] {
  return rawJobs.slice(0, 10).map((j: any) => {
    const title = j.position || j.title || "";
    const company = j.company || "";
    const location = j.location || "";
    const description = j.description || j.jobDescription || "";
    const url = j.jobUrl || j.link || "";
    const postedAt = j.agoTime || j.date || "";

    // Extract skills from description if available, otherwise from title
    const skillSource = description.length > 20 ? description : `${title} ${company}`;
    const skills = extractSkillsFromText(skillSource);

    return { title, company, location, description: description || undefined, url, postedAt, skills };
  });
}

function computeSkillFrequency(jobs: JobContext[]): SkillSignal[] {
  const freq: Record<string, number> = {};
  for (const job of jobs) {
    for (const skill of job.skills) {
      freq[skill] = (freq[skill] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .map(([skill, frequency]) => ({ skill, frequency }));
}

async function fetchRelatedJobs(skill: string): Promise<JobContext[]> {
  try {
    console.log(`[ROADMAP] Fetching LinkedIn jobs for: "${skill}"`);
    const rawJobs = await LinkedIn.query({
      keyword: skill,
      location: "",
      dateSincePosted: "past month",
      jobType: "full time",
      remoteFilter: "remote",
      salary: "",
      experienceLevel: "",
      limit: "10",
      page: "0",
    });
    const normalized = normalizeJobs(rawJobs as any[]);
    console.log(`[ROADMAP] Jobs fetched: ${normalized.length}`);
    return normalized;
  } catch (err) {
    console.warn("[ROADMAP] LinkedIn job fetch failed — continuing without job context:", err);
    return [];
  }
}

// ── MCP context retrieval ─────────────────────────────────────────────────────

async function fetchMCPContext(
  userId: string,
  career: CareerParams,
  jobData: JobContext[],
  topSkills: SkillSignal[]
): Promise<MCPContextResponse | null> {
  if (!MCP_SERVER_SECRET) {
    console.warn("[MCP] MCP_SERVER_SECRET is not set — skipping MCP, using fallback");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

  try {
    console.log("[MCP] Context request started");
    const res = await fetch(`${MCP_SERVER_URL}/context`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-mcp-secret": MCP_SERVER_SECRET,
      },
      body: JSON.stringify({ userId, careerParams: career, jobData, topSkills }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[MCP] Context request returned HTTP ${res.status} — using fallback`);
      return null;
    }

    const data = await res.json() as MCPContextResponse;
    console.log("[MCP] Context retrieved successfully");
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      console.warn(`[MCP] Context request timed out after ${MCP_TIMEOUT_MS}ms — using fallback`);
    } else {
      console.warn("[MCP] Context request failed:", err?.message ?? err);
    }
    return null;
  }
}

// ── Gemini generation ─────────────────────────────────────────────────────────

async function generateRoadmapFromGemini(
  context: GeminiLearnerContext,
  career: CareerParams
): Promise<RoadmapAIOutput> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

  const prompt = geminiRoadmapPrompt(context);

  console.log("[ROADMAP] Gemini generation started");
  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Strip accidental markdown fences
  const cleaned = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as RoadmapAIOutput;

  if (!Array.isArray(parsed.roadmap) || !Array.isArray(parsed.resources)) {
    throw new Error("AI response missing 'roadmap' or 'resources' arrays");
  }
  if (parsed.roadmap.length === 0) {
    throw new Error("AI returned empty roadmap array");
  }

  console.log(`[ROADMAP] Gemini generation completed — ${parsed.roadmap.length} steps, ${parsed.resources.length} resources`);
  return parsed;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[ROADMAP] Request started");

  await connectDb();
  const session = await getServerSession(authOptions as any) as CustomSession;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json() as RoadmapRequestBody;
  const { skill, experience, learningPreference, expectedOutcome } = body;

  // ── Step 2: Validate ───────────────────────────────────────────────────────
  if (!skill || !experience || !learningPreference || !expectedOutcome) {
    return NextResponse.json({ message: "All fields are mandatory" }, { status: 400 });
  }
  console.log("[ROADMAP] Input validated");

  const career: CareerParams = { skill, experience, learningPreference, expectedOutcome };

  try {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    // ── Step 3–5: LinkedIn + normalization + skill frequency ─────────────────
    const jobData = await fetchRelatedJobs(skill);
    console.log("[ROADMAP] Jobs normalized");

    const topSkills = computeSkillFrequency(jobData);
    console.log(`[ROADMAP] Job skills extracted — top: ${topSkills.slice(0, 3).map(s => s.skill).join(", ") || "none"}`);

    // ── Step 6: MCP context retrieval ─────────────────────────────────────────
    let mcpResponse = await fetchMCPContext(userId, career, jobData, topSkills);
    let learnerContext: GeminiLearnerContext;

    if (mcpResponse && mcpResponse.context) {
      learnerContext = mcpResponse.context as GeminiLearnerContext;
      console.log("[MCP] Context applied to roadmap pipeline");
    } else {
      // ── Step 7 (fallback): Build context directly from MongoDB ──────────────
      console.log("[MCP] Falling back to direct context build");
      try {
        learnerContext = await buildLearnerContext(userId, career, jobData, topSkills);
        console.log("[MCP] Fallback context built successfully");
      } catch (fbErr) {
        // If even fallback fails, use absolute minimal legacy path
        console.warn("[MCP] Fallback context build failed — using minimal context:", fbErr);
        learnerContext = {
          profile: { userId, experienceLevel: experience },
          learning: { activeRoadmapTitles: [], totalCompletedSteps: 0, completedTopics: [] },
          performance: {},
          skillGap: { strengths: [], weakAreas: [], missingSkills: [] },
          career,
          projects: { activeHackathonProjects: [] },
          jobMarket: topSkills.length > 0 ? {
            source: "LinkedIn Jobs API",
            retrievedAt: new Date().toISOString(),
            jobCount: jobData.length,
            jobs: jobData,
            topSkills,
            skillsExtractedFromDescriptions: false,
          } : undefined,
          summary: {
            currentLevel: experience,
            targetRole: `${skill} — ${expectedOutcome}`,
            strongSkills: [],
            weakSkills: [],
            topMarketSkills: topSkills.slice(0, 5).map(s => s.skill),
            priorityAreas: [],
          },
        };
      }
    }

    // ── Step 8–9: Gemini generation + validation ──────────────────────────────
    let aiOutput: RoadmapAIOutput;
    try {
      aiOutput = await generateRoadmapFromGemini(learnerContext, career);
    } catch (geminiErr) {
      console.error("[ROADMAP][GEMINI] Generation failed:", geminiErr);
      return NextResponse.json({ message: "Failed to generate roadmap from AI" }, { status: 500 });
    }

    console.log("[ROADMAP] Roadmap validated");

    // ── Step 10–11: Persist to MongoDB ───────────────────────────────────────
    let newRoadmap;
    try {
      newRoadmap = await Roadmap.create({
        title: skill,
        steps: aiOutput.roadmap,
        resources: aiOutput.resources,
      });

      currentUser.roadmaps.push(newRoadmap._id);
      await currentUser.save();
    } catch (dbErr) {
      console.error("[ROADMAP][DB] Persistence failed:", dbErr);
      return NextResponse.json({ message: "Failed to save roadmap" }, { status: 500 });
    }

    console.log(`[ROADMAP] Roadmap saved — id: ${newRoadmap._id}`);

    // ── Step 12: Return response (no internal MCP status exposed) ─────────────
    return NextResponse.json({
      message: "Roadmap created successfully",
      jobsUsedForContext: jobData.length,
    }, { status: 200 });

  } catch (error) {
    console.error("[ROADMAP] Unexpected error:", error);
    return NextResponse.json({ message: "Error occurred in roadmap generation" }, { status: 500 });
  }
}
