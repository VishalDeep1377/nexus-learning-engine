'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight, Clock, AlertCircle, Loader2, Trophy } from 'lucide-react';
import type { HackathonTask, TaskStatus } from '@/types/hackathon';

const priorityConfig = {
  CRITICAL: 'text-red-400 border-red-500/30 bg-red-600/10',
  HIGH: 'text-orange-400 border-orange-500/30 bg-orange-600/10',
  MEDIUM: 'text-blue-400 border-blue-500/30 bg-blue-600/10',
  LOW: 'text-slate-400 border-slate-500/30 bg-slate-600/10',
};

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  TODO: <Circle className="w-4 h-4 text-slate-500" />,
  IN_PROGRESS: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
  COMPLETED: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  BLOCKED: <AlertCircle className="w-4 h-4 text-red-400" />,
};

interface BuildPlanProps {
  tasks: HackathonTask[];
  totalDays?: number;
  overview?: string;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

function groupByDay(tasks: HackathonTask[]): Map<number, HackathonTask[]> {
  const map = new Map<number, HackathonTask[]>();
  tasks.forEach((task) => {
    const day = task.day ?? 1;
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(task);
  });
  return new Map([...map.entries()].sort(([a], [b]) => a - b));
}

// Floating particle for celebration
function Particle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className={`absolute bottom-0 w-2 h-2 rounded-full ${color} opacity-0`}
      style={{ left: `${x}%` }}
      animate={{
        y: [-10, -80, -120],
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.3],
        x: [0, (x % 2 === 0 ? 20 : -20)],
      }}
      transition={{
        duration: 1.8,
        delay,
        repeat: Infinity,
        repeatDelay: 2.5,
        ease: 'easeOut',
      }}
    />
  );
}

export default function BuildPlan({ tasks, totalDays, overview, onStatusChange }: BuildPlanProps) {
  const tasksByDay = groupByDay(tasks);
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const isComplete = progress === 100 && tasks.length > 0;

  // Colour the bar based on progress
  const barGradient = isComplete
    ? 'from-emerald-400 via-green-400 to-teal-400'
    : progress >= 75
    ? 'from-purple-500 via-violet-500 to-blue-500'
    : progress >= 40
    ? 'from-purple-600 to-indigo-500'
    : 'from-indigo-600 to-purple-500';

  const milestones = [25, 50, 75, 100];

  return (
    <div className="space-y-5">
      {/* Overview */}
      {overview && (
        <div className="rounded-xl bg-blue-950/30 border border-blue-700/30 p-4">
          <p className="text-sm text-blue-200">{overview}</p>
        </div>
      )}

      {/* ── PREMIUM PROGRESS CARD ─────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 relative overflow-hidden transition-all duration-700 ${
        isComplete
          ? 'bg-gradient-to-br from-emerald-950/60 via-green-950/40 to-teal-950/50 border-green-500/30 shadow-lg shadow-green-900/20'
          : 'bg-slate-800/60 border-slate-700/40'
      }`}>

        {/* Subtle background glow when complete */}
        {isComplete && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/10 to-teal-500/5 pointer-events-none"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            Overall Progress
            {isComplete && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-medium"
              >
                Complete!
              </motion.span>
            )}
          </span>
          <motion.span
            key={progress}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-lg font-bold font-mono tabular-nums ${
              isComplete ? 'text-green-300' : 'text-purple-300'
            }`}
          >
            {progress}%
          </motion.span>
        </div>

        {/* Progress track */}
        <div className="relative">
          {/* Track */}
          <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden ring-1 ring-slate-600/30 shadow-inner">
            {/* Animated fill */}
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${barGradient} relative overflow-hidden`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
              />
              {/* Leading edge glow */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-sm rounded-full" />
            </motion.div>
          </div>

          {/* Milestone dots overlay */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            {milestones.map((m) => (
              <div key={m} className="absolute top-1/2" style={{ left: `${m}%`, transform: 'translate(-50%, -50%)' }}>
                <motion.div
                  className={`w-2.5 h-2.5 rounded-full border-2 transition-colors duration-500 ${
                    progress >= m
                      ? isComplete ? 'bg-green-300 border-green-200' : 'bg-purple-300 border-purple-200'
                      : 'bg-slate-700 border-slate-500'
                  }`}
                  animate={progress >= m ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.4 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Milestone labels */}
        <div className="flex justify-between mt-1 px-0.5">
          {milestones.map((m) => (
            <span
              key={m}
              className={`text-[10px] font-mono transition-colors duration-500 ${
                progress >= m ? (isComplete ? 'text-green-400' : 'text-purple-400') : 'text-slate-600'
              }`}
            >
              {m}%
            </span>
          ))}
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-500">{completedCount} of {tasks.length} tasks done</span>
          {totalDays && <span className="text-xs text-slate-500">{totalDays}-day plan</span>}
        </div>
      </div>

      {/* ── CONGRATULATIONS BANNER ─────────────────────────────────────── */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-950/50 via-amber-950/40 to-orange-950/30 p-7 text-center shadow-xl shadow-yellow-900/20"
        >
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.12),transparent_70%)] pointer-events-none" />

          {/* Floating particles */}
          {[
            { x: 10, delay: 0,    color: 'bg-yellow-400' },
            { x: 25, delay: 0.3,  color: 'bg-green-400' },
            { x: 40, delay: 0.6,  color: 'bg-purple-400' },
            { x: 55, delay: 0.1,  color: 'bg-blue-400' },
            { x: 70, delay: 0.8,  color: 'bg-yellow-300' },
            { x: 85, delay: 0.45, color: 'bg-emerald-400' },
            { x: 18, delay: 1.1,  color: 'bg-pink-400' },
            { x: 62, delay: 0.7,  color: 'bg-indigo-400' },
          ].map((p, i) => (
            <Particle key={i} x={p.x} delay={p.delay} color={p.color} />
          ))}

          {/* Trophy icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="relative z-10 inline-block mb-3"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Trophy className="w-14 h-14 text-yellow-400 mx-auto drop-shadow-[0_0_16px_rgba(234,179,8,0.7)]" />
            </motion.div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-extrabold text-yellow-200 tracking-tight drop-shadow-md relative z-10"
          >
            🎉 Congratulations!
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-yellow-100/70 mt-1.5 max-w-sm mx-auto relative z-10"
          >
            You crushed every task! Your project is 100% complete — time to submit and shine. 🚀
          </motion.p>

          {/* Animated underline ornament */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
            className="mt-4 h-0.5 w-32 mx-auto rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 relative z-10"
          />
        </motion.div>
      )}

      {/* Tasks by day */}
      {[...tasksByDay.entries()].map(([day, dayTasks]) => (
        <div key={day}>
          <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-700/60 text-xs font-bold text-slate-300">
              {day}
            </span>
            Day {day}
          </h3>

          <div className="space-y-2">
            {dayTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`rounded-lg border p-3.5 transition-all duration-200 ${
                  task.status === 'COMPLETED'
                    ? 'bg-green-600/5 border-green-700/20 opacity-70'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-600/10 border-blue-500/30'
                    : task.status === 'BLOCKED'
                    ? 'bg-red-600/10 border-red-500/30'
                    : 'bg-slate-800/40 border-slate-700/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      if (!onStatusChange) return;
                      // Toggle directly from TODO/IN_PROGRESS to COMPLETED in one click
                      const next: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
                      onStatusChange(task.id, next);
                    }}
                    className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                    aria-label={`Toggle task: ${task.title}`}
                  >
                    {statusIcon[task.status]}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${priorityConfig[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {task.estimatedHours}h
                        </span>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{task.description}</p>
                    )}
                    {task.dependencies?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-[11px] text-slate-500">Needs: {task.dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
