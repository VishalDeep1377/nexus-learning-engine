'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface Roadmap {
  _id?: string;
  title?: string;
  steps?: string[];
  resources: string[];
  completedSteps?: {
    userId: string;
    stepIndices: number[];
  }[];
}

function Roadmaps() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { userData, setUserData } = useUserStore();
  const totalRoadmaps = roadmaps.length;
  const router = useRouter();

  useEffect(() => {
    getAllRoadmaps();
  }, []);

  const getAllRoadmaps = async () => {
    try {
      setLoading(true);
      const response = await axios.get("api/roadmaps");
      console.log("Your Roadmaps: ", response.data);
      const data = response.data.roadmaps;
      setRoadmaps(data);
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      toast.error("Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  };

  const handleStepCompletion = async (roadmapId: string, stepIndex: number, isCompleted: boolean) => {
    try {
      const roadmap = roadmaps.find(r => r._id === roadmapId);
      if (roadmap && !isCompleted) {
        const userProgress = roadmap.completedSteps?.find(progress => progress.userId === userData?._id);
        const currentCompleteCount = userProgress?.stepIndices.length || 0;
        const totalSteps = roadmap.steps?.length || 0;
        
        // If this is the *last* step to be checked off, fire confetti!
        if (currentCompleteCount + 1 === totalSteps) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b']
          });
        }
      }

      // Optimistically update UI
      setRoadmaps(prevRoadmaps =>
        prevRoadmaps.map(roadmap =>
          roadmap._id === roadmapId
            ? {
              ...roadmap,
              completedSteps: updateCompletedSteps(roadmap, stepIndex, !isCompleted)
            }
            : roadmap
        )
      );

      // Send update to server
      const response = await axios.patch("api/roadmaps", {
        roadmapId,
        stepIndex,
        completed: !isCompleted
      });

      // If server update fails, revert UI
      if (!response.data) {
        throw new Error("Failed to update progress");
      }

      // ── Gamification toasts ──────────────────────────────────────────────────
      const gam = response.data.gamification;
      if (gam && !isCompleted) {
        // XP toast
        toast.success(`+50 XP earned! Total: ${gam.xp} XP (Lvl ${gam.level})`, { icon: '⚡' });
        // Streak toast (only show when streak increments — i.e., it's > 1)
        if (gam.streak > 1) {
          setTimeout(() => toast(`🔥 ${gam.streak} Day Streak! Keep it up!`, { icon: '🔥' }), 600);
        }
        // Badge toast
        if (gam.newBadge) {
          setTimeout(() => toast.success(`🏆 Badge Unlocked: "${gam.newBadge}"!`, { duration: 5000 }), 1200);
        }
        // Refresh user store so navbar/profile updates live
        setUserData();
      } else {
        toast.success(!isCompleted ? "Step marked as completed!" : "Step marked as incomplete");
      }
    } catch (error) {
      console.error("Error updating roadmap progress:", error);
      toast.error("Failed to update progress");
      // Revert optimistic update
      getAllRoadmaps();
    }
  };


  const handleDeleteRoadmap = async (roadmapId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this roadmap?")) return;
    
    try {
      setDeletingId(roadmapId);
      await axios.delete(`api/roadmaps?roadmapId=${roadmapId}`);
      
      // Optimistically remove from UI
      setRoadmaps(prev => prev.filter(r => r._id !== roadmapId));
      
      // Refresh user store data so they can create a new route if limit freed up
      if (setUserData) {
        setUserData(); 
      }

      toast.success("Roadmap deleted successfully");
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      toast.error("Failed to delete roadmap");
    } finally {
      setDeletingId(null);
    }
  };

  // Helper function to update the completedSteps array
  const updateCompletedSteps = (roadmap: Roadmap, stepIndex: number, completed: boolean) => {
    const userId = userData?._id;
    if (!userId || !roadmap.completedSteps) {
      return [{ userId, stepIndices: completed ? [stepIndex] : [] }];
    }

    const userProgress = roadmap.completedSteps.find(progress => progress.userId === userId);
    
    if (!userProgress) {
      return [...(roadmap.completedSteps || []), { 
        userId, 
        stepIndices: completed ? [stepIndex] : [] 
      }];
    }

    return roadmap.completedSteps.map(progress => {
      if (progress.userId === userId) {
        return {
          ...progress,
          stepIndices: completed
            ? [...progress.stepIndices, stepIndex]
            : progress.stepIndices.filter(idx => idx !== stepIndex)
        };
      }
      return progress;
    });
  };

  // Check if a step is completed
  const isStepCompleted = (roadmap: Roadmap, stepIndex: number) => {
    if (!roadmap.completedSteps || !userData?._id) return false;
    
    const userProgress = roadmap.completedSteps.find(
      progress => progress.userId === userData._id
    );
    
    return userProgress ? userProgress.stepIndices.includes(stepIndex) : false;
  };

  const calculateCompletionPercentage = (roadmap: Roadmap) => {
    if (!roadmap.steps || !roadmap.completedSteps || !userData?._id) return 0;
    
    const userProgress = roadmap.completedSteps.find(
      progress => progress.userId === userData._id
    );
    
    if (!userProgress) return 0;
    
    return (userProgress.stepIndices.length / roadmap.steps.length) * 100;
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-6 min-h-screen w-full overflow-x-hidden" style={{ background: "linear-gradient(135deg, #06080f 0%, #0a0d1a 50%, #0d0a1a 100%)" }}>
      <div className="max-w-4xl mx-auto w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 mt-2 sm:mt-6">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">Your Roadmaps</h1>
          {totalRoadmaps < 3 ? (
            <button
              onClick={() => router.push("/learning-path")}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", boxShadow: "0 8px 32px rgba(6,182,212,0.3)" }}
            >
              <span>+</span>
              Create New Roadmap
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl text-[13px] text-gray-400 bg-white/5 border border-white/10 uppercase tracking-wider font-semibold text-center">
              Max 3 Roadmaps Limit Reached
            </div>
          )}
        </div>

        {/* Gamification Stats Summary Bar (Mobile & Desktop) */}
        {userData && (
          <div className="mb-6 sm:mb-8 grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <span className="text-base sm:text-xl">⚡</span>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] uppercase font-extrabold text-indigo-300 tracking-wider truncate">Total XP</p>
                <p className="text-xs sm:text-base font-black text-white truncate">{userData.xp ?? 0} <span className="text-[10px] sm:text-xs font-semibold text-indigo-400">Lv{userData.level ?? 1}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-xl border border-orange-500/30 bg-orange-500/10">
              <span className="text-base sm:text-xl">🔥</span>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] uppercase font-extrabold text-orange-300 tracking-wider truncate">Streak</p>
                <p className="text-xs sm:text-base font-black text-orange-400 truncate">{userData.streak?.current ?? 0}d</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
              <span className="text-base sm:text-xl">🏆</span>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[11px] uppercase font-extrabold text-amber-300 tracking-wider truncate">Badges</p>
                <p className="text-xs sm:text-base font-black text-amber-300 truncate">{userData.badges?.length ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {roadmaps.length === 0 ? (
          <div className="text-center py-16 sm:py-20 px-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
             <div className="text-6xl mb-4 text-gray-600">🗺️</div>
             <h2 className="text-2xl font-bold text-gray-300 mb-2">No Roadmaps Yet</h2>
             <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Start your learning journey by creating a highly personalized learning path using AI.</p>
             <button
              onClick={() => router.push("/learning-path")}
              className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Create First Roadmap
            </button>
          </div>
        ) : (
          <ul className="space-y-6 w-full min-w-0">
            {roadmaps.map((roadmap) => (
              <li 
                key={roadmap?._id} 
                className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl overflow-hidden group w-full min-w-0"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
                }}
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteRoadmap(roadmap._id!)}
                  disabled={deletingId === roadmap._id}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all z-10 disabled:opacity-50"
                  title="Delete Roadmap"
                >
                  {deletingId === roadmap._id ? (
                     <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                <h2 className="text-xl sm:text-3xl font-black mb-4 sm:mb-6 pr-10 sm:pr-12 text-white leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {roadmap?.title}
                  </span> Roadmap
                </h2>
                
                {/* Completion Progress (Gamified) */}
                <div className="mb-6 sm:mb-8 w-full min-w-0">
                  {Math.round(calculateCompletionPercentage(roadmap)) === 100 ? (
                    <div className="flex flex-row items-center gap-3 sm:gap-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex shrink-0 items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-black text-emerald-400 truncate">Mastery Achieved! 🎉</h3>
                        <p className="text-[11px] sm:text-[13px] text-emerald-200/70 font-medium leading-snug">You have fully completed this roadmap. Excellent work!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-end mb-2">
                        <h3 className="text-[12px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-wider">Progress</h3>
                        <div className="text-[13px] sm:text-[14px] font-bold text-indigo-300">
                          {Math.round(calculateCompletionPercentage(roadmap))}% Complete
                        </div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${calculateCompletionPercentage(roadmap)}%`,
                            background: "linear-gradient(90deg, #6366f1, #06b6d4)",
                            boxShadow: "0 0 10px rgba(6,182,212,0.5)"
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>

                {/* 50% Perk Unlock Panel */}
                {(() => {
                  const pct = Math.round(calculateCompletionPercentage(roadmap));
                  if (pct >= 50 && pct < 100) {
                    return (
                      <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 sm:p-5 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.08)]">
                        <div className="absolute -right-6 -top-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl" />
                        <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-orange-500/10 rounded-full blur-xl" />
                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                            <span className="text-xl">🔓</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Perk Unlocked — Halfway There!</p>
                            <p className="text-[12px] sm:text-[13px] text-gray-300 leading-snug">
                              You've crossed 50%! Launch a custom <span className="font-bold text-amber-300">{roadmap.title}</span> Hackathon project powered by Zeno AI.
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/hackathons?topic=${encodeURIComponent(roadmap.title || '')}`)}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 6px 20px rgba(245,158,11,0.35)" }}
                          >
                            Launch Project
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid md:grid-cols-3 gap-6 sm:gap-8 w-full min-w-0">
                  <div className="md:col-span-2 w-full min-w-0">
                    <h3 className="text-[12px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Milestones</h3>
                    <div className="space-y-2.5 sm:space-y-3 w-full min-w-0">
                      {roadmap?.steps?.map((step, index) => {
                        const completed = isStepCompleted(roadmap, index);
                        return (
                          <div 
                            key={index} 
                            className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-all w-full min-w-0"
                            style={{ background: completed ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)" }}
                          >
                            <label className="relative flex items-center cursor-pointer pt-0.5 shrink-0">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={completed}
                                onChange={() => handleStepCompletion(roadmap._id!, index, completed)}
                              />
                              <div className="w-5 h-5 border-2 rounded border-gray-600 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center shrink-0">
                                {completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </div>
                            </label>
                            <span className={`flex-1 min-w-0 break-words text-[13px] sm:text-[15px] leading-relaxed transition-all ${completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full min-w-0">
                    <h3 className="text-[12px] sm:text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Resources</h3>
                    <ul className="flex flex-col gap-2 w-full min-w-0">
                      {roadmap?.resources.map((resource: string, index: number) => (
                        <li key={index} className="w-full min-w-0">
                          <Link 
                            href={resource.startsWith('http') ? resource : `https://${resource}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors w-full min-w-0"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span className="flex-1 min-w-0 truncate">{resource}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Roadmaps;
