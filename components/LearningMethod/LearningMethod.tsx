"use client";
import { useUserStore } from "@/store/userStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Pencil,
  Hammer,
  BookOpen,
  Target,
  Compass,
  Sprout,
  BookOpenCheck,
  Zap,
  Rocket,
  Trophy,
  GraduationCap,
  Briefcase,
  Globe,
  TrendingUp,
  Network,
  Brain,
  Component,
  Smartphone,
  Gamepad2,
  Database,
} from "lucide-react";
import { 
  SiNextdotjs, 
  SiReact, 
  SiTypescript, 
  SiJavascript, 
  SiNodedotjs, 
  SiExpress, 
  SiMongodb, 
  SiMysql, 
  SiPython,
  SiCplusplus,
  SiC,
} from "react-icons/si";
import { FaJava } from "react-icons/fa";

// ─── Data ────────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { name: "Next.js",          icon: SiNextdotjs, color: "#FFFFFF", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.25)" },
  { name: "React",            icon: SiReact,     color: "#61DAFB", bg: "rgba(97,218,251,0.08)",  border: "rgba(97,218,251,0.25)" },
  { name: "TypeScript",       icon: SiTypescript,color: "#3178C6", bg: "rgba(49,120,198,0.08)",  border: "rgba(49,120,198,0.25)" },
  { name: "JavaScript",       icon: SiJavascript,color: "#F7DF1E", bg: "rgba(247,223,30,0.08)",  border: "rgba(247,223,30,0.25)" },
  { name: "Node.js",          icon: SiNodedotjs, color: "#339933", bg: "rgba(51,153,51,0.08)",   border: "rgba(51,153,51,0.25)" },
  { name: "Express",          icon: SiExpress,   color: "#FFFFFF", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.25)" },
  { name: "MongoDB",          icon: SiMongodb,   color: "#47A248", bg: "rgba(71,162,72,0.08)",   border: "rgba(71,162,72,0.25)" },
  { name: "MySQL",            icon: SiMysql,     color: "#4479A1", bg: "rgba(68,121,161,0.08)",  border: "rgba(68,121,161,0.25)" },
  { name: "Python",           icon: SiPython,    color: "#3776AB", bg: "rgba(55,118,171,0.08)",  border: "rgba(55,118,171,0.25)" },
  { name: "DSA",              icon: Network,     color: "#FF5722", bg: "rgba(255,87,34,0.08)",   border: "rgba(255,87,34,0.25)" },
  { name: "AI/ML",            icon: Brain,       color: "#00BCD4", bg: "rgba(0,188,212,0.08)",   border: "rgba(0,188,212,0.25)" },
  { name: "WEB DEVELOPMENT",  icon: Globe,       color: "#4CAF50", bg: "rgba(76,175,80,0.08)",   border: "rgba(76,175,80,0.25)" },
  { name: "JAVA",             icon: FaJava,      color: "#E76F00", bg: "rgba(231,111,0,0.08)",   border: "rgba(231,111,0,0.25)" },
  { name: "C++",              icon: SiCplusplus, color: "#00599C", bg: "rgba(0,89,156,0.08)",    border: "rgba(0,89,156,0.25)" },
  { name: "OOPS",             icon: Component,   color: "#9C27B0", bg: "rgba(156,39,176,0.08)",  border: "rgba(156,39,176,0.25)" },
  { name: "MOBILE DEVELOPER", icon: Smartphone,  color: "#3F51B5", bg: "rgba(63,81,181,0.08)",   border: "rgba(63,81,181,0.25)" },
  { name: "GAME DEVELOPMENT", icon: Gamepad2,    color: "#E91E63", bg: "rgba(233,30,99,0.08)",   border: "rgba(233,30,99,0.25)" },
  { name: "DATA SCIENCE",     icon: Database,    color: "#FFC107", bg: "rgba(255,193,7,0.08)",   border: "rgba(255,193,7,0.25)" },
  { name: "C",                icon: SiC,         color: "#A8B9CC", bg: "rgba(168,185,204,0.08)", border: "rgba(168,185,204,0.25)" },
  { name: "Other",            icon: Pencil,      color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.25)" },
];

const LEARNING_METHODS = [
  { name: "Hands-on Projects", icon: Hammer, desc: "Build real projects while learning concepts" },
  { name: "Theoretical Knowledge", icon: BookOpen, desc: "Deep-dive into fundamentals and theory" },
  { name: "Interactive Challenges", icon: Target, desc: "Learn through puzzles, quizzes & challenges" },
  { name: "Self Learning", icon: Compass, desc: "At your own pace with curated resources" },
];

const EXPERIENCE_LEVELS = [
  { name: "None", icon: Sprout, desc: "Absolute beginner, starting from scratch" },
  { name: "Beginner", icon: BookOpenCheck, desc: "Know the basics but need guided practice" },
  { name: "Intermediate", icon: Zap, desc: "Comfortable, ready for harder challenges" },
  { name: "Advanced", icon: Rocket, desc: "Strong understanding, want to specialise" },
  { name: "Expert", icon: Trophy, desc: "Mastery level, looking to fill edge gaps" },
];

const OUTCOMES = [
  { name: "College Exams", icon: GraduationCap, desc: "Ace university / entrance examinations" },
  { name: "Technical Interview", icon: Briefcase, desc: "Crack FAANG / product company interviews" },
  { name: "Contribute to Open-Source", icon: Globe, desc: "Give back and grow your GitHub profile" },
  { name: "Skill Enhancement", icon: TrendingUp, desc: "Upskill for freelance or personal projects" },
];

const STEP_META = [
  { title: "Choose Your Path",          subtitle: "Which language do you want to master?" },
  { title: "Learning Style",            subtitle: "How do you learn best?" },
  { title: "Your Experience Level",     subtitle: "Where are you right now?" },
  { title: "Goal & Outcome",            subtitle: "What do you want to achieve?" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="transition-all duration-500"
            style={{
              width: i === current ? 32 : 10,
              height: 10,
              borderRadius: 99,
              background: i < current
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : i === current
                  ? "linear-gradient(135deg,#6366f1,#06b6d4)"
                  : "rgba(255,255,255,0.1)",
            }}
          />
          {i < total - 1 && (
            <div style={{ width: 20, height: 1, background: i < current ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const LearningMethod = () => {
  const { userData } = useUserStore();
  const totalRoadmaps = userData?.roadmaps?.length ?? 0;
  const [formStatus, setFormStatus] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [learningMethod, setLearningMethod] = useState("");
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (totalRoadmaps >= 3) {
      toast.error("Maximum 3 roadmaps allowed");
      router.push("/roadmaps");
    }
  }, []);

  const handleNextStep = () => {
    setError("");
    if (formStatus === 0) {
      if (!selectedSkill) { setError("Please select a programming language."); return; }
      if (selectedSkill === "Other" && !customSkill.trim()) { setError("Please specify your language."); return; }
    }
    if (formStatus === 1 && !learningMethod) { setError("Please select a learning style."); return; }
    if (formStatus === 2 && !selectedExperience) { setError("Please select your experience level."); return; }
    if (formStatus < 3) setFormStatus(f => f + 1);
  };

  const handlePreviousStep = () => {
    if (formStatus > 0) setFormStatus(f => f - 1);
  };

  const handlePreferences = async () => {
    setError("");
    if (!outcome) { setError("Please select your desired goal."); return; }
    const skillToSend = selectedSkill === "Other" ? customSkill.trim() : selectedSkill;
    setIsLoading(true);
    try {
      await axios.post("/api/roadmap", {
        skill: skillToSend,
        experience: selectedExperience,
        learningPreference: learningMethod,
        expectedOutcome: outcome,
      });
      toast.success("🎉 Roadmap created successfully!");
      router.push("/roadmaps");
    } catch {
      toast.error("Failed to create roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const stepSelections = [selectedSkill, learningMethod, selectedExperience, outcome];
  const isLastStep = formStatus === 3;

  return (
    <>
      <style>{`
        @keyframes lpFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .lp-fade { animation: lpFadeUp 0.4s ease both; }
        .lang-card:hover { transform: translateY(-3px) scale(1.02); }
        .lang-card { transition: all 0.2s ease; }
        .lp-scroll::-webkit-scrollbar { width:4px; }
        .lp-scroll::-webkit-scrollbar-track { background:transparent; }
        .lp-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:4px; }
      `}</style>

      <div
        className="flex items-center justify-center min-h-screen px-4 py-12 relative overflow-hidden"
        style={{ background: "#050508", zIndex: 0 }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden mix-blend-screen z-0">
          <div style={{ position:"absolute", top:"-10%", left:"10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter:"blur(60px)" }} />
          <div style={{ position:"absolute", bottom:"-20%", right:"0%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)", filter:"blur(80px)" }} />
          <div style={{ position:"absolute", top:"40%", left:"55%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", filter:"blur(70px)" }} />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          {/* Header Badge */}
          <div className="flex justify-center mb-6">
            <span
              className="text-[11px] font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
              style={{ background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.28)", color:"#a5b4fc" }}
            >
              ✦ CodeToCareer Learning Path
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-[2.5rem] p-10"
            style={{
              background: "linear-gradient(180deg, rgba(20,20,30,0.5) 0%, rgba(10,10,15,0.6) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(40px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.02)",
            }}
          >
            {/* Step indicator */}
            <StepIndicator current={formStatus} total={4} />

            {/* Step header */}
            <div className="text-center mb-10 lp-fade" key={`header-${formStatus}`}>
              <h1 
                className="text-4xl font-black mb-3 tracking-tight drop-shadow-xl"
                style={{
                  background: "linear-gradient(to right, #ffffff, #a5b4fc, #67e8f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {STEP_META[formStatus].title}
              </h1>
              <p className="text-[15px] font-medium text-indigo-200/60 uppercase tracking-widest">{STEP_META[formStatus].subtitle}</p>
            </div>

            {/* ── STEP 0: Language ── */}
            {formStatus === 0 && (
              <div className="lp-fade" key="step0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 max-h-[360px] overflow-y-auto lp-scroll pr-1">
                  {LANGUAGES.map((lang) => {
                    const isSelected = selectedSkill === lang.name;
                    const IconComp = lang.icon;
                    return (
                      <button
                        key={lang.name}
                        onClick={() => setSelectedSkill(lang.name)}
                        className="lang-card flex flex-col items-center gap-3 p-5 rounded-[1.25rem] text-center relative overflow-hidden group"
                        style={{
                          background: isSelected ? `radial-gradient(circle at top, ${lang.color}30, rgba(255,255,255,0.01) 70%)` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? lang.color : "rgba(255,255,255,0.06)"}`,
                          borderTop: `1px solid ${isSelected ? lang.color : "rgba(255,255,255,0.15)"}`,
                          boxShadow: isSelected ? `0 10px 40px ${lang.color}40, inset 0 0 20px ${lang.color}20` : "inset 0 1px 0 rgba(255,255,255,0.02)",
                        }}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        )}
                        <div className="relative z-10 transition-transform duration-300 group-hover:-translate-y-1" style={{ color: lang.color, opacity: isSelected ? 1 : 0.6, filter: isSelected ? `drop-shadow(0 0 15px ${lang.color})` : "none" }}>
                          <IconComp size={40} />
                        </div>
                        <span
                          className="text-[14px] font-bold tracking-wide relative z-10"
                          style={{ color: isSelected ? "#FFFFFF" : "#8b949e", textShadow: isSelected ? `0 0 10px ${lang.color}80` : "none" }}
                        >
                          {lang.name}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full absolute top-4 right-4 z-10 shadow-lg" style={{ background: lang.color, boxShadow: `0 0 10px ${lang.color}, 0 0 20px ${lang.color}` }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedSkill === "Other" && (
                  <div className="mt-3 lp-fade">
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.25)" }}
                    >
                      <Pencil className="w-4 h-4 text-indigo-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Elixir, Scala, Dart, R…"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        className="flex-1 bg-transparent text-white text-[14px] placeholder-indigo-700 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 1: Learning Style ── */}
            {formStatus === 1 && (
              <div className="flex flex-col gap-3 lp-fade" key="step1">
                {LEARNING_METHODS.map((m) => {
                  const isSelected = learningMethod === m.name;
                  const IconComp = m.icon;
                  return (
                    <button
                      key={m.name}
                      onClick={() => setLearningMethod(m.name)}
                      className="flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group"
                      style={{
                        background: isSelected ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.08)"}`,
                        borderTop: `1px solid ${isSelected ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.15)"}`,
                        boxShadow: isSelected ? "0 10px 40px rgba(99,102,241,0.3), inset 0 0 20px rgba(99,102,241,0.2)" : "none",
                        transform: isSelected ? "scale(1.02) translateY(-2px)" : "scale(1)",
                      }}
                    >
                      {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />}
                      <div className={`relative z-10 p-3 rounded-xl shrink-0 transition-colors duration-300 ${isSelected ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'}`}>
                        <IconComp strokeWidth={isSelected ? 2 : 1.5} size={26} />
                      </div>
                      <div className="flex-1 relative z-10">
                        <p className={`text-[15px] font-bold tracking-wide transition-colors duration-300 ${isSelected ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-gray-300 group-hover:text-white"}`}>{m.name}</p>
                        <p className={`text-[13px] mt-1 transition-colors duration-300 ${isSelected ? "text-indigo-200" : "text-gray-500"}`}>{m.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                          style={{ background:"#6366f1" }}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── STEP 2: Experience Level ── */}
            {formStatus === 2 && (
              <div className="flex flex-col gap-3 lp-fade" key="step2">
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const isSelected = selectedExperience === lvl.name;
                  const IconComp = lvl.icon;
                  return (
                    <button
                      key={lvl.name}
                      onClick={() => setSelectedExperience(lvl.name)}
                      className="flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group"
                      style={{
                        background: isSelected ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? "rgba(6,182,212,0.8)" : "rgba(255,255,255,0.08)"}`,
                        borderTop: `1px solid ${isSelected ? "rgba(6,182,212,0.8)" : "rgba(255,255,255,0.15)"}`,
                        boxShadow: isSelected ? "0 10px 40px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.2)" : "none",
                        transform: isSelected ? "scale(1.02) translateY(-2px)" : "scale(1)",
                      }}
                    >
                      {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />}
                      <div className={`relative z-10 p-3 rounded-xl shrink-0 transition-colors duration-300 ${isSelected ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'}`}>
                        <IconComp strokeWidth={isSelected ? 2 : 1.5} size={26} />
                      </div>
                      <div className="flex-1 relative z-10">
                        <p className={`text-[15px] font-bold tracking-wide transition-colors duration-300 ${isSelected ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-gray-300 group-hover:text-white"}`}>{lvl.name}</p>
                        <p className={`text-[13px] mt-1 transition-colors duration-300 ${isSelected ? "text-cyan-200" : "text-gray-500"}`}>{lvl.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                          style={{ background:"#06b6d4" }}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── STEP 3: Outcome / Goal ── */}
            {formStatus === 3 && (
              <div className="flex flex-col gap-3 lp-fade" key="step3">
                {OUTCOMES.map((o) => {
                  const isSelected = outcome === o.name;
                  const IconComp = o.icon;
                  return (
                    <button
                      key={o.name}
                      onClick={() => setOutcome(o.name)}
                      className="flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group"
                      style={{
                        background: isSelected ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? "rgba(236,72,153,0.8)" : "rgba(255,255,255,0.08)"}`,
                        borderTop: `1px solid ${isSelected ? "rgba(236,72,153,0.8)" : "rgba(255,255,255,0.15)"}`,
                        boxShadow: isSelected ? "0 10px 40px rgba(236,72,153,0.3), inset 0 0 20px rgba(236,72,153,0.2)" : "none",
                        transform: isSelected ? "scale(1.02) translateY(-2px)" : "scale(1)",
                      }}
                    >
                      {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent pointer-events-none" />}
                      <div className={`relative z-10 p-3 rounded-xl shrink-0 transition-colors duration-300 ${isSelected ? 'bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.6)]' : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'}`}>
                        <IconComp strokeWidth={isSelected ? 2 : 1.5} size={26} />
                      </div>
                      <div className="flex-1 relative z-10">
                        <p className={`text-[15px] font-bold tracking-wide transition-colors duration-300 ${isSelected ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-gray-300 group-hover:text-white"}`}>{o.name}</p>
                        <p className={`text-[13px] mt-1 transition-colors duration-300 ${isSelected ? "text-pink-200" : "text-gray-500"}`}>{o.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.8)]"
                          style={{ background:"#ec4899" }}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl lp-fade"
                style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
                <span className="text-red-400 text-xs">⚠️</span>
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            {/* Summary on Last Step */}
            {isLastStep && stepSelections.every(Boolean) && (
              <div className="mt-5 p-4 rounded-2xl lp-fade"
                style={{ background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.15)" }}>
                <p className="text-[11px] font-semibold text-indigo-400 tracking-wider uppercase mb-2">Your Selection</p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  {[
                    { label: "Language", value: selectedSkill === "Other" ? customSkill : selectedSkill },
                    { label: "Style", value: learningMethod },
                    { label: "Level", value: selectedExperience },
                    { label: "Goal", value: outcome },
                  ].map((item) => (
                    <div key={item.label}>
                      <span className="text-gray-600">{item.label}: </span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 gap-3">
              {formStatus > 0 ? (
                <button
                  onClick={handlePreviousStep}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium text-gray-400 hover:text-white transition-all duration-200"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round"/></svg>
                  Back
                </button>
              ) : <div />}

              {isLastStep ? (
                <button
                  onClick={handlePreferences}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-10 py-4 rounded-2xl text-[16px] font-black tracking-wide text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                    boxShadow: "0 10px 40px rgba(236,72,153,0.5), inset 0 2px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Roadmap…
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 fill-white/20" />
                      Generate My Roadmap
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  disabled={!stepSelections[formStatus] && !(formStatus === 0 && selectedSkill === "Other" && customSkill)}
                  className="flex items-center gap-3 px-10 py-3.5 rounded-2xl text-[15px] font-bold tracking-wide text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:scale-100 relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: stepSelections[formStatus] ? "0 10px 30px rgba(99,102,241,0.2)" : "none",
                  }}
                >
                  {stepSelections[formStatus] && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
                  )}
                  <span className="relative z-10">Continue</span>
                  <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-700 mt-5">
            Powered by Gemini AI · Max 3 roadmaps allowed
          </p>
        </div>
      </div>
    </>
  );
};

export default LearningMethod;