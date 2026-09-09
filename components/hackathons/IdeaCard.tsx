'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Star, Cpu, Lightbulb, AlertTriangle, ChevronRight } from 'lucide-react';
import type { HackathonIdea } from '@/types/hackathon';

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? 'text-green-400 bg-green-600/10 border-green-500/30'
    : value >= 6 ? 'text-blue-400 bg-blue-600/10 border-blue-500/30'
    : 'text-orange-400 bg-orange-600/10 border-orange-500/30';

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${color}`}>
      <span className="text-slate-400">{label}</span>
      <span className="font-bold">{value}/10</span>
    </div>
  );
}

interface IdeaCardProps {
  idea: HackathonIdea;
  index?: number;
  isSelected?: boolean;
  isRecommended?: boolean;
  onSelect?: (idea: HackathonIdea) => void;
}

export default function IdeaCard({
  idea,
  index = 0,
  isSelected = false,
  isRecommended = false,
  onSelect,
}: IdeaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`relative rounded-xl border p-5 flex flex-col gap-4 transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'border-purple-500/60 bg-gradient-to-br from-purple-950/40 to-slate-900/60 ring-1 ring-purple-500/30'
          : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/60'
      }`}
      onClick={() => onSelect?.(idea)}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-lg">
          <Star className="w-3 h-3" fill="currentColor" />
          AI Recommended
        </div>
      )}

      {/* Title & tagline */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-white text-base leading-snug">{idea.title}</h3>
          {isSelected && (
            <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          )}
        </div>
        <p className="text-sm text-purple-300/80 italic">"{idea.tagline}"</p>
      </div>

      {/* Scores row */}
      <div className="flex flex-wrap gap-2">
        <ScoreBadge label="Innovation" value={idea.innovation} />
        <ScoreBadge label="Feasibility" value={idea.feasibility} />
        <ScoreBadge label="Demo Impact" value={idea.demoImpact} />
        <ScoreBadge label="Complexity" value={idea.technicalComplexity} />
      </div>
      <p className="text-[10px] text-slate-600 -mt-2">All scores are AI estimates for planning only.</p>

      {/* Problem & solution */}
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Problem</p>
          <p className="text-sm text-slate-300 leading-relaxed">{idea.problem}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Solution</p>
          <p className="text-sm text-slate-300 leading-relaxed">{idea.solution}</p>
        </div>
      </div>

      {/* Core features */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Core Features</p>
        <ul className="space-y-1">
          {idea.coreFeatures.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Stack */}
      <div className="flex flex-wrap gap-1.5">
        {idea.recommendedStack.map((tech) => (
          <span key={tech} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-blue-600/10 text-blue-300 border border-blue-500/20">
            <Cpu className="w-2.5 h-2.5" />
            {tech}
          </span>
        ))}
      </div>

      {/* Differentiator */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-600/10 border border-yellow-500/20">
        <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-200">{idea.differentiator}</p>
      </div>

      {/* Risks */}
      {idea.risks?.length > 0 && (
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">{idea.risks[0]}</p>
        </div>
      )}

      {/* Select button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect?.(idea); }}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isSelected
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-slate-700/50 text-slate-200 hover:bg-slate-700 border border-slate-600/50'
        }`}
      >
        {isSelected ? '✓ Selected — Build This' : 'Select This Idea'}
      </button>
    </motion.div>
  );
}
