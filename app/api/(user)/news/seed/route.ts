import { NextResponse, NextRequest } from "next/server";
import { News } from "@/models";
import { connectDb } from "@/config/db.config";

const DEMO_NEWS = [
  {
    author: "John Carter",
    title: "OpenAI Releases GPT-5 with Unprecedented Reasoning Capabilities",
    description:
      "OpenAI has officially unveiled GPT-5, its most powerful language model to date, featuring advanced reasoning, multimodal understanding, and real-time web browsing built in. Developers are already reporting dramatic improvements in code generation and problem-solving benchmarks.",
    url: "https://openai.com",
    imageUrl:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    source: "TechCrunch",
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    author: "Priya Sharma",
    title: "Google DeepMind's AlphaFold 3 Solves 200M Protein Structures",
    description:
      "DeepMind's latest AlphaFold 3 model has predicted over 200 million protein structures with near-experimental accuracy, a breakthrough that could accelerate drug discovery for diseases from Alzheimer's to cancer.",
    url: "https://deepmind.google",
    imageUrl:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
    source: "Nature",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    author: "Lena Weber",
    title: "Apple Vision Pro 2 Announced with 8K Display and Neural Engine",
    description:
      "Apple has announced the successor to its Vision Pro spatial computing headset, boasting an all-new 8K per-eye micro-OLED display, a revamped M4 Ultra Neural Engine for on-device AI, and a significantly lighter form factor.",
    url: "https://apple.com",
    imageUrl:
      "https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=800&q=80",
    source: "The Verge",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    author: "Marcus Lin",
    title: "Rust Overtakes Python as Most Loved Language for Third Year Running",
    description:
      "Stack Overflow's annual developer survey reveals Rust has maintained its title as the most loved programming language for the third consecutive year, with an adoption surge in systems programming and WebAssembly projects.",
    url: "https://stackoverflow.com/survey",
    imageUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    source: "Stack Overflow",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    author: "Sarah Kim",
    title: "Meta Launches Llama 4 Open Source Model Rivaling GPT-4o",
    description:
      "Meta has open-sourced Llama 4, a 405 billion parameter model that benchmarks competitively against GPT-4o and Claude 3.5 Sonnet on coding, math, and reasoning tasks. The model is free for commercial use.",
    url: "https://ai.meta.com",
    imageUrl:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80",
    source: "Wired",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    author: "Alex Torres",
    title: "Nvidia's Blackwell Ultra GPUs Shatter AI Training Records",
    description:
      "Nvidia's latest Blackwell Ultra architecture GPUs have set new records in large language model training throughput, achieving 4x the performance of the previous H100 generation. Major cloud providers are already placing orders for next-gen AI supercomputers.",
    url: "https://nvidia.com",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    source: "AnandTech",
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
  },
  {
    author: "Diana Patel",
    title: "Quantum Computing Startup Achieves 1000-Qubit Milestone",
    description:
      "A Silicon Valley-based quantum computing startup has announced the world's first stable 1000-qubit processor, a feat that experts say brings fault-tolerant quantum computing within a 5-year horizon.",
    url: "https://quantumcomputing.com",
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    source: "MIT Technology Review",
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
  },
  {
    author: "Raj Mehta",
    title: "Next.js 15.3 Ships with Built-in AI Code Completion",
    description:
      "Vercel has released Next.js 15.3 featuring native AI-powered code completion, automatic component optimization, and a new Turbopack engine that cuts build times by up to 80% on large monorepos.",
    url: "https://nextjs.org",
    imageUrl:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80",
    source: "Dev.to",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    author: "Elena Novak",
    title: "SpaceX Starship Completes First Fully Reusable Round Trip",
    description:
      "SpaceX's Starship completed its first fully reusable round-trip mission, successfully launching, reaching orbit, re-entering, and landing both the Super Heavy booster and the Starship upper stage within a 90-minute window.",
    url: "https://spacex.com",
    imageUrl:
      "https://images.unsplash.com/photo-1516849677043-ef67c9557e16?w=800&q=80",
    source: "Space.com",
    publishedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
  },
  {
    author: "Tom Wilson",
    title: "GitHub Copilot Now Writes Tests Autonomously Using AI Agents",
    description:
      "GitHub has upgraded Copilot with an autonomous testing agent capable of analyzing codebases, identifying untested paths, and generating comprehensive unit test suites with no human prompt required.",
    url: "https://github.com",
    imageUrl:
      "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&q=80",
    source: "GitHub Blog",
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
  },
  {
    author: "Fatima Al-Hassan",
    title: "New React 20 Compiler Eliminates Need for useCallback and useMemo",
    description:
      "The React team has previewed React 20's fully automatic compiler that intelligently memoizes components and values, officially deprecating manual performance hooks like useCallback, useMemo, and React.memo.",
    url: "https://react.dev",
    imageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    source: "React Blog",
    publishedAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
  },
  {
    author: "Chris Park",
    title: "Tesla's Full Self-Driving 13 Achieves Level 4 Autonomy in California",
    description:
      "Tesla has received regulatory approval for Level 4 autonomous driving in select California highways after FSD v13 passed 1 million mile safety benchmarks with zero critical interventions required.",
    url: "https://tesla.com",
    imageUrl:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
    source: "Electrek",
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

export async function GET(req: NextRequest) {
  await connectDb();
  try {
    const existing = await News.countDocuments();
    if (existing > 0) {
      return NextResponse.json(
        { message: `DB already has ${existing} articles. Skipping seed. Use ?force=true to reseed.` },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";
    if (force) {
      await News.deleteMany({});
    }

    await News.insertMany(DEMO_NEWS);
    return NextResponse.json(
      { message: `✅ Seeded ${DEMO_NEWS.length} demo news articles successfully!`, count: DEMO_NEWS.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error seeding news:", error);
    return NextResponse.json(
      { message: "Failed to seed news", error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    await News.deleteMany({});
    await News.insertMany(DEMO_NEWS);
    return NextResponse.json(
      { message: `✅ Reseeded ${DEMO_NEWS.length} demo news articles!`, count: DEMO_NEWS.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error reseeding news:", error);
    return NextResponse.json(
      { message: "Failed to reseed news", error: error?.message },
      { status: 500 }
    );
  }
}
