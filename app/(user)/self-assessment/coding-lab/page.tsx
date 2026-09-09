'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Loader2, ChevronRight, Lightbulb, CheckCircle,
  XCircle, RotateCcw, Send, Eye, EyeOff, Terminal, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CodingChallenge, CodeReviewResult } from '@/lib/agents/self-assessment/coding-agent';

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const CATEGORIES = [
  'Arrays', 'Strings', 'Two Pointers', 'Sliding Window', 'Hashing',
  'Sorting', 'Binary Search', 'Recursion', 'Linked Lists', 'Stack/Queue',
  'Trees', 'Graphs', 'Dynamic Programming', 'Greedy', 'Math', 'Bit Manipulation',
];

const DIFF_CONFIG = {
  Easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', active: 'bg-emerald-500 text-white border-emerald-500' },
  Medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', active: 'bg-amber-500 text-white border-amber-500' },
  Hard: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', active: 'bg-red-500 text-white border-red-500' },
};

type Step = 'setup' | 'generating' | 'coding' | 'reviewing' | 'results';

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-black text-white">{score}</p>
        <p className="text-[10px] text-slate-500 font-semibold">/ 100</p>
      </div>
    </div>
  );
}

export default function CodingLabPage() {
  const [language, setLanguage] = useState('JavaScript');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [topicInput, setTopicInput] = useState('');
  const [step, setStep] = useState<Step>('setup');
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const handleGenerate = useCallback(async (topic: string) => {
    if (!topic.trim()) { toast.error('Please enter a topic.'); return; }
    setStep('generating');
    try {
      const res = await fetch('/api/self-assessment/coding/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, difficulty, topic: topic.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setChallenge(data.data);
      setCode(data.data.starterCode || '');
      setRevealedHints(0); setShowHints(false); setResult(null);
      setStep('coding');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate challenge');
      setStep('setup');
    }
  }, [language, difficulty]);

  const handleSubmit = useCallback(async () => {
    if (!challenge || !code.trim()) { toast.error('Please write some code first.'); return; }
    setStep('reviewing');
    try {
      const res = await fetch('/api/self-assessment/coding/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, userCode: code, language }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data); setStep('results');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to review code');
      setStep('coding');
    }
  }, [challenge, code, language]);

  const reset = () => { setStep('setup'); setChallenge(null); setCode(''); setResult(null); setTopicInput(''); };

  const ext: Record<string, string> = { JavaScript: 'js', Python: 'py', Java: 'java', 'C++': 'cpp', TypeScript: 'ts', Go: 'go' };

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      {/* Page gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-violet-600/15 blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg shadow-purple-500/30">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Coding Lab</h1>
            <p className="text-sm text-slate-500">AI-generated challenges with real code evaluation and hints</p>
          </div>
          {step !== 'setup' && (
            <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
              <RotateCcw className="w-3.5 h-3.5" /> New
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* SETUP */}
          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

              <GlassCard className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Language</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button key={lang} onClick={() => setLanguage(lang)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        language === lang
                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30'
                          : 'bg-transparent border-white/10 text-slate-400 hover:border-purple-500/40 hover:text-white'
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Difficulty</p>
                <div className="flex gap-3">
                  {DIFFICULTIES.map((d) => {
                    const cfg = DIFF_CONFIG[d];
                    return (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                          difficulty === d ? cfg.active + ' shadow-lg' : `${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`
                        }`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Topic</p>
                <div className="flex gap-3">
                  <input
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate(topicInput)}
                    placeholder="e.g. Binary Search, Two Sum, Fibonacci..."
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                  <button onClick={() => handleGenerate(topicInput)} disabled={!topicInput.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold text-sm hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30">
                    Generate
                  </button>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Quick Select</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat} onClick={() => { setTopicInput(cat); handleGenerate(cat); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/8 text-slate-400 hover:border-purple-500/40 hover:text-purple-300 hover:bg-purple-500/5 transition-all">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* GENERATING */}
          {step === 'generating' && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Creating your challenge...</p>
                <p className="text-sm text-slate-500 mt-1">Crafting a {difficulty} {language} problem</p>
              </div>
            </motion.div>
          )}

          {/* CODING */}
          {step === 'coding' && challenge && (
            <motion.div key="coding" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${DIFF_CONFIG[challenge.difficulty].bg} ${DIFF_CONFIG[challenge.difficulty].border} ${DIFF_CONFIG[challenge.difficulty].color}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-purple-500/30 bg-purple-500/10 text-purple-400">{challenge.topic}</span>
                  <span className="text-xs text-slate-600 ml-auto font-mono">{language}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white mb-3">{challenge.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>

                {challenge.examples?.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Examples</p>
                    {challenge.examples.map((ex, i) => (
                      <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5 font-mono text-xs space-y-1">
                        <p><span className="text-slate-600">Input: </span><span className="text-green-400">{ex.input}</span></p>
                        <p><span className="text-slate-600">Output: </span><span className="text-blue-400">{ex.output}</span></p>
                        {ex.explanation && <p className="text-slate-500 mt-1">{ex.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* IDE Editor */}
              <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* macOS traffic lights */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1b2e] border-b border-white/5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-slate-600 font-mono ml-3">
                    solution.{ext[language] || 'js'}
                  </span>
                  <Terminal className="w-3.5 h-3.5 text-slate-700 ml-auto" />
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-72 p-5 text-sm font-mono bg-[#0d0e1a] text-green-300 focus:outline-none resize-none leading-relaxed"
                  placeholder="// Write your solution here..."
                  spellCheck={false}
                  style={{ caretColor: '#a78bfa' }}
                />
              </div>

              {/* Hints */}
              <GlassCard className="p-4">
                <button onClick={() => setShowHints(!showHints)}
                  className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                  <Lightbulb className="w-4 h-4" />
                  {showHints ? 'Hide Hints' : 'Get a Hint'}
                  {showHints ? <EyeOff className="w-3.5 h-3.5 opacity-60" /> : <Eye className="w-3.5 h-3.5 opacity-60" />}
                </button>
                {showHints && (
                  <div className="mt-3 space-y-2">
                    {challenge.hints?.slice(0, revealedHints + 1).map((hint, i) => (
                      <div key={i} className="text-sm text-amber-200/80 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                        <span className="font-semibold text-amber-400">Hint {i + 1}: </span>{hint}
                      </div>
                    ))}
                    {revealedHints < (challenge.hints?.length ?? 1) - 1 && (
                      <button onClick={() => setRevealedHints((p) => p + 1)} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                        Reveal next hint →
                      </button>
                    )}
                  </div>
                )}
              </GlassCard>

              <button onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
                <Send className="w-5 h-5" /> Submit Solution
              </button>
            </motion.div>
          )}

          {/* REVIEWING */}
          {step === 'reviewing' && (
            <motion.div key="reviewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Analyzing your solution...</p>
                <p className="text-sm text-slate-500 mt-1">AI is reviewing correctness, complexity, and style</p>
              </div>
            </motion.div>
          )}

          {/* RESULTS */}
          {step === 'results' && result && challenge && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Score hero */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-6">
                  <ScoreRing score={result.score} />
                  <div className="flex-1 space-y-3">
                    <h2 className="text-xl font-bold text-white">AI Code Review</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${result.passedTests === result.totalTests ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {result.passedTests === result.totalTests ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {result.passedTests}/{result.totalTests} tests passed
                      </div>
                    </div>
                    {result.timeComplexity && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-white/5">{result.timeComplexity} Time</span>
                        <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-white/5">{result.spaceComplexity} Space</span>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-3">Strengths</p>
                  <ul className="space-y-2">{result.strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm text-emerald-200/80"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{s}</li>)}</ul>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-3">Weaknesses</p>
                  <ul className="space-y-2">{result.weaknesses.map((w, i) => <li key={i} className="flex gap-2 text-sm text-red-200/80"><XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />{w}</li>)}</ul>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-3">Suggestions</p>
                  <ul className="space-y-2">{result.suggestions.map((s, i) => <li key={i} className="flex gap-2 text-sm text-blue-200/80"><ChevronRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />{s}</li>)}</ul>
                </div>
              </div>

              <button onClick={reset}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 transition-all">
                <RotateCcw className="w-5 h-5" /> Try Another Challenge
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
