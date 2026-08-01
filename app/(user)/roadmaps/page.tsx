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
  const { userData } = useUserStore();
  const totalRoadmaps = userData?.roadmaps?.length;
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
    return <div className="p-6 min-h-screen flex items-center justify-center">Loading roadmaps...</div>;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center">Roadmaps</h1>
      {totalRoadmaps < 3 && (
        <button className='bg-green-700 p-2' onClick={() => router.push("/learning-path")}>Add Roadmap</button>
      )}

      <ul className="space-y-4">
        {roadmaps.map((roadmap) => (
          <li key={roadmap?._id} className="bg-white dark:bg-black dark:text-white text-black p-4 rounded-lg shadow-md">
            <h2 className="text-2xl md:text-4xl text-center font-bold mb-2">{roadmap?.title} Roadmap</h2>
            <div>
              <h3 className="text-lg mb-2">Steps:</h3>
              <div className="space-y-2 pl-5">
                {roadmap?.steps?.map((step, index) => {
                  const completed = isStepCompleted(roadmap, index);
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        aria-label={`Step ${index + 1}: ${step}`}
                        checked={completed}
                        onChange={() => handleStepCompletion(roadmap._id!, index, completed)}
                      />
                      <span className={completed ? 'line-through text-gray-500' : ''}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion Progress */}
            <div className="mt-3">
              <h3 className="text-lg mb-2">Completion Progress:</h3>
              <div className="h-2 bg-gray-300 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${calculateCompletionPercentage(roadmap)}%`
                  }}
                ></div>
              </div>
              <div className="mt-2 text-center text-gray-500">
                {Math.round(calculateCompletionPercentage(roadmap))}% Complete
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-lg mb-2">Resources:</h3>
              <ul className="list-disc list-inside pl-5">
                {roadmap?.resources.map((resource: string, index: number) => (
                  <li key={index} className='text-blue-500'>
                    <Link href={resource}>
                      <span className='text-blue-500'>{resource}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Roadmaps;
