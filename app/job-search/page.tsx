'use client';

import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  MapPin,
  Briefcase,
  Loader2,
  Sparkles,
  Bot,
  CheckCircle2,
  TrendingUp,
  Target,
  AlertTriangle,
  Award,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  Zap,
  Filter,
  Cpu,
  ArrowUpRight,
  Check,
  X,
  Layers,
  Terminal,
  Activity,
  Compass,
} from "lucide-react";
import { JobAgentResponse, RankedJobMatch } from "@/types/jobAgentTypes";

export default function JobSearchPage() {
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Remote");
  const [experienceLevel, setExperienceLevel] = useState("entry level");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState<JobAgentResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"agent" | "market" | "gaps">("agent");
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [searchLimit, setSearchLimit] = useState<{ count: number; remaining: number; max: number; limitReached: boolean }>({
    count: 0,
    remaining: 3,
    max: 3,
    limitReached: false,
  });

  // Fetch search limit, saved jobs, and restore search session on mount
  React.useEffect(() => {
    // Restore cached search session from localStorage
    try {
      const savedSession = localStorage.getItem("nexus_job_agent_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.agentResponse) setAgentResponse(parsed.agentResponse);
        if (parsed.query) setQuery(parsed.query);
        if (parsed.keyword) setKeyword(parsed.keyword);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
      }
    } catch (err) {
      console.error("Error restoring cached search session:", err);
    }

    fetch("/api/jobs/agent")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setSearchLimit({
            count: data.jobSearchCount || 0,
            remaining: typeof data.remainingSearches === "number" ? data.remainingSearches : 3,
            max: data.maxSearches || 3,
            limitReached: !!data.limitReached,
          });
        }
      })
      .catch((err) => console.error("Error fetching job agent limit:", err));

    fetch("/api/jobs/save")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.savedJobs)) {
          setSavedJobIds(data.savedJobs.map((j: any) => j.jobId));
        }
      })
      .catch((err) => console.error("Error fetching saved jobs:", err));
  }, []);

  // Enhanced high-impact prompt suggestions for Job Search Intelligence
  const SUGGESTED_PROMPTS = [
    {
      icon: "🎯",
      label: "Data Science & Gaps",
      prompt: "Find entry-level Data Science roles & analyze my skill gaps",
    },
    {
      icon: "⚛️",
      label: "Full-Stack React Skills",
      prompt: "What skills am I missing for full-stack React & Next.js jobs?",
    },
    {
      icon: "🐍",
      label: "Remote Python Jobs",
      prompt: "Show me remote Python & AI developer opportunities",
    },
    {
      icon: "⚡",
      label: "Rank Roles For Profile",
      prompt: "Rank suitable tech roles for my current skill profile",
    },
    {
      icon: "☁️",
      label: "DevOps & Cloud Roles",
      prompt: "Find entry-level Cloud & DevOps engineering roles and skill gaps",
    },
  ];

  const handleRunAgent = async (customMessage?: string) => {
    if (searchLimit.limitReached || searchLimit.remaining <= 0) {
      toast.error("You have reached your 3 free Job Intelligence agent searches.");
      return;
    }

    const messageToSend = customMessage || query || (keyword ? `Find ${keyword} jobs in ${location}` : "Find suitable tech jobs for my profile");

    try {
      setIsLoading(true);

      const res = await fetch("/api/jobs/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.error("Please sign in to run the Job Intelligence Agent.");
          return;
        }
        if (res.status === 403 && errorData.limitReached) {
          setSearchLimit((prev) => ({ ...prev, remaining: 0, limitReached: true }));
          toast.error(errorData.error || "Search limit reached (3 / 3 searches used).");
          return;
        }
        throw new Error(errorData.error || "Failed to execute Job Intelligence Agent");
      }

      const data = await res.json();
      setAgentResponse(data);

      // Save search session to localStorage so navigating away to dashboard retains results
      try {
        localStorage.setItem(
          "nexus_job_agent_session",
          JSON.stringify({
            agentResponse: data,
            query: messageToSend,
            keyword,
            location,
            experienceLevel,
            activeTab: "agent",
          })
        );
      } catch (err) {
        console.error("Error caching search session:", err);
      }

      if (typeof data.remainingSearches === "number") {
        setSearchLimit({
          count: data.jobSearchCount,
          remaining: data.remainingSearches,
          max: data.maxSearches || 3,
          limitReached: !!data.limitReached,
        });
      }
      toast.success("Job Intelligence Agent analysis completed!");
    } catch (err: any) {
      console.error("Agent execution error:", err);
      toast.error(err?.message || "Failed to run Job Intelligence Agent. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTraditionalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) {
      toast.error("Please enter a job title or keyword.");
      return;
    }
    await handleRunAgent(`Search ${keyword} jobs in ${location} for ${experienceLevel} level.`);
  };

  const toggleSaveJob = async (job: RankedJobMatch) => {
    const isSaved = savedJobIds.includes(job.jobId);
    const newSavedIds = isSaved
      ? savedJobIds.filter((id) => id !== job.jobId)
      : [...savedJobIds, job.jobId];

    setSavedJobIds(newSavedIds);
    toast.success(isSaved ? "Removed from saved jobs" : "Saved to your career dashboard!");

    try {
      await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.jobId,
          title: job.title,
          company: job.company,
          location: job.location,
          jobUrl: job.jobUrl,
          salary: job.salary,
          postedAgo: job.postedAgo,
        }),
      });
    } catch (err) {
      console.error("Error toggling save job in database:", err);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* ── Background Cyber Ambient Glows ────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[160px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 pt-10 md:pt-14">

        {/* ── HERO SECTION & AGENT TITLE ────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Autonomous Job Intelligence
            <span className="ml-2 text-indigo-400">Engine</span>
          </h1>

          <p className="mt-3 text-sm text-zinc-400 md:text-base">
            AI-powered job analysis, skill extraction, and intelligent candidate matching.
          </p>
        </div>

        {/* ── GLASSMORPHIC COMMAND BOX ─────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto mb-8 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-[2.2rem] blur opacity-30 transition duration-500 group-hover:opacity-100" />
          <div className="relative rounded-[2rem] bg-slate-900/80 border border-white/10 backdrop-blur-2xl p-4 md:p-6 shadow-2xl shadow-black/80">

            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-400" /> AI Career Command Console
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${searchLimit.limitReached
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  }`}>
                  Searches Remaining: {searchLimit.remaining} / {searchLimit.max}
                </span>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg border border-white/10"
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  {showAdvancedFilters ? "Hide Filters" : "Filter Options"}
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Terminal className="w-5 h-5 text-indigo-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunAgent()}
                placeholder="Ask eg : Find entry-level Data Science jobs and identify my skill gaps"
                className="w-full pl-12 pr-36 py-4 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm md:text-base font-medium shadow-inner"
              />
              <button
                onClick={() => handleRunAgent()}
                disabled={isLoading || searchLimit.limitReached || searchLimit.remaining <= 0}
                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 md:px-6 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-xs md:text-sm active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reasoning...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Run Agent</span>
                  </>
                )}
              </button>
            </div>

            {/* Expandable Advanced Filters */}
            {showAdvancedFilters && (
              <form onSubmit={handleTraditionalSearch} className="pt-3 pb-2 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 animate-in fade-in duration-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Role (e.g. React, Python)"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. Remote, India)"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="entry level">Entry Level</option>
                    <option value="mid level">Mid Level</option>
                    <option value="senior level">Senior Level</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold text-xs transition-all shrink-0"
                  >
                    Search
                  </button>
                </div>
              </form>
            )}

            {/* Prompt Suggestion Chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mr-1">Quick Prompts:</span>
              {SUGGESTED_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(item.prompt);
                    handleRunAgent(item.prompt);
                  }}
                  title={item.prompt}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                >
                  <span className="text-xs group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium">{item.prompt}</span>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── AGENT REASONING LOADER (BEAST GLASS VISUALIZER) ───────────────────── */}
        {isLoading && (
          <div className="max-w-3xl mx-auto my-12 p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 animate-pulse" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>

              <h3 className="text-xl font-black text-white mb-1 tracking-tight">Job Intelligence Agent Active</h3>
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">Autonomous Reasoning & Tool Execution Loop</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-left max-w-2xl mx-auto text-xs font-medium">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-indigo-200 flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
                  <span>1. Learner Context</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-indigo-200 flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce" />
                  <span>2. LinkedIn Market</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-indigo-200 flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 animate-bounce" />
                  <span>3. Skill Matching</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-indigo-200 flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 animate-bounce" />
                  <span>4. Rank & Gap Analysis</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AGENT RESULTS DASHBOARD (BEAST GLASSMOPHISM) ──────────────────────── */}
        {agentResponse && !isLoading && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">

            {/* Executive Summary Glass Card */}
            <div className="relative rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl p-6 md:p-8 shadow-2xl shadow-black/80 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/10">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Agent Analysis Insights</h2>
                    <p className="text-xs font-semibold text-indigo-300">
                      {agentResponse.agentMetadata.iterations} Iterations Completed • {agentResponse.agentMetadata.sampleSize} Live Jobs Scraped & Evaluated
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4" /> Deterministic Match
                  </span>
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold shadow-sm">
                    Goal: {agentResponse.learnerProfileSummary?.targetRole}
                  </span>
                </div>
              </div>

              {/* Summary Text */}
              <p className="text-slate-200 text-sm md:text-base leading-relaxed font-medium mb-5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                {agentResponse.summary}
              </p>

              {/* Tool Execution Audit Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Executed Tools:</span>
                {agentResponse.agentMetadata.toolsUsed.map((tool, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-slate-950/80 border border-white/10 text-slate-300 font-mono text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl max-w-xl mx-auto shadow-xl">
              <button
                onClick={() => setActiveTab("agent")}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "agent"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Job Matches ({agentResponse.jobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("market")}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "market"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Demand Signals</span>
              </button>

              <button
                onClick={() => setActiveTab("gaps")}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "gaps"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Target className="w-4 h-4" />
                <span>Skill Gaps ({agentResponse.skillGaps.length})</span>
              </button>
            </div>

            {/* ── TAB 1: RANKED JOB MATCHES (BEAST CARDS) ────────────────────────── */}
            {activeTab === "agent" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agentResponse.jobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.jobId);
                  return (
                    <div
                      key={job.jobId}
                      className="group relative rounded-3xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/50 backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Gradient Accent Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                      <div>
                        {/* Header & Match Score */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors tracking-tight">
                              {job.title}
                            </h3>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">{job.company} • {job.location}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleSaveJob(job)}
                              className={`p-2 rounded-xl border transition-all ${isSaved
                                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                                }`}
                              title={isSaved ? "Saved to Dashboard" : "Save Job Opportunity"}
                            >
                              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* AI Match Insight */}
                        <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/25 mb-4 text-xs font-medium text-indigo-200 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{job.whyItMatches}</span>
                        </div>

                        {/* Matched & Missing Skills Badges */}
                        <div className="space-y-3 mb-5 text-xs">
                          <div>
                            <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                              ✓ Matched Skills ({job.matchedSkills.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {job.matchedSkills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                                  {s}
                                </span>
                              ))}
                              {job.matchedSkills.length === 0 && <span className="text-slate-500 italic">None identified</span>}
                            </div>
                          </div>

                          <div>
                            <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                              ⚠ Skill Gaps ({job.missingSkills.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {job.missingSkills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                                  {s}
                                </span>
                              ))}
                              {job.missingSkills.length === 0 && <span className="text-emerald-400 font-semibold">All required skills covered!</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">{job.postedAgo || "Recently"} • {job.salary}</span>
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                        >
                          <span>Apply</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TAB 2: MARKET DEMAND SIGNALS ───────────────────────────────────── */}
            {activeTab === "market" && agentResponse.marketSignals && (
              <div className="rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">Live Job Market Skill Signals</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{agentResponse.marketSignals.sampleNote}</p>
                  </div>
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
                    {agentResponse.marketSignals.totalJobsAnalyzed} Jobs Sampled
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agentResponse.marketSignals.topSkills.map((signal, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">{signal.skill}</h4>
                            <p className="text-xs text-slate-400">In {signal.frequency} of {agentResponse.marketSignals?.totalJobsAnalyzed} listings</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-indigo-400">{signal.percentage}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${signal.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 3: SKILL GAP ANALYSIS ──────────────────────────────────────── */}
            {activeTab === "gaps" && (
              <div className="rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-xl font-black text-white">Skill Gap & Learning Priorities</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Prioritized technical gap breakdown comparing your profile against live job requirements.</p>
                </div>

                <div className="space-y-3">
                  {agentResponse.skillGaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className={`p-4 md:p-5 rounded-2xl border flex items-start justify-between gap-4 backdrop-blur-xl transition-all ${gap.severity === "CRITICAL"
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-200 shadow-rose-500/5"
                        : gap.severity === "PARTIAL"
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-200 shadow-amber-500/5"
                          : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200 shadow-emerald-500/5"
                        }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                          {gap.severity === "CRITICAL" ? (
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                          ) : gap.severity === "PARTIAL" ? (
                            <Target className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Award className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-white">{gap.skill}</h4>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10">
                              {gap.severity}
                            </span>
                          </div>
                          <p className="text-xs mt-1 text-slate-300 leading-relaxed font-medium">{gap.reason}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 shrink-0 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        Priority #{gap.suggestedPriority}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Suggested Next Action Box */}
                <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Recommended Career Next Steps
                  </h4>
                  <ul className="space-y-2 text-xs md:text-sm text-indigo-200 font-medium">
                    {agentResponse.suggestedNextActions.map((act, i) => (
                      <li key={i} className="flex items-center gap-2.5 bg-indigo-900/20 p-2.5 rounded-xl border border-indigo-500/20">
                        <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}