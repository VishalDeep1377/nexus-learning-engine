"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  RotateCcw,
  Sparkles,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type Difficulty = "beginner" | "intermediate" | "advanced";

type Phase = "setup" | "loading" | "quiz" | "results";

interface UserAnswer {
  questionId: number;
  selectedIndex: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "from-emerald-500 to-teal-600",
  intermediate: "from-blue-500 to-indigo-600",
  advanced: "from-purple-500 to-fuchsia-600",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "🌱 Beginner",
  intermediate: "⚡ Intermediate",
  advanced: "🔥 Advanced",
};

const POPULAR_SKILLS = [
  "JavaScript",
  "Python",
  "TypeScript",
  "React",
  "Node.js",
  "Java",
  "Go",
  "SQL",
  "Docker",
  "System Design",
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function InterviewComponent() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [skill, setSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState("");
  // ── User roadmap skills (fetched on mount) ─────────────────────────────────
  const [roadmapSkills, setRoadmapSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  useEffect(() => {
    // Fetch user's roadmaps — use their titles as the interview skill options
    axios
      .get("/api/roadmaps")
      .then((res) => {
        const titles: string[] = (res.data.roadmaps ?? [])
          .map((r: any) => r.title)
          .filter(Boolean);
        setRoadmapSkills(titles);
      })
      .catch(() => {
        // Silent fallback to popular skills if fetch fails
      })
      .finally(() => setSkillsLoading(false));
  }, []);

  // Skills to display: user's roadmap titles, or popular list if none exist
  const displaySkills = roadmapSkills.length > 0 ? roadmapSkills : POPULAR_SKILLS;

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeSkill = skill === "Other" ? customSkill : skill;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = userAnswers.find((a) => a.questionId === currentQuestion?.id);
  const hasAnswered = currentAnswer?.selectedIndex !== null && currentAnswer?.selectedIndex !== undefined;
  const isCorrect =
    hasAnswered && currentAnswer!.selectedIndex === currentQuestion?.correctIndex;

  const score = userAnswers.filter((a) => {
    const q = questions.find((q) => q.id === a.questionId);
    return q && a.selectedIndex === q.correctIndex;
  }).length;

  const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!activeSkill.trim()) {
      setError("Please select or enter a skill.");
      return;
    }
    setError("");
    setPhase("loading");

    try {
      const res = await axios.post("/api/interview", {
        skill: activeSkill,
        difficulty,
        count: 10,
      });
      setQuestions(res.data.questions);
      setUserAnswers(res.data.questions.map((q: Question) => ({ questionId: q.id, selectedIndex: null })));
      setCurrentIndex(0);
      setShowExplanation(false);
      setPhase("quiz");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate questions. Please try again.");
      setPhase("setup");
    }
  };

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return; // lock after answering
    setUserAnswers((prev) =>
      prev.map((a) =>
        a.questionId === currentQuestion.id ? { ...a, selectedIndex: index } : a
      )
    );
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowExplanation(false);
    } else {
      setPhase("results");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setPhase("setup");
    setQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);
    setShowExplanation(false);
    setError("");
  };

  const getScoreMessage = () => {
    if (scorePercent >= 90) return { text: "Outstanding! 🏆", color: "text-yellow-400" };
    if (scorePercent >= 70) return { text: "Great job! 🎉", color: "text-green-400" };
    if (scorePercent >= 50) return { text: "Good effort! Keep going! 💪", color: "text-blue-400" };
    return { text: "Keep practicing! You'll get there! 📚", color: "text-purple-400" };
  };

  // ── Render: Setup ──────────────────────────────────────────────────────────
  if (phase === "setup" || phase === "loading") {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#06080f] flex items-center justify-center p-4">
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
        </div>
        
        <div className="w-full max-w-2xl relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-white/10">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 tracking-tight">Interview Prep</h1>
            <p className="text-gray-400 text-lg font-medium">AI-powered mock interviews tailored to your skill level</p>
          </div>

          {/* Card */}
          <div className="bg-[#0a0d14]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
            {/* Skill Selection */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-300 mb-1 uppercase tracking-widest">
                Choose a Skill
              </label>
              <p className="text-xs text-gray-500 mb-4 font-medium">
                {skillsLoading
                  ? "Loading your roadmaps..."
                  : roadmapSkills.length > 0
                  ? `Based on your ${roadmapSkills.length} roadmap${roadmapSkills.length > 1 ? "s" : ""}`
                  : "No roadmaps yet — showing popular skills"}
              </p>
              {skillsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-11 bg-white/5 rounded-xl border border-white/5" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {displaySkills.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkill(s)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                        skill === s
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                          : "bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.06] hover:text-gray-300 hover:-translate-y-0.5"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setSkill("Other")}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                      skill === "Other"
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        : "bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.06] hover:text-gray-300 hover:-translate-y-0.5"
                    }`}
                  >
                    Other
                  </button>
                </div>
              )}
              {skill === "Other" && (
                <input
                  type="text"
                  placeholder="e.g., Rust, Kubernetes, GraphQL..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-sm"
                />
              )}
            </div>


            {/* Difficulty Selection */}
            <div className="mb-10">
              <label className="block text-sm font-bold text-gray-300 mb-4 uppercase tracking-widest">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => {
                  const [icon, text] = DIFFICULTY_LABELS[d].split(" ");
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex flex-col items-center justify-center py-3 sm:py-3.5 px-1 rounded-xl sm:rounded-2xl transition-all duration-300 border ${
                        difficulty === d
                          ? `bg-gradient-to-r ${DIFFICULTY_COLORS[d]} border-transparent text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] md:scale-105`
                          : "bg-white/[0.03] border-white/5 text-gray-500 hover:bg-white/[0.06] hover:text-gray-400 hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="text-lg sm:text-xl mb-1">{icon}</span>
                      <span className="text-[11px] sm:text-[13px] font-bold tracking-wide truncate w-full text-center px-0.5">{text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-6 text-center bg-red-500/10 border border-red-500/20 py-3 rounded-xl font-medium">
                {error}
              </p>
            )}

            <button
              onClick={handleStart}
              disabled={phase === "loading"}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 shadow-[0_10px_40px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_50px_rgba(59,130,246,0.6)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 hover:-translate-y-1"
            >
              {phase === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Quiz ───────────────────────────────────────────────────────────
  if (phase === "quiz") {
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen relative overflow-hidden bg-[#06080f] flex items-center justify-center p-4">
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
        </div>

        <div className="w-full max-w-3xl relative z-10 pt-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                 <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight">{activeSkill}</span>
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{difficulty} Mode</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
               <span className="text-white font-bold">{currentIndex + 1}</span>
               <span className="text-gray-500"> / {questions.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/5 border border-white/5 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-[#0a0d14]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
            <h2 className="text-2xl font-bold text-white mb-8 leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-4 mb-8">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentAnswer?.selectedIndex === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;
                let optionStyle = "bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.06] hover:border-white/20 cursor-pointer";

                if (hasAnswered) {
                  if (isCorrectOption) {
                    optionStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "bg-red-500/10 border-red-500/50 text-red-300 cursor-default";
                  } else {
                    optionStyle = "bg-white/[0.01] border-white/5 text-gray-600 cursor-default";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group ${optionStyle}`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${hasAnswered && isCorrectOption ? 'bg-emerald-500/20 text-emerald-400' : hasAnswered && isSelected && !isCorrectOption ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-[15px] font-medium leading-relaxed">{option}</span>
                    {hasAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div
                className={`p-4 rounded-xl mb-6 border ${
                  isCorrect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1 text-sm uppercase tracking-wider">
                  {isCorrect ? (
                    <><CheckCircle2 className="w-4 h-4" /> Correct!</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Incorrect</>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-gray-300">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!hasAnswered}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-blue-500/20"
              >
                {currentIndex === questions.length - 1 ? "See Results" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Results ────────────────────────────────────────────────────────
  const { text: scoreMsg, color: scoreColor } = getScoreMessage();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#06080f] p-4 py-12">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none fade-in duration-1000">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10 pt-10">
        {/* Score Card */}
        <div className="bg-[#0a0d14]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.8)] text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-[0_0_40px_rgba(234,179,8,0.4)] border border-white/20">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className={`text-4xl font-black mb-2 tracking-tight ${scoreColor}`}>{scoreMsg}</h2>
          <p className="text-gray-400 mb-8 text-lg font-medium">
            {activeSkill} <span className="mx-2 opacity-50">|</span> <span className="capitalize">{difficulty} Mode</span>
          </p>

          {/* Score circle */}
          <div className="flex items-center justify-center mb-10">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - scorePercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1500 ease-out drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300">{scorePercent}%</span>
                <span className="text-sm font-semibold text-gray-500 mt-1">{score}/{questions.length} correct</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all hover:-translate-y-0.5 text-[15px]"
          >
            <RotateCcw className="w-4 h-4" /> Start New Interview
          </button>
        </div>

        {/* Answer Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
            <span className="w-8 h-px bg-white/20" /> Review Detailed Answers <span className="flex-1 h-px bg-white/10" />
          </h3>
          {questions.map((q, qIdx) => {
            const ans = userAnswers.find((a) => a.questionId === q.id);
            const answered = ans?.selectedIndex !== null && ans?.selectedIndex !== undefined;
            const correct = answered && ans!.selectedIndex === q.correctIndex;

            return (
              <div
                key={q.id}
                className={`bg-[#0a0d14]/60 backdrop-blur-md rounded-2xl p-6 border ${
                  correct ? "border-emerald-500/20" : "border-red-500/20"
                } transition-colors hover:bg-[#0a0d14]/80`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-1.5 rounded-lg border ${correct ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} flex-shrink-0`}>
                    {correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-lg mb-4 leading-snug">
                      <span className="text-gray-500 mr-2">{qIdx + 1}.</span> {q.question}
                    </p>
                    
                    <div className="space-y-2 mb-4 bg-white/[0.02] rounded-xl p-4 border border-white/5">
                        {answered && !correct && (
                        <div className="flex items-start gap-2 text-[14px]">
                            <span className="font-semibold text-red-400 shrink-0 w-24">Your Answer:</span>
                            <span className="text-gray-300">{q.options[ans!.selectedIndex!]}</span>
                        </div>
                        )}
                        <div className="flex items-start gap-2 text-[14px]">
                            <span className="font-semibold text-emerald-400 shrink-0 w-24">Correct:</span>
                            <span className="text-gray-200">{q.options[q.correctIndex]}</span>
                        </div>
                    </div>
                    
                    <div className="text-[14px] text-gray-400 bg-blue-500/[0.02] border border-blue-500/10 rounded-xl p-4 leading-relaxed">
                        <span className="font-semibold text-blue-400 mb-1 block text-xs uppercase tracking-wider">Explanation</span>
                        {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
