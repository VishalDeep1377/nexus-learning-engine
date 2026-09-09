'use client';

import { motion } from 'framer-motion';
import { Trophy, Rocket, ArrowRight } from 'lucide-react';

interface HackathonEmptyStateProps {
  onStart?: () => void;
}

export default function HackathonEmptyState({ onStart }: HackathonEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 mb-6">
        <Trophy className="w-10 h-10 text-purple-400" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">No hackathon projects yet</h3>
      <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
        Start with a problem statement and let AI help you turn it into a competition-ready project.
        The complete workflow: Analyze → Ideate → Plan → Build → Submit.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
        >
          <Rocket className="w-4 h-4" />
          Start Your First Project
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4 text-center">
        {[
          { emoji: '🔍', label: 'Analyze', desc: 'Paste problem, get requirements' },
          { emoji: '💡', label: 'Ideate', desc: 'AI generates project ideas' },
          { emoji: '🚀', label: 'Build', desc: 'Follow AI-guided task plan' },
        ].map((step) => (
          <div key={step.label} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="text-2xl mb-1">{step.emoji}</div>
            <div className="text-xs font-semibold text-slate-300">{step.label}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{step.desc}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
