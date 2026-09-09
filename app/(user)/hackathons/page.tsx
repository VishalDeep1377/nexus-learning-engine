'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Brain, Loader2, AlertCircle, X,
  Calculator, Lightbulb, ClipboardList, Code2, FolderOpen,
  ChevronRight, Clock, Trophy, Trash2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import HackathonHero from '@/components/hackathons/HackathonHero';
import HackathonCard from '@/components/hackathons/HackathonCard';
import IdeaCard from '@/components/hackathons/IdeaCard';
import AnalysisResult from '@/components/hackathons/AnalysisResult';
import BuildPlan from '@/components/hackathons/BuildPlan';
import AgentTrace from '@/components/hackathons/AgentTrace';
import HackathonEmptyState from '@/components/hackathons/HackathonEmptyState';

import type {
  HackathonAnalysis, HackathonIdea, BuildPlan as BuildPlanType,
  HackathonProject, AgentTraceEntry, WorkflowTrace
} from '@/types/hackathon';

// ── Seeded hackathons for demo ──────────────────────────────────────────────
const SEEDED_HACKATHONS = [
  {
    _id: 'seed-1',
    name: 'AI Innovation Challenge',
    organizer: 'TechCorp Labs',
    description: 'Build innovative AI-powered solutions that address real-world problems using generative AI, machine learning, or intelligent automation.',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    themes: ['AI', 'GenAI', 'Productivity', 'Automation'],
    technologies: ['Python', 'Next.js', 'LLMs', 'Vector DBs'],
    status: 'ACTIVE' as const,
    difficulties: 'INTERMEDIATE' as const,
    prizeInfo: 'Recognition + Mentorship',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'seed-2',
    name: 'Developer Experience Hackathon',
    organizer: 'DevTools Community',
    description: 'Create tools, platforms, or workflows that significantly improve the daily experience of software engineers.',
    deadline: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    themes: ['DevTools', 'Open Source', 'CLI', 'Automation'],
    technologies: ['TypeScript', 'Node.js', 'CLI', 'VSCode API'],
    status: 'UPCOMING' as const,
    difficulties: 'BEGINNER' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'seed-3',
    name: 'EdTech Builders Sprint',
    organizer: 'LearnForward Foundation',
    description: 'Design and build next-generation education tools that make learning more accessible, engaging, and effective for all.',
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    themes: ['Education', 'Accessibility', 'AI Tutoring', 'Gamification'],
    technologies: ['React', 'MongoDB', 'AI APIs', 'WebRTC'],
    status: 'ACTIVE' as const,
    difficulties: 'ADVANCED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── Workflow steps type ──────────────────────────────────────────────────────
type Step = 'idle' | 'form' | 'analyzing' | 'ideas' | 'planning' | 'saving';

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'analyze', icon: <Brain className="w-5 h-5" />, label: 'Analyze a Problem', desc: 'Paste problem, get AI requirements', color: 'text-purple-400' },
  { id: 'ideas', icon: <Lightbulb className="w-5 h-5" />, label: 'Generate Ideas', desc: 'Get 3-5 personalized project ideas', color: 'text-yellow-400' },
  { id: 'plan', icon: <ClipboardList className="w-5 h-5" />, label: 'Create Build Plan', desc: 'Turn idea into daily task plan', color: 'text-blue-400' },
  { id: 'review', icon: <Code2 className="w-5 h-5" />, label: 'Review Project', desc: 'AI-powered submission review', color: 'text-green-400' },
];

function getDaysRemaining(deadline?: string): string {
  if (!deadline) return '';
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today!';
  return `${days}d left`;
}

export default function HackathonLabPage() {
  const router = useRouter();

  // My projects
  const [projects, setProjects] = useState<HackathonProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Live hackathons from Brabble API
  const [liveHackathons, setLiveHackathons] = useState<any[]>([]);
  const [loadingHackathons, setLoadingHackathons] = useState(true);
  const [hackathonSource, setHackathonSource] = useState<'live' | 'seeded'>('seeded');

  // Workflow state
  const [step, setStep] = useState<Step>('idle');
  const [formData, setFormData] = useState({
    problemStatement: '',
    hackathonName: '',
    rules: '',
    judgingCriteria: '',
    deadline: '',
    teamSize: 1,
  });

  // AI results
  const [analysis, setAnalysis] = useState<HackathonAnalysis | null>(null);
  const [ideas, setIdeas] = useState<HackathonIdea[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [careerAlignment, setCareerAlignment] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<HackathonIdea | null>(null);
  const [buildPlan, setBuildPlan] = useState<BuildPlanType | null>(null);
  const [trace, setTrace] = useState<AgentTraceEntry[]>([]);
  const [error, setError] = useState('');

  // Load user projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/hackathons/projects');
        const data = await res.json();
        if (data.success) setProjects(data.data);
      } catch (e) {
        console.error('Failed to load projects', e);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  // Delete project
  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const res = await fetch(`/api/hackathons/projects/${projectId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProjects(p => p.filter(proj => proj._id !== projectId));
        toast.success('Project deleted');
      } else {
        toast.error('Failed to delete project');
      }
    } catch {
      toast.error('Failed to delete project');
    }
  };

  // Load live hackathons from Brabble API
  const loadLiveHackathons = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setLoadingHackathons(true);
    try {
      const url = forceRefresh ? '/api/hackathons/explore?refresh=true' : '/api/hackathons/explore';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setLiveHackathons(data.data);
        setHackathonSource('live');
        if (forceRefresh) toast.success('Hackathons refreshed!');
      } else {
        // Fallback to seeded
        setLiveHackathons(SEEDED_HACKATHONS as any[]);
        setHackathonSource('seeded');
        if (forceRefresh) toast.error('No new live hackathons found.');
      }
    } catch (e) {
      console.error('Failed to load live hackathons, using fallback:', e);
      setLiveHackathons(SEEDED_HACKATHONS as any[]);
      setHackathonSource('seeded');
      if (forceRefresh) toast.error('Error connecting to live server.');
    } finally {
      setLoadingHackathons(false);
    }
  }, []);

  useEffect(() => {
    loadLiveHackathons();
  }, [loadLiveHackathons]);

  // ── Step: Analyze + ideate ─────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!formData.problemStatement.trim()) {
      toast.error('Please enter a problem statement first.');
      return;
    }

    setStep('analyzing');
    setError('');
    setTrace([
      { agentName: 'Hackathon Analyzer', status: 'RUNNING', startedAt: new Date().toISOString() },
      { agentName: 'Idea Generator', status: 'PENDING' },
    ]);

    try {
      const res = await fetch('/api/hackathons/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Analysis failed.');
      }

      const { analysis: a, ideasResult: ir, trace: t } = data.data;
      setAnalysis(a);
      setIdeas(ir.ideas);
      setRecommendation(ir.personalizedRecommendation);
      setCareerAlignment(ir.careerAlignment);
      setTrace(t.agents);
      setStep('ideas');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      setTrace((prev) => prev.map((a) =>
        a.status === 'RUNNING' ? { ...a, status: 'FAILED', error: msg } : a
      ));
      setStep('form');
      toast.error(msg);
    }
  }, [formData]);

  // ── Step: Generate build plan ──────────────────────────────────────────────
  const handleGeneratePlan = useCallback(async (idea: HackathonIdea) => {
    setSelectedIdea(idea);
    setStep('planning');

    try {
      const res = await fetch('/api/hackathons/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedIdea: idea,
          analysis,
          hackathonName: formData.hackathonName,
          deadline: formData.deadline,
          teamSize: formData.teamSize,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error?.message || 'Plan generation failed.');
      setBuildPlan(data.data.plan);
      setStep('saving');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate plan.';
      toast.error(msg);
      setStep('ideas');
    }
  }, [analysis, formData]);

  // ── Step: Save project ─────────────────────────────────────────────────────
  const handleSaveProject = useCallback(async () => {
    if (!selectedIdea) return;

    try {
      const res = await fetch('/api/hackathons/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedIdea.title,
          tagline: selectedIdea.tagline,
          problemStatement: formData.problemStatement,
          hackathonName: formData.hackathonName,
          hackathonRules: formData.rules,
          hackathonJudgingCriteria: formData.judgingCriteria,
          deadline: formData.deadline || undefined,
          teamSize: formData.teamSize,
          selectedIdea,
          analysis,
          tasks: buildPlan?.tasks ?? [],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);

      toast.success('🚀 Project saved! Opening workspace...');
      const projectId = data.data._id;
      setProjects((prev) => [data.data, ...prev]);
      router.push(`/hackathons/project/${projectId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project.';
      toast.error(msg);
    }
  }, [selectedIdea, formData, analysis, buildPlan, router]);

  const resetWorkflow = () => {
    setStep('idle');
    setAnalysis(null);
    setIdeas([]);
    setSelectedIdea(null);
    setBuildPlan(null);
    setTrace([]);
    setError('');
    setFormData({ problemStatement: '', hackathonName: '', rules: '', judgingCriteria: '', deadline: '', teamSize: 1 });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-100 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <HackathonHero />

        {/* Primary CTA — only when workflow is idle */}
        {step === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-3 mb-10"
          >
            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-4 h-4" />
              Start New Hackathon Project
            </button>
            <button
              onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-600/50 text-slate-300 font-semibold text-sm hover:border-slate-500 hover:bg-slate-800/40 transition-all"
            >
              <Search className="w-4 h-4" />
              Explore Hackathons
            </button>
          </motion.div>
        )}

        {/* ── WORKFLOW PANEL ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="mb-10 rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Start New Project</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Paste your hackathon problem and let AI analyze it</p>
                </div>
                <button onClick={resetWorkflow} className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Problem Statement <span className="text-purple-400">*</span>
                  </label>
                  <textarea
                    value={formData.problemStatement}
                    onChange={(e) => setFormData((p) => ({ ...p, problemStatement: e.target.value }))}
                    placeholder="Paste the hackathon problem statement here. The more detail, the better the analysis..."
                    rows={5}
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 p-3.5 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hackathon Name</label>
                  <input
                    value={formData.hackathonName}
                    onChange={(e) => setFormData((p) => ({ ...p, hackathonName: e.target.value }))}
                    placeholder="e.g. AI Innovation Challenge"
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 p-3.5 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 p-3.5 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Judging Criteria</label>
                  <input
                    value={formData.judgingCriteria}
                    onChange={(e) => setFormData((p) => ({ ...p, judgingCriteria: e.target.value }))}
                    placeholder="e.g. Innovation, Technical Depth, Impact"
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 p-3.5 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Size</label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData((p) => ({ ...p, teamSize: Number(e.target.value) }))}
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 p-3.5 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? 'person (Solo)' : 'people'}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rules / Constraints (optional)</label>
                  <textarea
                    value={formData.rules}
                    onChange={(e) => setFormData((p) => ({ ...p, rules: e.target.value }))}
                    placeholder="Any specific rules, technology restrictions, or constraints..."
                    rows={2}
                    className="w-full rounded-xl bg-slate-800/60 border border-slate-600/50 text-sm text-slate-200 placeholder-slate-500 p-3.5 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  Analyze with AI
                </button>
                <button onClick={resetWorkflow} className="px-4 py-2.5 rounded-xl border border-slate-600/50 text-slate-400 text-sm hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-10 rounded-2xl bg-slate-900/70 border border-slate-700/50 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                <div>
                  <h2 className="text-lg font-bold text-white">Running AI Workflow...</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Agents are analyzing your hackathon</p>
                </div>
              </div>
              <AgentTrace agents={trace} title="AI Hackathon Agent Workflow" />
              <div className="mt-4 space-y-2">
                {['Reading problem statement', 'Extracting requirements', 'Evaluating judging criteria', 'Generating project ideas'].map((msg, i) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.8, duration: 0.4 }}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                    {msg}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'ideas' && analysis && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-10 space-y-6"
            >
              {/* Agent trace */}
              <AgentTrace agents={trace} title="Completed Workflow" />

              {/* Analysis */}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6 md:p-8">
                <AnalysisResult analysis={analysis} />
              </div>

              {/* Personalized recommendation */}
              {recommendation && (
                <div className="rounded-xl bg-blue-950/40 border border-blue-700/30 p-4">
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">🎯 Personalized Recommendation</p>
                  <p className="text-sm text-blue-200">{recommendation}</p>
                  {careerAlignment && (
                    <p className="text-sm text-slate-400 mt-2 pt-2 border-t border-blue-700/20">{careerAlignment}</p>
                  )}
                </div>
              )}

              {/* Ideas */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Project Ideas ({ideas.length})
                  <span className="text-xs font-normal text-slate-500 ml-1">Click an idea to select it</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ideas.map((idea, i) => (
                    <IdeaCard
                      key={idea.title}
                      idea={idea}
                      index={i}
                      isSelected={selectedIdea?.title === idea.title}
                      isRecommended={i === 0}
                      onSelect={handleGeneratePlan}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={resetWorkflow} className="text-sm text-slate-400 hover:text-white transition-colors">
                  ← Start Over
                </button>
              </div>
            </motion.div>
          )}

          {step === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-10 rounded-2xl bg-slate-900/70 border border-slate-700/50 p-8"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <div>
                  <h2 className="text-lg font-bold text-white">Generating Build Plan...</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Creating day-by-day task plan for <span className="text-white font-medium">{selectedIdea?.title}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'saving' && selectedIdea && buildPlan && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 rounded-2xl bg-slate-900/70 border border-slate-700/50 p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedIdea.title}</h2>
                  <p className="text-sm text-purple-300 italic mt-0.5">"{selectedIdea.tagline}"</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-green-600/20 text-green-300 text-xs font-semibold border border-green-500/30">
                  Plan Ready
                </span>
              </div>

              <BuildPlan
                tasks={buildPlan.tasks}
                totalDays={buildPlan.totalDays}
                overview={buildPlan.overview}
              />

              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-700/40">
                <button
                  onClick={handleSaveProject}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/30"
                >
                  <FolderOpen className="w-4 h-4" />
                  Save & Open Workspace
                </button>
                <button onClick={() => setStep('ideas')} className="px-4 py-2.5 rounded-xl border border-slate-600/50 text-slate-400 text-sm hover:text-white transition-colors">
                  ← Choose Different Idea
                </button>
                <button onClick={resetWorkflow} className="px-4 py-2.5 rounded-xl border border-slate-600/50 text-slate-400 text-sm hover:text-white transition-colors">
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider when workflow ongoing */}
        {step !== 'idle' && step !== 'form' && <div className="my-8" />}

        {/* ── MY PROJECTS ──────────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              My Hackathon Projects
            </h2>
            {step === 'idle' && (
              <button
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            )}
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <HackathonEmptyState onStart={() => setStep('form')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-slate-600/60 p-5 flex flex-col gap-3 transition-all duration-200 group cursor-pointer"
                  onClick={() => router.push(`/hackathons/project/${project._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-white text-sm group-hover:text-purple-200 transition-colors leading-snug pr-4">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                        project.status === 'SUBMITTED' ? 'bg-green-600/20 text-green-300 border-green-500/30'
                        : project.status === 'BUILDING' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                        : 'bg-slate-600/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {project.status}
                      </span>
                      <button
                        onClick={(e) => handleDeleteProject(e, project._id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {project.tagline && (
                    <p className="text-xs text-slate-400 italic">"{project.tagline}"</p>
                  )}

                  {project.hackathonName && (
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-400">Hackathon:</span> {project.hackathonName}
                    </p>
                  )}

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span className="font-mono">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/40">
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {getDaysRemaining(project.deadline)}
                      </div>
                    )}
                    <span className="flex items-center gap-1 text-xs text-purple-400 ml-auto">
                      Open Workspace <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── FEATURED HACKATHONS ────────────────────────────────────────────── */}
        <section id="featured" className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Live Hackathons
              {hackathonSource === 'live' && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-500/30 ml-1">
                  🟢 Live via Brabble
                </span>
              )}
              {hackathonSource === 'seeded' && !loadingHackathons && (
                <span className="text-xs font-normal text-slate-500 ml-1">Example entries</span>
              )}
            </h2>
            <div className="flex items-center gap-4">
              {hackathonSource === 'live' && !loadingHackathons && (
                <span className="text-xs text-slate-500">Updated hourly · {liveHackathons.length} found</span>
              )}
              <button
                onClick={() => loadLiveHackathons(true)}
                disabled={loadingHackathons}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHackathons ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {loadingHackathons ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-5 h-56 animate-pulse">
                  <div className="h-4 bg-slate-700/60 rounded mb-3 w-3/4" />
                  <div className="h-3 bg-slate-700/40 rounded mb-2 w-1/2" />
                  <div className="h-3 bg-slate-700/40 rounded mb-4 w-full" />
                  <div className="flex gap-2">
                    <div className="h-5 w-14 bg-slate-700/40 rounded-full" />
                    <div className="h-5 w-10 bg-slate-700/40 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveHackathons.map((h, i) => (
                hackathonSource === 'live' ? (
                  // Live card with external link
                  <motion.div
                    key={h._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-purple-500/40 p-5 flex flex-col gap-3 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white text-sm group-hover:text-purple-200 transition-colors leading-snug">{h.name}</h3>
                      <span className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                        h.status === 'ACTIVE' ? 'bg-green-600/20 text-green-300 border-green-500/30'
                        : h.status === 'UPCOMING' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                        : 'bg-slate-600/20 text-slate-400 border-slate-500/30'
                      }`}>{h.status}</span>
                    </div>

                    {h.organizer && <p className="text-xs text-slate-400">by {h.organizer}</p>}

                    <p className="text-xs text-slate-400 line-clamp-2 flex-1">{h.description}</p>

                    {h.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {h.themes.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-[11px] border border-slate-600/30">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/40">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {h.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getDaysRemaining(h.deadline)}
                          </span>
                        )}
                        {h.isOnline && <span className="text-blue-400">🌐 Online</span>}
                        {h.location && !h.isOnline && <span>📍 {h.location}</span>}
                      </div>
                      {h.externalUrl ? (
                        <a
                          href={h.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/80 text-white text-xs font-semibold hover:bg-purple-600 transition-colors"
                        >
                          Apply <ChevronRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          onClick={() => setStep('form')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                        >
                          Explore <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <HackathonCard
                    key={h._id}
                    hackathon={h}
                    index={i}
                    onExplore={() => setStep('form')}
                  />
                )
              ))}
            </div>
          )}
        </section>

        {/* ── QUICK ACTIONS ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => action.id === 'analyze' && setStep('form')}
                className="flex flex-col gap-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/60 transition-all duration-200 text-left group"
              >
                <span className={`${action.color} group-hover:scale-110 transition-transform inline-block`}>
                  {action.icon}
                </span>
                <span className="text-sm font-semibold text-white">{action.label}</span>
                <span className="text-xs text-slate-500">{action.desc}</span>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
