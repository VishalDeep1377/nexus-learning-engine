'use client';

import { motion } from 'framer-motion';
import { Trophy, Rocket, Zap } from 'lucide-react';

export default function HackathonHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-purple-800/30 p-8 md:p-12 mb-8">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f0a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f0a_1px,transparent_1px)] bg-[size:24px_24px]" />
      {/* Glow orbs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                AI-POWERED
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                BETA
              </span>
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight"
          >
            Hackathon Lab
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-purple-200/80 mb-2 font-medium"
          >
            From problem statement to submission-ready project.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-slate-400 max-w-lg"
          >
            Discover hackathons, find the right project idea, build with an AI-guided plan,
            and prepare your final submission — all in one place.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-2 shrink-0"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            AI Hackathon Agent Active
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Multi-Agent Workflow
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Personalized to Your Skills
          </div>
        </motion.div>
      </div>

      {/* Workflow steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 mt-8 flex flex-wrap gap-2"
      >
        {[
          "DISCOVER", "UNDERSTAND", "IDEATE", "PLAN", "BUILD", "REVIEW", "SUBMIT", "PITCH"
        ].map((step, i) => (
          <span
            key={step}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 text-slate-300"
          >
            <span className="text-purple-400 font-bold">{String(i + 1).padStart(2, '0')}</span>
            {step}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
