'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Target, TrendingUp, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { HackathonAnalysis } from '@/types/hackathon';

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

interface AnalysisResultProps {
  analysis: HackathonAnalysis;
}

export default function AnalysisResult({ analysis }: AnalysisResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Hackathon Intelligence</h2>
        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">
          AI-estimated · Not official
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Problem Summary */}
        <div className="md:col-span-2 rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Problem Summary</h3>
          <p className="text-sm text-slate-200 leading-relaxed">{analysis.problemSummary}</p>
          <div className="mt-3 p-3 rounded-lg bg-purple-600/10 border border-purple-500/20">
            <p className="text-xs text-purple-300 font-medium mb-1">Core Problem</p>
            <p className="text-sm text-white">{analysis.coreProblem}</p>
          </div>
        </div>

        {/* Required Features */}
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            Required Features
          </h3>
          <ul className="space-y-2">
            {analysis.requiredFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-green-400 mt-px shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {analysis.optionalFeatures?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">Optional / Bonus</h3>
              <ul className="space-y-1.5">
                {analysis.optionalFeatures.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-slate-500 mt-px shrink-0">○</span>
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Judging Criteria */}
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            Judging Priorities
            <span className="text-slate-600 font-normal text-[10px] ml-1">(AI-estimated importance)</span>
          </h3>
          <div className="space-y-3">
            {analysis.judgingCriteria.slice(0, 5).map((c, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-300">{c.criterion}</span>
                </div>
                <ScoreBar value={c.importance} />
                <p className="text-[11px] text-slate-500 mt-0.5">{c.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints */}
        {analysis.constraints?.length > 0 && (
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              Constraints
            </h3>
            <ul className="space-y-2">
              {analysis.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-orange-400 mt-px shrink-0">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Differentiators */}
        {analysis.potentialDifferentiators?.length > 0 && (
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Potential Differentiators
            </h3>
            <ul className="space-y-2">
              {analysis.potentialDifferentiators.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-yellow-400 mt-px shrink-0">✨</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Winning Strategy */}
        {analysis.winningStrategy?.length > 0 && (
          <div className="md:col-span-2 rounded-xl bg-gradient-to-r from-blue-950/40 to-purple-950/40 border border-blue-700/30 p-5">
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              AI Recommended Strategy
              <span className="text-slate-600 font-normal text-[10px] ml-1">(AI suggestions · Not guaranteed outcomes)</span>
            </h3>
            <ul className="space-y-2">
              {analysis.winningStrategy.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-200">
                  <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {analysis.commonMistakes?.length > 0 && (
          <div className="md:col-span-2 rounded-xl bg-red-950/20 border border-red-700/20 p-5">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Common Mistakes to Avoid
            </h3>
            <ul className="space-y-1.5 grid md:grid-cols-2 gap-x-4">
              {analysis.commonMistakes.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-red-400 mt-px shrink-0">✗</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Complexity + Team */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-slate-400">Complexity:</span>
          <span className={`text-xs font-semibold ${
            analysis.estimatedComplexity === 'HIGH' ? 'text-red-400'
            : analysis.estimatedComplexity === 'MEDIUM' ? 'text-yellow-400'
            : 'text-green-400'
          }`}>
            {analysis.estimatedComplexity}
          </span>
        </div>
        {analysis.suggestedTeamRoles?.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <span className="text-xs text-slate-400">Suggested roles:</span>
            <span className="text-xs text-slate-300">{analysis.suggestedTeamRoles.join(', ')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
