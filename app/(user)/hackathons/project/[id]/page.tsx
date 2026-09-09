'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, AlertCircle, Layout, ListChecks,
  CheckSquare, Trophy, Clock, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

import BuildPlan from '@/components/hackathons/BuildPlan';
import AnalysisResult from '@/components/hackathons/AnalysisResult';
import type { HackathonProject, TaskStatus } from '@/types/hackathon';

type Tab = 'overview' | 'tasks' | 'analysis';

// ── Tab helpers ───────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Layout className="w-4 h-4" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'analysis', label: 'AI Analysis', icon: <BarChart2 className="w-4 h-4" /> },
];

function getDaysLabel(deadline?: string): string {
  if (!deadline) return '';
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today!';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function HackathonProjectPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<HackathonProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);

  // Load project
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hackathons/projects/${id}`);
        const data = await res.json();
        if (!data.success) {
          setError(data.error?.message || 'Project not found.');
          return;
        }
        setProject(data.data);
      } catch {
        setError('Failed to load project.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Task status toggle
  const handleTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    if (!project) return;

    const updatedTasks = project.tasks?.map((t) =>
      t.id === taskId ? { ...t, status } : t
    ) ?? [];

    const done = updatedTasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = updatedTasks.length > 0 ? Math.round((done / updatedTasks.length) * 100) : 0;

    // Optimistically update UI
    setProject((prev) => prev ? { ...prev, tasks: updatedTasks, progress } : prev);

    // Persist
    setSaving(true);
    try {
      const res = await fetch(`/api/hackathons/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
    } catch (err) {
      toast.error('Failed to save task update.');
    } finally {
      setSaving(false);
    }
  }, [project, id]);

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-950 bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen dark:bg-slate-950 bg-slate-100 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-white font-semibold text-lg">{error || 'Project not found'}</p>
        <button
          onClick={() => router.push('/hackathons')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathon Lab
        </button>
      </div>
    );
  }

  const { tasks = [], analysis, selectedIdea } = project;
  const daysLabel = getDaysLabel(project.deadline);

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push('/hackathons')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Hackathon Lab
        </button>

        {/* Project header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-800/30 p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  project.status === 'SUBMITTED' ? 'bg-green-600/20 text-green-300 border-green-500/30'
                  : project.status === 'BUILDING' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                  : project.status === 'REVIEW' ? 'bg-orange-600/20 text-orange-300 border-orange-500/30'
                  : 'bg-slate-600/20 text-slate-400 border-slate-500/30'
                }`}>
                  {project.status}
                </span>
                {saving && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{project.title}</h1>
              {project.tagline && (
                <p className="text-purple-300/80 italic text-sm">"{project.tagline}"</p>
              )}
              {project.hackathonName && (
                <p className="text-xs text-slate-400 mt-1">Hackathon: {project.hackathonName}</p>
              )}
            </div>

            {daysLabel && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 shrink-0">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">{daysLabel}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Build Progress</span>
              <motion.span
                key={project.progress}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-mono font-bold text-sm ${project.progress === 100 ? 'text-green-300' : 'text-purple-300'}`}
              >
                {project.progress}%
              </motion.span>
            </div>

            {/* Track */}
            <div className="h-3.5 bg-slate-700/50 rounded-full overflow-hidden ring-1 ring-slate-600/30 shadow-inner relative">
              <motion.div
                className={`h-full rounded-full relative overflow-hidden bg-gradient-to-r ${
                  project.progress === 100
                    ? 'from-emerald-400 via-green-400 to-teal-400'
                    : project.progress >= 75
                    ? 'from-purple-500 via-violet-500 to-blue-500'
                    : 'from-purple-600 to-indigo-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                />
                {/* Leading glow */}
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/30 blur-sm rounded-full" />
              </motion.div>

              {/* Milestone dots */}
              {[25, 50, 75, 100].map((m) => (
                <div
                  key={m}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${m}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`w-2 h-2 rounded-full border-2 transition-colors duration-500 ${
                    project.progress >= m
                      ? project.progress === 100 ? 'bg-green-300 border-green-200' : 'bg-purple-300 border-purple-200'
                      : 'bg-slate-700 border-slate-500'
                  }`} />
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs text-slate-600 mt-1.5">
              <span>{tasks.filter((t) => t.status === 'COMPLETED').length} of {tasks.length} tasks done</span>
              <span>{tasks.filter((t) => t.status === 'IN_PROGRESS').length} in progress</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-slate-800/40 border border-slate-700/40 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Overview ──────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {selectedIdea && (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Selected Idea</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Problem</p>
                      <p className="text-sm text-slate-200 mt-0.5">{selectedIdea.problem}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Solution</p>
                      <p className="text-sm text-slate-200 mt-0.5">{selectedIdea.solution}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">Stack</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedIdea.recommendedStack?.map((tech) => (
                          <span key={tech} className="px-2 py-0.5 text-xs rounded bg-blue-600/10 text-blue-300 border border-blue-500/20">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {project.problemStatement && (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Problem Statement</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{project.problemStatement}</p>
                </div>
              )}

              {tasks.length > 0 && (
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    Current Focus
                  </h3>
                  <div className="space-y-2">
                    {tasks
                      .filter((t) => t.status === 'IN_PROGRESS')
                      .slice(0, 3)
                      .map((t) => (
                        <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                          <span className="text-sm text-blue-200">{t.title}</span>
                        </div>
                      ))}
                    {tasks.filter((t) => t.status === 'IN_PROGRESS').length === 0 && (
                      <p className="text-sm text-slate-500">
                        No tasks in progress. Go to Tasks tab to start working.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tasks ─────────────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="rounded-xl bg-slate-900/70 border border-slate-700/50 p-5">
              {tasks.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No tasks generated yet.</p>
                  <p className="text-slate-500 text-xs mt-1">Go back to Hackathon Lab and generate a project plan.</p>
                </div>
              ) : (
                <BuildPlan
                  tasks={tasks}
                  onStatusChange={handleTaskStatus}
                />
              )}
            </div>
          )}

          {/* ── Analysis ──────────────────────────────────────────────────── */}
          {activeTab === 'analysis' && (
            <div className="rounded-xl bg-slate-900/70 border border-slate-700/50 p-5">
              {analysis ? (
                <AnalysisResult analysis={analysis} />
              ) : (
                <div className="py-12 text-center">
                  <BarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No AI analysis saved for this project.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
