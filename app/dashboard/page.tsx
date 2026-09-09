'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  User, BookOpen, Brain, Trophy, Zap, MessageSquare,
  HelpCircle, MessageCircle, Github, Linkedin, ArrowRight,
  BarChart3, Code2, Mic, ClipboardList, Sparkles, Target,
  TrendingUp, Clock, CheckCircle2, Circle, ChevronRight,
  MapPin, ExternalLink, Plus, Loader2
} from 'lucide-react';

// Lazy-load the canvas component so it doesn't block SSR
const CursorGrid = dynamic(() => import('@/components/ui/CursorGrid'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardData {
  user: {
    name: string; email: string; image?: string; bio?: string;
    githubUrl?: string; linkedinUrl?: string; userName?: string;
    createdAt: string; roadmapCount: number; chatCount: number;
    questionsAsked: number; answersGiven: number;
  };
  activeRoadmap: { title: string; totalSteps: number; progress: number } | null;
  telemetry: { aptitude: number | null; speech: number | null; coding: number | null; quiz: number | null };
  hackathon: { id: string; title: string; status: string; progress: number; totalTasks: number; completedTasks: number } | null;
  recentPosts: { id: string; title: string; description: string; tags: string[]; authorName: string; authorImage?: string; status: string; createdAt: string }[];
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-xl font-black text-white">{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function TelemetryBar({ label, value, color, icon: Icon }: { label: string; value: number | null; color: string; icon: any }) {
  const pct = value ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-xs text-slate-400">{label}</span>
        </div>
        <span className="text-xs font-bold text-white">
          {value === null ? '—' : `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
          className={`h-full rounded-full ${value === null ? 'bg-white/10' : `bg-gradient-to-r ${color.includes('purple') ? 'from-purple-500 to-purple-400' : color.includes('pink') ? 'from-pink-500 to-pink-400' : color.includes('cyan') ? 'from-cyan-500 to-cyan-400' : 'from-amber-500 to-amber-400'}`}`}
        />
      </div>
    </div>
  );
}

const HACKATHON_STATUS_COLORS: Record<string, string> = {
  IDEATION: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PLANNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  BUILDING: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SUBMITTED: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const AGENT_LINKS = [
  { label: 'Zeno AI', icon: Sparkles, href: '/AiMentor', color: 'from-violet-600 to-indigo-600', glow: 'shadow-violet-500/20' },
  { label: 'Speech', icon: Mic, href: '/self-assessment/speech-practice', color: 'from-pink-600 to-rose-600', glow: 'shadow-pink-500/20' },
  { label: 'Interview', icon: MessageSquare, href: '/interview', color: 'from-cyan-600 to-blue-600', glow: 'shadow-cyan-500/20' },
  { label: 'Code Lab', icon: Code2, href: '/code-reviewer', color: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-500/20' },
  { label: 'Job Finder', icon: Target, href: '/job-search', color: 'from-amber-600 to-orange-600', glow: 'shadow-amber-500/20' },
];

// ─── Glass Card wrapper ───────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3, boxShadow: '0 0 40px rgba(99,102,241,0.12)' }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const memberSince = data?.user.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="relative min-h-screen bg-[#060810] text-white overflow-hidden">

      {/* ── Interactive CursorGrid background ── */}
      <div className="absolute inset-0 z-0">
        <CursorGrid
          cellSize={60}
          color="#6366f1"
          radius={160}
          falloff="smooth"
          holdTime={300}
          fadeDuration={700}
          lineWidth={1}
          maxOpacity={0.7}
          fillOpacity={0.03}
          gridOpacity={0.04}
          cellRadius={4}
          clickPulse
          pulseSpeed={500}
        />
      </div>

      {/* ── Ambient glow orbs ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[80px]" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <AnimatePresence>
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <Skeleton className="h-40 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </motion.div>
          ) : data ? (
            <motion.div
              key="dashboard"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >

              {/* ══════════════════════════════════════════
                  ZONE 1 + 2 — Hero Identity & Stats
                ══════════════════════════════════════════ */}
              <GlassCard className="relative overflow-hidden">
                {/* Glowing top border accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl scale-125" />
                    {data.user.image ? (
                      <img
                        src={data.user.image}
                        alt={data.user.name}
                        className="relative w-20 h-20 rounded-full object-cover ring-2 ring-indigo-500/40"
                      />
                    ) : (
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center ring-2 ring-indigo-500/40">
                        <User className="w-9 h-9 text-white/80" />
                      </div>
                    )}
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#060810]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 mb-0.5">{greeting()},</p>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate">
                      {data.user.name} 👋
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {data.user.userName && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> @{data.user.userName}
                        </span>
                      )}
                      {memberSince && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Member since {memberSince}
                        </span>
                      )}
                      {data.user.githubUrl && (
                        <a href={data.user.githubUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                          <Github className="w-3 h-3" /> GitHub
                        </a>
                      )}
                      {data.user.linkedinUrl && (
                        <a href={data.user.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors">
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </a>
                      )}
                    </div>
                    {data.user.bio && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-1">{data.user.bio}</p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-6 shrink-0 border-l border-white/5 pl-6">
                    <StatPill icon={BookOpen} label="Roadmaps" value={data.user.roadmapCount} color="bg-indigo-600" />
                    <StatPill icon={MessageSquare} label="Chats" value={data.user.chatCount} color="bg-violet-600" />
                    <StatPill icon={HelpCircle} label="Questions" value={data.user.questionsAsked} color="bg-cyan-600" />
                    <StatPill icon={MessageCircle} label="Answers" value={data.user.answersGiven} color="bg-emerald-600" />
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href="/profile"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Profile
                    </Link>
                    <Link href="/roadmaps"
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                      <BookOpen className="w-3.5 h-3.5" /> Roadmaps
                    </Link>
                  </div>
                </div>
              </GlassCard>

              {/* ══════════════════════════════════════════
                  ROW 2: Learning + Telemetry + Hackathon
                ══════════════════════════════════════════ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* ZONE 3 — Active Learning Path */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Roadmap</span>
                    </div>
                    <Link href="/roadmaps" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {data.activeRoadmap ? (
                    <div className="space-y-4">
                      <p className="font-bold text-white text-lg leading-snug line-clamp-2">
                        {data.activeRoadmap.title}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-bold text-indigo-400">{data.activeRoadmap.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.activeRoadmap.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          />
                        </div>
                        <p className="text-xs text-slate-600">{data.activeRoadmap.totalSteps} steps total</p>
                      </div>
                      <Link href="/roadmaps"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-sm font-semibold text-indigo-400 hover:bg-indigo-600/25 transition-all">
                        Continue Learning <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-sm text-slate-500">No roadmap yet. Start your journey!</p>
                      <Link href="/learning-path"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-semibold hover:bg-indigo-500 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Generate Roadmap
                      </Link>
                    </div>
                  )}
                </GlassCard>

                {/* ZONE 4 — Telemetry Matrix */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Skill Telemetry</span>
                    </div>
                    <Link href="/self-assessment/performance" className="text-purple-400 hover:text-purple-300 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <TelemetryBar label="Aptitude" value={data.telemetry.aptitude} color="text-purple-400" icon={Brain} />
                    <TelemetryBar label="Speech" value={data.telemetry.speech} color="text-pink-400" icon={Mic} />
                    <TelemetryBar label="Coding" value={data.telemetry.coding} color="text-cyan-400" icon={Code2} />
                    <TelemetryBar label="Quiz" value={data.telemetry.quiz} color="text-amber-400" icon={ClipboardList} />
                  </div>
                  <Link href="/self-assessment/performance"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-xs font-semibold text-purple-400 hover:bg-purple-600/20 transition-all mt-4">
                    Full Performance Report <ArrowRight className="w-3 h-3" />
                  </Link>
                </GlassCard>

                {/* ZONE 5 — Active Hackathon */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Hackathon Lab</span>
                    </div>
                    <Link href="/hackathons" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {data.hackathon ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-white text-base leading-snug line-clamp-2">
                          {data.hackathon.title}
                        </p>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${HACKATHON_STATUS_COLORS[data.hackathon.status] || 'bg-white/10 text-white border-white/10'}`}>
                          {data.hackathon.status}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Project Progress</span>
                          <span className="font-bold text-yellow-400">{data.hackathon.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.hackathon.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {data.hackathon.completedTasks}/{data.hackathon.totalTasks} tasks
                        </div>
                      </div>
                      <Link href={`/hackathons/project/${data.hackathon.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-yellow-600/15 border border-yellow-500/20 text-sm font-semibold text-yellow-400 hover:bg-yellow-600/25 transition-all">
                        Open Lab <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-sm text-slate-500">No active project. Start hacking!</p>
                      <Link href="/hackathons"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-600/90 text-black font-bold text-sm hover:bg-yellow-500 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Start Project
                      </Link>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* ══════════════════════════════════════════
                  ROW 3: Agent Rail + Community Pulse
                ══════════════════════════════════════════ */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

                {/* ZONE 6 — Agent Quick-Launch Rail */}
                <GlassCard className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Launch</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {AGENT_LINKS.map(({ label, icon: Icon, href, color, glow }) => (
                      <Link key={label} href={href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${color} shadow-lg ${glow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}>
                        <Icon className="w-4 h-4 text-white" />
                        <span className="text-sm font-bold text-white">{label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/60 ml-auto" />
                      </Link>
                    ))}
                  </div>
                </GlassCard>

                {/* ZONE 7 — Community Pulse */}
                <GlassCard className="md:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Community Pulse</span>
                    </div>
                    <Link href="/learners-community" className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs flex items-center gap-1 font-semibold">
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {data.recentPosts.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentPosts.map((post) => (
                        <Link key={post.id} href={`/learners-community`}
                          className="block p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all group">
                          <div className="flex items-start gap-3">
                            {post.authorImage ? (
                              <img src={post.authorImage} alt={post.authorName}
                                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <User className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                                {post.title}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{post.description}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-slate-600">{post.authorName}</span>
                                {post.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{tag}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <MessageCircle className="w-8 h-8 text-slate-700" />
                      <p className="text-sm text-slate-500">No community posts yet.</p>
                      <Link href="/learners-community"
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-semibold">
                        Be the first to post <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  <Link href="/learners-community"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-sm font-semibold text-cyan-400 hover:bg-cyan-600/20 transition-all mt-3">
                    Join Discussion <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </GlassCard>
              </div>

            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              </div>
              <p className="text-slate-400">Loading your command center...</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}