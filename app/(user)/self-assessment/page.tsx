import React from 'react';
import Link from 'next/link';
import { Code2, Mic, Brain, Target, ArrowRight, ClipboardCheck, BarChart3, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Self Assessment | Code To Career',
  description: 'AI-powered assessments for coding, speech, quizzes, and aptitude. Measure skills, find gaps, and improve with personalized practice.',
};

const ASSESSMENT_FEATURES = [
  {
    id: 'coding-lab',
    title: 'Coding Lab',
    tagline: 'Write. Run. Improve.',
    icon: Code2,
    description: 'AI-generated challenges across 16+ algorithm categories. Get real code evaluation, progressive hints, and complexity analysis.',
    href: '/self-assessment/coding-lab',
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    glow: 'shadow-purple-500/25 hover:shadow-purple-500/40',
    border: 'border-purple-500/20 hover:border-purple-500/50',
    tag: 'DSA • Algorithms • Data Structures',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    badge: 'Most Popular',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'speech-practice',
    title: 'Communication Lab',
    tagline: 'Speak. Record. Improve.',
    icon: Mic,
    description: 'AI interview coaching with live voice recording. Get STAR method analysis, clarity scores, and a better sample answer.',
    href: '/self-assessment/speech-practice',
    gradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
    glow: 'shadow-pink-500/25 hover:shadow-pink-500/40',
    border: 'border-pink-500/20 hover:border-pink-500/50',
    tag: 'Behavioral • HR • Situational',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-400',
    badge: 'Voice AI',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    id: 'smart-quizzes',
    title: 'Smart Quizzes',
    tagline: 'Any Topic. Instant Quiz.',
    icon: ClipboardCheck,
    description: 'Generate quizzes on any topic — technology, history, science, or your own study notes. Personalized to your weak areas.',
    href: '/self-assessment/smart-quizzes',
    gradient: 'from-sky-600 via-blue-600 to-cyan-600',
    glow: 'shadow-blue-500/25 hover:shadow-blue-500/40',
    border: 'border-blue-500/20 hover:border-blue-500/50',
    tag: 'Any Subject • Adaptive • Explained',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    badge: 'Any Topic',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'aptitude-arena',
    title: 'Aptitude Arena',
    tagline: 'Timed. Tracked. Trained.',
    icon: Target,
    description: 'Placement-level quant, logical, and verbal aptitude. 90s per question. Step-by-step solutions after each one.',
    href: '/self-assessment/aptitude',
    gradient: 'from-amber-600 via-orange-600 to-red-600',
    glow: 'shadow-orange-500/25 hover:shadow-orange-500/40',
    border: 'border-orange-500/20 hover:border-orange-500/50',
    tag: 'Quantitative • Logical • Verbal',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    badge: 'Placement Prep',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];

const STATS = [
  { icon: Zap, label: 'AI-Powered', val: '100%' },
  { icon: Shield, label: 'Topics Covered', val: '50+' },
  { icon: TrendingUp, label: 'Progress Tracked', val: 'Real-time' },
  { icon: Sparkles, label: 'Personalized', val: 'Always' },
];

export default function SelfAssessmentLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0b14] text-white relative overflow-hidden">

      {/* ── Animated background mesh ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-purple-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-pink-600/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <div className="pt-20 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Self Assessment Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Know Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              True Level.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Four AI-powered tools. One unified dashboard. Measure your coding, communication, technical knowledge, and placement aptitude — all in one place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/self-assessment/coding-lab"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5"
            >
              Start Practicing <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/self-assessment/performance"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" /> My Performance
            </Link>
          </div>
        </div>

        {/* ── Mini Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          {STATS.map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/3 backdrop-blur-sm">
              <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{val}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-16">
          {ASSESSMENT_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.id}
                href={feature.href}
                className={`group relative flex flex-col rounded-2xl border ${feature.border} bg-white/3 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl ${feature.glow} overflow-hidden`}
              >
                {/* Inner gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Top row */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.iconBg} border border-white/5`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2 mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{feature.tagline}</p>
                  <h2 className="text-xl font-extrabold text-white">{feature.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>

                {/* Tag + CTA */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-600 font-medium">{feature.tag}</p>
                  <div className={`flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:gap-2.5 transition-all`}>
                    Start now <ArrowRight className={`w-3.5 h-3.5 ${feature.iconColor} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </div>

                {/* Bottom gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </Link>
            );
          })}
        </div>

        {/* ── Performance CTA Banner ── */}
        <div className="relative mb-20 rounded-3xl border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/60" />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-[60px]" />
          <div className="relative px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Performance Dashboard</p>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-1">Track Everything in One Place</h3>
              <p className="text-slate-400 text-sm max-w-md">AI-driven skill gap analysis, adaptive difficulty recommendations, and your full assessment history.</p>
            </div>
            <Link
              href="/self-assessment/performance"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
