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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Interview Prep</h1>
            <p className="text-gray-400 text-lg">AI-powered mock interviews tailored to your skill level</p>
          </div>

          {/* Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            {/* Skill Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Choose a Skill
              </label>
              <p className="text-xs text-gray-500 mb-3">
                {skillsLoading
                  ? "Loading your roadmaps..."
                  : roadmapSkills.length > 0
                  ? `Based on your ${roadmapSkills.length} roadmap${roadmapSkills.length > 1 ? "s" : ""}`
                  : "No roadmaps yet — showing popular skills"}
              </p>
              {skillsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 bg-gray-700/40 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {displaySkills.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkill(s)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        skill === s
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setSkill("Other")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      skill === "Other"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700"
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
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              )}
            </div>


            {/* Difficulty Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      difficulty === d
                        ? `bg-gradient-to-r ${DIFFICULTY_COLORS[d]} border-transparent text-white shadow-lg`
                        : "bg-gray-700/30 border-gray-600/50 text-gray-400 hover:bg-gray-700/60"
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4 text-center bg-red-400/10 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleStart}
              disabled={phase === "loading"}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-semibold">{activeSkill}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 text-sm capitalize">{difficulty}</span>
            </div>
            <span className="text-gray-400 text-sm">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-700 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentAnswer?.selectedIndex === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;
                let optionStyle = "bg-gray-700/40 border-gray-600/50 text-gray-300 hover:bg-gray-700/70 hover:border-gray-500 cursor-pointer";

                if (hasAnswered) {
                  if (isCorrectOption) {
                    optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 cursor-default";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "bg-red-500/20 border-red-500 text-red-300 cursor-default";
                  } else {
                    optionStyle = "bg-gray-700/20 border-gray-700/50 text-gray-500 cursor-default";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${optionStyle}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-600/50 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {hasAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Score Card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg shadow-yellow-500/30">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-3xl font-bold mb-1 ${scoreColor}`}>{scoreMsg}</h2>
          <p className="text-gray-400 mb-6 text-lg">
            {activeSkill} · <span className="capitalize">{difficulty}</span>
          </p>

          {/* Score circle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="8" />
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
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{scorePercent}%</span>
                <span className="text-xs text-gray-400">{score}/{questions.length} correct</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition shadow-lg shadow-blue-500/20"
          >
            <RotateCcw className="w-4 h-4" /> Try Another Interview
          </button>
        </div>

        {/* Answer Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Review Answers</h3>
          {questions.map((q, qIdx) => {
            const ans = userAnswers.find((a) => a.questionId === q.id);
            const answered = ans?.selectedIndex !== null && ans?.selectedIndex !== undefined;
            const correct = answered && ans!.selectedIndex === q.correctIndex;

            return (
              <div
                key={q.id}
                className={`bg-gray-800/50 border rounded-xl p-5 ${
                  correct ? "border-emerald-500/30" : "border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium mb-2">
                      Q{qIdx + 1}. {q.question}
                    </p>
                    {answered && !correct && (
                      <p className="text-red-400 text-sm mb-1">
                        Your answer: {q.options[ans!.selectedIndex!]}
                      </p>
                    )}
                    <p className="text-emerald-400 text-sm mb-2">
                      Correct: {q.options[q.correctIndex]}
                    </p>
                    <p className="text-gray-400 text-sm">{q.explanation}</p>
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
