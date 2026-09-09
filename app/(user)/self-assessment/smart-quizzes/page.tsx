'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, RotateCcw, ChevronRight, CheckCircle, XCircle, Trophy, Sparkles, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import type { GeneratedQuiz, QuizResult } from '@/lib/agents/self-assessment/quiz-agent';

const COUNTS = [5, 10, 15, 20] as const;
const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'] as const;

const QUICK_TOPICS = [
  'JavaScript', 'React', 'Python', 'Data Structures', 'Algorithms',
  'CSS', 'Node.js', 'SQL', 'Machine Learning', 'System Design',
  'Computer Networks', 'Operating Systems', 'DBMS', 'AWS', 'Docker',
];

type Step = 'setup' | 'generating' | 'quiz' | 'results';

function OptionButton({ option, index, selected, correct, revealed, onSelect }: {
  option: string; index: number; selected: boolean; correct: boolean; revealed: boolean; onSelect: () => void;
}) {
  let cls = 'border-white/10 bg-white/3 text-slate-300 hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-white';
  if (revealed) {
    if (correct) cls = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10';
    else if (selected) cls = 'border-red-500/60 bg-red-500/10 text-red-300';
    else cls = 'border-white/5 bg-transparent text-slate-600 opacity-50';
  }
  return (
    <motion.button
      onClick={onSelect}
      disabled={revealed}
      whileTap={!revealed ? { scale: 0.98 } : {}}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${cls}`}
    >
      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-[11px] font-black transition-all
        ${revealed && correct ? 'border-emerald-500 bg-emerald-500 text-white' :
          revealed && selected ? 'border-red-500 bg-red-500 text-white' :
          'border-white/20 text-slate-500'}`}>
        {revealed && correct ? <CheckCircle className="w-3.5 h-3.5" /> :
          revealed && selected ? <XCircle className="w-3.5 h-3.5" /> :
          String.fromCharCode(65 + index)}
      </span>
      <span className="leading-snug">{option}</span>
    </motion.button>
  );
}

export default function SmartQuizzesPage() {
  const [topicInput, setTopicInput] = useState('');
  const [count, setCount] = useState<5 | 10 | 15 | 20>(10);
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>('Mixed');
  const [step, setStep] = useState<Step>('setup');
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topicInput.trim()) { toast.error('Please enter a topic.'); return; }
    setStep('generating');
    try {
      const res = await fetch('/api/self-assessment/quizzes/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput.trim(), count, difficulty }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setQuiz(data.data); setCurrentQ(0); setUserAnswers([]);
      setSelectedOption(null); setShowExplanation(false); setResult(null);
      setStep('quiz');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate quiz');
      setStep('setup');
    }
  }, [topicInput, count, difficulty]);

  const handleAnswer = useCallback(async (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);
    setShowExplanation(true);
    const newAnswers = [...userAnswers, optionIndex];
    setUserAnswers(newAnswers);
    if (quiz && currentQ === quiz.questions.length - 1) {
      try {
        const res = await fetch('/api/self-assessment/quizzes/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: quiz.questions, userAnswers: newAnswers, topic: quiz.topic }),
        });
        const data = await res.json();
        if (data.success) setResult(data.data);
      } catch { }
    }
  }, [selectedOption, userAnswers, quiz, currentQ]);

  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1); setSelectedOption(null); setShowExplanation(false);
    } else {
      setStep('results');
    }
  }, [quiz, currentQ]);

  const reset = () => { setStep('setup'); setQuiz(null); setTopicInput(''); setResult(null); setCurrentQ(0); setUserAnswers([]); setSelectedOption(null); };

  const currentQuestion = quiz?.questions[currentQ];
  const progress = quiz ? ((currentQ + (selectedOption !== null ? 1 : 0)) / quiz.questions.length) * 100 : 0;
  const isCorrect = selectedOption !== null && currentQuestion && selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-cyan-600/10 blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Personalized Quizzes</h1>
            <p className="text-sm text-slate-500">AI quiz on any topic — with explanations after every answer</p>
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

              <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Topic</p>
                  <input value={topicInput} onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    placeholder="e.g. React Hooks, World War II, Quantum Physics..."
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {QUICK_TOPICS.map(t => (
                      <button key={t} onClick={() => setTopicInput(t)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${topicInput === t ? 'border-blue-500/60 bg-blue-500/10 text-blue-300' : 'border-white/8 text-slate-500 hover:border-blue-500/30 hover:text-blue-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Questions</p>
                  <div className="flex gap-2">
                    {COUNTS.map(c => (
                      <button key={c} onClick={() => setCount(c)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${count === c ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' : 'border-white/10 text-slate-400 hover:border-blue-500/40 hover:text-white'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 text-right">≈ {Math.ceil(count * 1.2)} minutes</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Difficulty</p>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map(d => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${difficulty === d ? 'bg-blue-600 text-white border-blue-600' : 'border-white/10 text-slate-400 hover:border-blue-500/40 hover:text-white'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleGenerate} disabled={!topicInput.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" /> Generate Quiz
                </button>
              </div>
            </motion.div>
          )}

          {/* GENERATING */}
          {step === 'generating' && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">Creating your quiz...</p>
                <p className="text-sm text-slate-500 mt-1">Generating {count} questions about "{topicInput}"</p>
              </div>
            </motion.div>
          )}

          {/* QUIZ */}
          {step === 'quiz' && quiz && currentQuestion && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="space-y-4">

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-2">
                  <span>Question <span className="text-white font-semibold">{currentQ + 1}</span> of {quiz.questions.length}</span>
                  <span className="font-semibold text-blue-400">{quiz.topic}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ boxShadow: '0 0 10px rgba(59,130,246,0.5)' }} />
                </div>
              </div>

              {/* Question */}
              <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-600 font-semibold">{currentQuestion.topic}</span>
                </div>
                <p className="text-base font-semibold leading-relaxed text-white">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, i) => (
                  <OptionButton key={i} option={option} index={i}
                    selected={selectedOption === i}
                    correct={i === currentQuestion.correctAnswer}
                    revealed={selectedOption !== null}
                    onSelect={() => handleAnswer(i)}
                  />
                ))}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && currentQuestion.explanation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className={`rounded-xl p-4 border text-sm leading-relaxed ${isCorrect ? 'bg-emerald-500/8 border-emerald-500/25 text-emerald-200' : 'bg-red-500/8 border-red-500/25 text-red-200'}`}>
                    <p className="font-bold mb-1 text-xs uppercase tracking-wider">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
                    {currentQuestion.explanation}
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedOption !== null && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={nextQuestion}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                  {currentQ < quiz.questions.length - 1 ? <><ChevronRight className="w-5 h-5" /> Next Question</> : <><Trophy className="w-5 h-5" /> See Results</>}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* RESULTS */}
          {step === 'results' && result && quiz && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Score hero */}
              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/30 to-cyan-900/10 p-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">Quiz Complete</p>
                <div className="text-7xl font-black mb-1"
                  style={{ background: 'linear-gradient(135deg, #60a5fa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {result.percentage}%
                </div>
                <p className="text-slate-400 text-sm mb-5">{result.score} of {result.total} correct · {quiz.topic}</p>
                <div className="flex justify-center gap-10">
                  <div><p className="text-2xl font-bold text-emerald-400">{result.score}</p><p className="text-xs text-slate-500 mt-0.5">Correct</p></div>
                  <div><p className="text-2xl font-bold text-red-400">{result.total - result.score}</p><p className="text-xs text-slate-500 mt-0.5">Wrong</p></div>
                </div>
              </div>

              {result.weakTopics.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Focus Areas (Weak)</p>
                  <div className="flex flex-wrap gap-2">{result.weakTopics.map(t => <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20">{t}</span>)}</div>
                </div>
              )}

              {result.strongTopics.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strong Topics</p>
                  <div className="flex flex-wrap gap-2">{result.strongTopics.map(t => <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{t}</span>)}</div>
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Recommendations</p>
                  {result.recommendations.map((r, i) => (
                    <p key={i} className="text-sm text-slate-400 flex gap-2"><ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />{r}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setCurrentQ(0); setUserAnswers([]); setSelectedOption(null); setShowExplanation(false); setResult(null); setStep('quiz'); }}
                  className="flex-1 py-4 rounded-2xl border border-white/10 font-bold text-slate-300 hover:bg-white/5 transition-all">
                  Retry Same Quiz
                </button>
                <button onClick={reset}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> New Topic
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
