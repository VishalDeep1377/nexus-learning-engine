'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, RotateCcw, Send, Loader2, RefreshCw, CheckCircle, ChevronRight, Sparkles, Radio, Pause, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SpeechQuestion, SpeechEvaluation } from '@/lib/agents/self-assessment/speech-agent';

const SUGGESTED_QUESTIONS = [
  'Describe a time you solved a difficult problem.',
  'What are your greatest strengths?',
  'Why should we hire you for this role?',
  'Where do you see yourself in five years?',
  'Tell me about a project you are most proud of.',
];

type Step = 'prompt' | 'recording' | 'typing' | 'processing' | 'results';

function ScoreBar({ label, value, color = 'bg-pink-500' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{value}<span className="text-slate-600">/10</span></span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value * 10}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className={`h-full rounded-full ${color}`}
          style={{ boxShadow: value >= 7 ? `0 0 8px currentColor` : 'none' }} />
      </div>
    </div>
  );
}

function SoundWaves() {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
        <div key={i} className="w-1 rounded-full bg-pink-400"
          style={{ height: `${h * 8}px`, animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

export default function SpeechPracticePage() {
  const [question, setQuestion] = useState<SpeechQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [step, setStep] = useState<Step>('prompt');
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<SpeechEvaluation | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTextRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SR);
    }
    fetchQuestion();
  }, []);

  const fetchQuestion = useCallback(async () => {
    setLoadingQuestion(true);
    setStep('prompt'); setTranscript(''); setEvaluation(null);
    try {
      const res = await fetch('/api/self-assessment/speech/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.success) setQuestion(data.data);
    } catch { toast.error('Failed to load question'); }
    finally { setLoadingQuestion(false); }
  }, []);

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Mic not supported. Type instead.'); setStep('typing'); return; }
    
    // Reset our memory when officially starting a brand new recording
    finalTextRef.current = '';
    setTranscript('');
    
    const recognition = new SR();
    recognition.continuous = true; 
    recognition.interimResults = true; 
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTextRef.current += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTextRef.current + interim);
    };
    
    recognition.onerror = (event: any) => {
      // Aborted typically triggers natively when we call .stop() for pause, so ignore it softly
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed') { toast.error('Mic denied. Please type instead.'); setStep('typing'); }
      stopRecording();
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      setIsRecording(true); 
      setIsPaused(false);
      setStep('recording'); 
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (e) {}
    recognitionRef.current = null;
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const pauseRecording = useCallback(() => {
    try {
      recognitionRef.current?.stop();
      // Nullify so the old instance can't fire stale events after stop
      recognitionRef.current = null;
    } catch (e) {}
    setIsPaused(true);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resumeRecording = useCallback(() => {
    // Create a fresh recognition instance to avoid duplicate onresult events
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTextRef.current += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTextRef.current + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      // Inline stop to avoid forward-reference to stopRecording
      if (event.error === 'not-allowed') {
        try { recognition.stop(); } catch (e) {}
        recognitionRef.current = null;
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}
    setIsPaused(false);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!transcript.trim() || transcript.trim().length < 20) { toast.error('Please give a longer response.'); return; }
    stopRecording(); setStep('processing');
    try {
      const res = await fetch('/api/self-assessment/speech/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question?.question, transcript, category: question?.category }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEvaluation(data.data); setStep('results');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Evaluation failed');
      setStep(speechSupported ? 'recording' : 'typing');
    }
  }, [transcript, question, stopRecording, speechSupported]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const scoreColors = ['bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500', 'bg-violet-500', 'bg-indigo-500'];

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-pink-700/20 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-20 w-72 h-72 rounded-full bg-rose-600/15 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-600 to-rose-600 shadow-lg shadow-pink-500/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Communication Lab</h1>
            <p className="text-sm text-slate-500">AI-powered speech coaching for placement interviews</p>
          </div>
          {step === 'results' && (
            <button onClick={fetchQuestion} className="ml-auto flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
              <RotateCcw className="w-3.5 h-3.5" /> New
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* PROMPT + RECORDING + TYPING */}
          {(step === 'prompt' || step === 'recording' || step === 'typing') && question && !loadingQuestion && (
            <motion.div key="prompt-area" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* Question card */}
              <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Interview Prompt</p>
                  <button onClick={fetchQuestion} className="flex items-center gap-1 text-xs text-slate-500 hover:text-pink-400 transition-colors">
                    <RefreshCw className="w-3 h-3" /> New
                  </button>
                </div>
                <p className="text-lg font-semibold text-white leading-relaxed">{question.question}</p>
                {question.tips?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {question.tips.map((tip, i) => (
                      <span key={i} className="text-xs bg-pink-500/10 text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/20">{tip}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested questions */}
              {step === 'prompt' && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Or try a classic question</p>
                  <div className="space-y-1">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button key={q} onClick={() => setQuestion({ question: q, category: 'behavioral', tips: ['Use STAR method', 'Be specific'] })}
                        className="w-full text-left text-sm text-slate-500 hover:text-pink-400 transition-colors flex items-center gap-2 py-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-pink-600 shrink-0" /> {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recording UI */}
              {step === 'recording' && (
                <div className="rounded-2xl border border-pink-500/30 bg-pink-500/5 p-8 text-center space-y-5">
                  <div className="relative inline-flex items-center justify-center">
                    {!isPaused && (
                      <>
                        <div className="absolute w-24 h-24 rounded-full bg-pink-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute w-20 h-20 rounded-full bg-pink-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                      </>
                    )}
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl ${isPaused ? 'bg-slate-800 border border-slate-600 shadow-none' : 'bg-gradient-to-br from-pink-600 to-rose-600 shadow-pink-500/40'}`}>
                      <Mic className={`w-7 h-7 ${isPaused ? 'text-slate-400' : 'text-white'}`} />
                    </div>
                  </div>
                  <div>
                    <p className={`text-3xl font-mono font-black ${isPaused ? 'text-slate-500' : 'text-white'}`}>
                      {fmt(timer)}
                    </p>
                    {!isPaused && <SoundWaves />}
                    {isPaused && <p className="text-xs text-pink-400 mt-2 font-semibold uppercase tracking-widest">PAUSED</p>}
                  </div>
                  {transcript && (
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 text-left">
                      <p className="text-sm text-slate-400 italic leading-relaxed">"{transcript}"</p>
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    {isPaused ? (
                      <button onClick={resumeRecording} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/30">
                        <Play className="w-4 h-4" /> Resume
                      </button>
                    ) : (
                      <button onClick={pauseRecording} className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors border border-white/10">
                        <Pause className="w-4 h-4" /> Pause
                      </button>
                    )}
                    <button onClick={stopRecording} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-500/30">
                      <MicOff className="w-4 h-4" /> Stop
                    </button>
                    {transcript.trim().length >= 20 && (
                      <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl border border-white/15 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/5 transition-colors">
                        <Send className="w-4 h-4" /> Evaluate
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Typing UI */}
              {step === 'typing' && (
                <div className="space-y-3">
                  <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 resize-none transition-all"
                  />
                  <button onClick={handleSubmit} disabled={transcript.trim().length < 20}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 transition-all shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" /> Evaluate My Response
                  </button>
                </div>
              )}

              {/* Start buttons */}
              {step === 'prompt' && (
                <div className="flex gap-3">
                  {speechSupported && (
                    <button onClick={startRecording}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:from-pink-500 hover:to-rose-500 transition-all shadow-xl shadow-pink-500/30">
                      <Radio className="w-5 h-5" /> Start Recording
                    </button>
                  )}
                  <button onClick={() => setStep('typing')}
                    className={`${speechSupported ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 font-bold text-slate-300 hover:bg-white/5 transition-all`}>
                    ✎ Type Instead
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* LOADING */}
          {(step === 'processing' || loadingQuestion) && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center shadow-2xl shadow-pink-500/30">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">
                  {loadingQuestion ? 'Loading question...' : 'Analyzing your response...'}
                </p>
                <p className="text-sm text-slate-500 mt-1">AI is evaluating clarity, structure, and STAR method</p>
              </div>
            </motion.div>
          )}

          {/* RESULTS */}
          {step === 'results' && evaluation && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Overall score */}
              <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-900/20 to-rose-900/10 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">AI Evaluation</h2>
                  <div className="text-right">
                    <p className="text-4xl font-black"
                      style={{ background: 'linear-gradient(135deg, #f472b6, #fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {evaluation.overallScore}
                    </p>
                    <p className="text-xs text-slate-500">out of 10</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Relevance', val: evaluation.relevance, color: 'bg-pink-500' },
                    { label: 'Structure', val: evaluation.structure, color: 'bg-rose-500' },
                    { label: 'Clarity', val: evaluation.clarity, color: 'bg-fuchsia-500' },
                    { label: 'Conciseness', val: evaluation.conciseness, color: 'bg-purple-500' },
                    { label: 'Grammar', val: evaluation.grammar, color: 'bg-violet-500' },
                    { label: 'Interview Quality', val: evaluation.interviewQuality, color: 'bg-indigo-500' },
                  ].map(({ label, val, color }) => <ScoreBar key={label} label={label} value={val} color={color} />)}
                </div>
              </div>

              {/* STAR Analysis */}
              {evaluation.starAnalysis && (
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400 mb-4">STAR Framework Analysis</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(evaluation.starAnalysis).filter(([k]) => k !== 'score').map(([key, val]) => (
                      <div key={key} className="bg-black/30 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] font-bold uppercase text-slate-600 mb-1">{key}</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-3">Strengths</p>
                  <ul className="space-y-2">{evaluation.strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm text-emerald-200/80"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{s}</li>)}</ul>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-3">Suggestions</p>
                  <ul className="space-y-2">{evaluation.suggestions.map((s, i) => <li key={i} className="flex gap-2 text-sm text-amber-200/80"><ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />{s}</li>)}</ul>
                </div>
              </div>

              {evaluation.improvedAnswer && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Model Answer</p>
                  <p className="text-sm text-blue-200/80 leading-relaxed italic">"{evaluation.improvedAnswer}"</p>
                </div>
              )}

              <button onClick={fetchQuestion}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:from-pink-500 hover:to-rose-500 transition-all shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> Practice Another Question
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes pulse {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
