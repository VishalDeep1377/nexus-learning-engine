'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Code2, Mic, ClipboardCheck, Target, Loader2, ArrowRight, TrendingUp, AlertCircle, BarChart3, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PerformanceData {
  coding: { problemsSolved: number; averageScore: number; weakTopics: string[] };
  speech: { sessions: number; averageScore: number; weakAreas: string[] };
  quizzes: { questionsSolved: number; accuracy: number; weakTopics: string[] };
  aptitude: { questionsSolved: number; accuracy: number; weakCategories: string[] };
  recentActivity: { type: string; label: string; score: string; createdAt: string }[];
  skillGap: {
    overall: string;
    coding: string;
    communication: string;
    technicalKnowledge: string;
    aptitude: string;
    topRecommendations: string[];
    adaptiveDifficulty: { coding: string; quizzes: string; aptitude: string };
  };
}

const SKILL_COLORS: Record<string, string> = {
  Strong: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  Moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  'Needs Improvement': 'text-red-400 bg-red-500/10 border-red-500/25',
};
const OVERALL_COLORS: Record<string, string> = {
  Advanced: 'from-indigo-400 to-purple-400',
  Intermediate: 'from-amber-400 to-orange-400',
  Beginner: 'from-red-400 to-pink-400',
};

const TOOL_META = [
  { key: 'coding', label: 'Coding Lab', icon: Code2, gradient: 'from-purple-600 to-violet-600', glow: 'shadow-purple-500/20', border: 'border-purple-500/20', href: '/self-assessment/coding-lab' },
  { key: 'speech', label: 'Speech Practice', icon: Mic, gradient: 'from-pink-600 to-rose-600', glow: 'shadow-pink-500/20', border: 'border-pink-500/20', href: '/self-assessment/speech-practice' },
  { key: 'quizzes', label: 'Smart Quizzes', icon: ClipboardCheck, gradient: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-500/20', border: 'border-blue-500/20', href: '/self-assessment/smart-quizzes' },
  { key: 'aptitude', label: 'Aptitude Arena', icon: Target, gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20', border: 'border-amber-500/20', href: '/self-assessment/aptitude' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 className="w-3.5 h-3.5 text-purple-400" />,
  speech: <Mic className="w-3.5 h-3.5 text-pink-400" />,
  quiz: <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />,
  aptitude: <Target className="w-3.5 h-3.5 text-amber-400" />,
};

function GaugeBar({ value, max = 100, color = 'from-indigo-500 to-purple-500' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        style={{ boxShadow: '0 0 8px rgba(99,102,241,0.3)' }}
      />
    </div>
  );
}

export default function PerformanceDashboardPage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/self-assessment/performance')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); else setError(d.error || 'Failed to load.'); })
      .catch(() => setError('Network error. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-semibold text-red-400">{error}</p>
          <p className="text-sm text-slate-500 mt-2">Make sure you are logged in.</p>
        </div>
      </div>
    );
  }

  const hasData = data && (data.coding.problemsSolved > 0 || data.speech.sessions > 0 || data.quizzes.questionsSolved > 0 || data.aptitude.questionsSolved > 0);

  const getStatValue = (key: string): string => {
    if (!data) return '—';
    if (key === 'coding') return `${data.coding.averageScore}%`;
    if (key === 'speech') return `${data.speech.averageScore}/10`;
    if (key === 'quizzes') return `${data.quizzes.accuracy}%`;
    if (key === 'aptitude') return `${data.aptitude.accuracy}%`;
    return '—';
  };

  const getStatSub = (key: string): string => {
    if (!data) return '';
    if (key === 'coding') return `${data.coding.problemsSolved} problems`;
    if (key === 'speech') return `${data.speech.sessions} sessions`;
    if (key === 'quizzes') return `${data.quizzes.questionsSolved} questions`;
    if (key === 'aptitude') return `${data.aptitude.questionsSolved} questions`;
    return '';
  };

  const getStatNum = (key: string): number => {
    if (!data) return 0;
    if (key === 'coding') return data.coding.averageScore;
    if (key === 'speech') return data.speech.averageScore * 10;
    if (key === 'quizzes') return data.quizzes.accuracy;
    if (key === 'aptitude') return data.aptitude.accuracy;
    return 0;
  };

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-96 h-96 rounded-full bg-indigo-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Performance Dashboard</h1>
            <p className="text-sm text-slate-500">Your real assessment data across all four tools</p>
          </div>
          <Link href="/self-assessment" className="ml-auto flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
            ← All Tools
          </Link>
        </div>

        {!hasData ? (
          /* Empty state */
          <div className="rounded-3xl border border-white/8 bg-white/3 p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Assessment Data Yet</h2>
            <p className="text-slate-500 text-sm mb-7 max-w-sm mx-auto">Complete at least one assessment to see your AI-driven performance analytics here.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {TOOL_META.map(t => (
                <Link key={t.key} href={t.href}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r ${t.gradient} shadow-lg ${t.glow} hover:-translate-y-0.5 transition-all`}>
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {TOOL_META.map((tool, i) => {
                const Icon = tool.icon;
                const num = getStatNum(tool.key);
                return (
                  <motion.div key={tool.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className={`group relative rounded-2xl border ${tool.border} bg-white/3 hover:bg-white/5 p-5 overflow-hidden transition-all hover:-translate-y-0.5 shadow-lg ${tool.glow}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${tool.gradient} shadow-md`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-2xl font-black text-white mb-0.5">{getStatValue(tool.key)}</p>
                    <p className="text-xs text-slate-500 mb-3">{getStatSub(tool.key)}</p>
                    <GaugeBar value={num} color={tool.gradient} />
                  </motion.div>
                );
              })}
            </div>

            {/* Skill Gap Analysis */}
            {data!.skillGap && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-base font-bold">Skill Gap Analysis</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border bg-gradient-to-r ${OVERALL_COLORS[data!.skillGap.overall] ?? 'from-slate-400 to-slate-500'} bg-clip-text text-transparent border-white/10`}>
                    {data!.skillGap.overall}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Coding', val: data!.skillGap.coding },
                    { label: 'Communication', val: data!.skillGap.communication },
                    { label: 'Technical', val: data!.skillGap.technicalKnowledge },
                    { label: 'Aptitude', val: data!.skillGap.aptitude },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-center bg-black/20 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-slate-600 mb-2 uppercase tracking-widest">{label}</p>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${SKILL_COLORS[val] ?? 'text-slate-400'}`}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                {data!.skillGap.topRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">AI Recommendations</p>
                    {data!.skillGap.topRecommendations.map((r, i) => (
                      <p key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" /> {r}
                      </p>
                    ))}
                  </div>
                )}

                {data!.skillGap.adaptiveDifficulty && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 w-full">Adaptive Difficulty</p>
                    {Object.entries(data!.skillGap.adaptiveDifficulty).map(([tool, diff]) => (
                      <span key={tool} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/8 border border-indigo-500/15 text-slate-400 font-semibold">
                        {tool}: <span className="text-indigo-400">{diff}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Recent Activity */}
            {data!.recentActivity.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-2xl border border-white/8 bg-white/3 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base font-bold">Recent Activity</h2>
                </div>
                <div className="space-y-2">
                  {data!.recentActivity.map((act, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/3 transition-colors group">
                      <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {TYPE_ICONS[act.type] ?? <Brain className="w-3.5 h-3.5 text-slate-400" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{act.label}</p>
                        <p className="text-[10px] text-slate-600 capitalize">{act.type}</p>
                      </div>
                      <span className="text-sm font-black text-indigo-400 shrink-0">{act.score}</span>
                      <span className="text-[10px] text-slate-700 shrink-0">{new Date(act.createdAt).toLocaleDateString()}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Continue CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="relative rounded-3xl border border-indigo-500/15 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-950/80" />
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-indigo-600/15 blur-[80px] -translate-y-1/2 translate-x-1/4" />
              <div className="relative px-8 py-10 flex flex-col md:flex-row items-center gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Keep Going</p>
                  <h3 className="text-xl font-extrabold text-white mb-1">Consistency compounds.</h3>
                  <p className="text-slate-400 text-sm">Pick up where you left off and track your growth.</p>
                </div>
                <div className="flex flex-wrap gap-3 md:ml-auto shrink-0">
                  {TOOL_META.map(t => (
                    <Link key={t.key} href={t.href}
                      className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold bg-gradient-to-r ${t.gradient} shadow-lg ${t.glow} hover:-translate-y-0.5 transition-all flex items-center gap-1.5`}>
                      {t.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
