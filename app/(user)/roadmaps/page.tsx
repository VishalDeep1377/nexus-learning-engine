'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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

      toast.success(!isCompleted ? "Step marked as completed!" : "Step marked as incomplete");
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
    <div className="p-6 min-h-screen" style={{ background: "linear-gradient(135deg, #06080f 0%, #0a0d1a 50%, #0d0a1a 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 mt-6">
          <h1 className="text-4xl font-black tracking-tight text-white">Your Roadmaps</h1>
          {totalRoadmaps < 3 ? (
            <button
              onClick={() => router.push("/learning-path")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", boxShadow: "0 8px 32px rgba(6,182,212,0.3)" }}
            >
              <span>+</span>
              Create New Roadmap
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl text-[13px] text-gray-400 bg-white/5 border border-white/10 uppercase tracking-wider font-semibold">
              Max 3 Roadmaps Limit Reached
            </div>
          )}
        </div>

        {roadmaps.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
             <div className="text-6xl mb-4 text-gray-600">🗺️</div>
             <h2 className="text-2xl font-bold text-gray-300 mb-2">No Roadmaps Yet</h2>
             <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start your learning journey by creating a highly personalized learning path using AI.</p>
             <button
              onClick={() => router.push("/learning-path")}
              className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all duration-200 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Create First Roadmap
            </button>
          </div>
        ) : (
          <ul className="space-y-6">
            {roadmaps.map((roadmap) => (
              <li 
                key={roadmap?._id} 
                className="relative p-6 rounded-3xl overflow-hidden group"
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
                  className="absolute top-6 right-6 p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all z-10 disabled:opacity-50"
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

                <h2 className="text-3xl font-black mb-6 pr-12 text-white">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {roadmap?.title}
                  </span> Roadmap
                </h2>
                
                {/* Completion Progress */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Progress</h3>
                    <div className="text-[14px] font-bold text-indigo-300">
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
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Milestones</h3>
                    <div className="space-y-3">
                      {roadmap?.steps?.map((step, index) => {
                        const completed = isStepCompleted(roadmap, index);
                        return (
                          <div 
                            key={index} 
                            className="flex items-start gap-4 p-3 rounded-xl transition-all"
                            style={{ background: completed ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)" }}
                          >
                            <label className="relative flex items-center cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={completed}
                                onChange={() => handleStepCompletion(roadmap._id!, index, completed)}
                              />
                              <div className="w-5 h-5 border-2 rounded border-gray-600 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                                {completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </div>
                            </label>
                            <span className={`text-[15px] leading-relaxed transition-all ${completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Resources</h3>
                    <ul className="flex flex-col gap-2">
                      {roadmap?.resources.map((resource: string, index: number) => (
                        <li key={index}>
                          <Link 
                            href={resource.startsWith('http') ? resource : `https://${resource}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg text-[13px] font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors break-all"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span className="truncate">{resource}</span>
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
