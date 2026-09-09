'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Loader2, RotateCcw, ChevronRight, CheckCircle, XCircle, Trophy, Brain, Zap, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AptitudeQuestion, AptitudeTest, AptitudeResult } from '@/lib/agents/self-assessment/aptitude-agent';

const APTITUDE_CATEGORIES = {
  QUANTITATIVE: [
    'Time & Work', 'Time, Speed & Distance', 'Pipes & Cisterns',
    'Profit & Loss', 'Simple & Compound Interest', 'Percentages',
    'Number Systems', 'Permutation & Combination', 'Probability',
  ],
  LOGICAL: [
    'Blood Relations', 'Seating Arrangements', 'Syllogisms',
    'Coding & Decoding', 'Series Completion', 'Direction Sense',
    'Clocks & Calendars', 'Puzzles',
  ],
  VERBAL: [
    'Reading Comprehension', 'Sentence Completion', 'Error Spotting',
    'Para Jumbles', 'Synonyms & Antonyms',
  ],
  'DATA INTERPRETATION': [
    'Bar Charts', 'Pie Charts', 'Line Graphs', 'Tables & Caselets',
  ],
};

const COUNTS = [5, 10, 15, 20] as const;
type Mode = 'single' | 'mixed';
type Step = 'setup' | 'generating' | 'test' | 'results';

function CountdownBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, (timeLeft / total) * 100);
  const isUrgent = timeLeft <= 30;
  const color = isUrgent ? 'from-red-600 to-orange-500' : 'from-amber-500 to-orange-500';
  const glow = isUrgent ? 'shadow-red-500/40' : 'shadow-amber-500/20';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Zap className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
          <span>{isUrgent ? 'Hurry!' : 'Time remaining'}</span>
        </div>
        <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'linear' }}
          className={`h-full rounded-full bg-gradient-to-r ${color} shadow-lg ${glow}`} />
      </div>
    </div>
  );
}

export default function AptitudeArenaPage() {
  const [mode, setMode] = useState<Mode>('single');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [count, setCount] = useState<5 | 10 | 15 | 20>(10);
  const [step, setStep] = useState<Step>('setup');
  const [test, setTest] = useState<AptitudeTest | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [result, setResult] = useState<AptitudeResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalTime = count * 90;

  const handleSubmitTest = useCallback(async (answers: (number | null)[], elapsed: number) => {
    if (!test) return;
    try {
      const res = await fetch('/api/self-assessment/aptitude/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: test.questions, userAnswers: answers, timeTaken: elapsed, category: selectedTopic || 'Mixed' }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch { }
    setStep('results');
  }, [test, selectedTopic]);

  useEffect(() => {
    if (step !== 'test') return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setUserAnswers(prev => { handleSubmitTest(prev, totalTime); return prev; });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, totalTime, handleSubmitTest]);

  const handleGenerate = useCallback(async () => {
    if (mode === 'single' && !selectedTopic) { toast.error('Please select a topic.'); return; }
    setStep('generating');
    try {
      const res = await fetch('/api/self-assessment/aptitude/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: mode === 'mixed' ? 'Mixed' : 'Quantitative',
          subCategory: mode === 'single' ? selectedTopic : undefined,
          count, difficulty: 'Mixed',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTest(data.data); setCurrentQ(0);
      setUserAnswers(new Array(count).fill(null));
      setSelectedOption(null); setShowSolution(false); setResult(null);
      setTimeLeft(totalTime); setTimeTaken(0);
      setStep('test');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate test');
      setStep('setup');
    }
  }, [mode, selectedTopic, count, totalTime]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex); setShowSolution(true);
    setUserAnswers(prev => { const n = [...prev]; n[currentQ] = optionIndex; return n; });
  }, [selectedOption, currentQ]);

  const nextQuestion = useCallback(() => {
    if (!test) return;
    const remaining = timeLeft;
    if (currentQ < test.questions.length - 1) {
      setCurrentQ(q => q + 1); setSelectedOption(null); setShowSolution(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      const elapsed = totalTime - remaining;
      setTimeTaken(elapsed);
      setUserAnswers(prev => { handleSubmitTest(prev, elapsed); return prev; });
    }
  }, [test, currentQ, timeLeft, totalTime, handleSubmitTest]);

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('setup'); setTest(null); setSelectedTopic(''); setResult(null);
    setCurrentQ(0); setUserAnswers([]); setSelectedOption(null);
  };

  const currentQuestion = test?.questions[currentQ];
  const isCorrect = selectedOption !== null && currentQuestion && selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-700/15 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-orange-600/10 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Aptitude Arena</h1>
            <p className="text-sm text-slate-500">Placement-level practice. 90s per question. Step-by-step solutions.</p>
          </div>
          {step !== 'setup' && (
            <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
              <RotateCcw className="w-3.5 h-3.5" /> Quit
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* SETUP */}
          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

              {/* Mode */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Test Mode</p>
                <div className="flex gap-3">
                  <button onClick={() => setMode('single')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${mode === 'single' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30' : 'border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-white'}`}>
                    📌 Single Topic
                  </button>
                  <button onClick={() => { setMode('mixed'); setSelectedTopic(''); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${mode === 'mixed' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30' : 'border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-white'}`}>
                    🔀 Mixed Topics
                  </button>
                </div>
              </div>

              {/* Categories */}
              {mode === 'single' && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-5">
                  {Object.entries(APTITUDE_CATEGORIES).map(([cat, topics]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">{cat}</p>
                      <div className="flex flex-wrap gap-2">
                        {topics.map(topic => (
                          <button key={topic} onClick={() => setSelectedTopic(topic)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedTopic === topic ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30' : 'border-white/8 text-slate-500 hover:border-amber-500/40 hover:text-amber-300'}`}>
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Count */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Questions</p>
                <div className="flex gap-2">
                  {COUNTS.map(c => (
                    <button key={c} onClick={() => setCount(c)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${count === c ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/30' : 'border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-2 text-right">≈ {Math.round(count * 90 / 60)} min · 90s per question</p>
              </div>

              <button onClick={handleGenerate}
                disabled={mode === 'single' && !selectedTopic}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2">
                <Brain className="w-5 h-5" />
                {mode === 'single' && selectedTopic ? `Start — ${selectedTopic}` : 'Start Mixed Test'} →
              </button>
            </motion.div>
          )}

          {/* GENERATING */}
          {step === 'generating' && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">Preparing your test...</p>
                <p className="text-sm text-slate-500 mt-1">{count} questions · {Math.round(count * 90 / 60)} minutes</p>
              </div>
            </motion.div>
          )}

          {/* TEST */}
          {step === 'test' && test && currentQuestion && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="space-y-4">

              {/* Timer + progress */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Question <span className="text-white font-semibold">{currentQ + 1}</span> / {test.questions.length}</span>
                  <span className="text-amber-400 font-semibold">{selectedTopic || 'Mixed'}</span>
                </div>
                <CountdownBar timeLeft={timeLeft} total={totalTime} />
              </div>

              {/* Question */}
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-6">
                <div className="flex gap-2 mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full border bg-orange-500/10 border-orange-500/20 text-orange-400 font-bold">{currentQuestion.subCategory}</span>
                </div>
                <p className="text-base font-semibold leading-relaxed text-white">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = i === currentQuestion.correctAnswer;
                  const revealed = selectedOption !== null;
                  let cls = 'border-white/10 bg-white/3 text-slate-300 hover:border-amber-500/40 hover:bg-amber-500/5';
                  if (revealed) {
                    if (isCorrect) cls = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10';
                    else if (isSelected) cls = 'border-red-500/60 bg-red-500/10 text-red-300';
                    else cls = 'border-white/5 bg-transparent text-slate-600 opacity-40';
                  }
                  return (
                    <motion.button key={i} onClick={() => handleAnswer(i)} disabled={selectedOption !== null}
                      whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${cls}`}>
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-[11px] font-black
                        ${revealed && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                          revealed && isSelected ? 'border-red-500 bg-red-500 text-white' :
                          'border-white/20 text-slate-500'}`}>
                        {revealed && isCorrect ? '✓' : revealed && isSelected ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </motion.button>
                  );
                })}
              </div>

              {/* Solution panel */}
              <AnimatePresence>
                {showSolution && currentQuestion.solution && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className={`rounded-2xl p-5 border space-y-3 overflow-hidden ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/3 border-white/8'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step-by-Step Solution</p>
                    {currentQuestion.solution.formula && (
                      <span className="inline-block text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                        {currentQuestion.solution.formula}
                      </span>
                    )}
                    <ol className="space-y-2">
                      {currentQuestion.solution.steps.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                    <p className="font-bold text-sm text-amber-400 border-t border-white/5 pt-3">✓ Answer: {currentQuestion.solution.finalAnswer}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedOption !== null && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={nextQuestion}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2">
                  {currentQ < (test?.questions.length ?? 1) - 1 ? <><ChevronRight className="w-5 h-5" /> Next</> : <><Trophy className="w-5 h-5" /> Finish</>}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* RESULTS */}
          {step === 'results' && result && test && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/25 to-orange-900/10 p-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">Test Complete</p>
                <div className="text-7xl font-black mb-1"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {result.percentage}%
                </div>
                <p className="text-slate-400 text-sm mb-5">{result.score}/{result.total} correct · {Math.round(result.timeTaken / 60)}m taken</p>
                <div className="flex justify-center gap-10">
                  <div><p className="text-2xl font-bold text-emerald-400">{result.score}</p><p className="text-xs text-slate-500 mt-0.5">Correct</p></div>
                  <div><p className="text-2xl font-bold text-red-400">{result.total - result.score}</p><p className="text-xs text-slate-500 mt-0.5">Wrong</p></div>
                  <div><p className="text-2xl font-bold text-blue-400">{Math.round(result.timeTaken / result.total)}s</p><p className="text-xs text-slate-500 mt-0.5">Avg/Q</p></div>
                </div>
              </div>

              {Object.keys(result.categoryBreakdown).length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category Breakdown</p>
                  {Object.entries(result.categoryBreakdown).map(([cat, s]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">{cat}</span>
                        <span className="font-semibold text-white">{s.correct}/{s.total}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                          style={{ width: `${(s.correct / s.total) * 100}%`, boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommendations</p>
                  {result.recommendations.map((r, i) => (
                    <p key={i} className="text-sm text-slate-400 flex gap-2"><ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />{r}</p>
                  ))}
                </div>
              )}

              <button onClick={reset}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:from-amber-400 hover:to-orange-500 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> New Test
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
