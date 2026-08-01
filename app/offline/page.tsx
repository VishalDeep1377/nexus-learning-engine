'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  // Check online status and set up listeners
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        // If we're back online, try to go back to the homepage after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Clean up
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [router]);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      // Try to reload the last page
      router.refresh();
      // If that doesn't work, reload the whole page
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <svg 
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">You're Offline</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          {isOnline 
            ? "You're back online! Redirecting you to the homepage..." 
            : "Please check your internet connection and try again."}
        </p>
        <button 
          onClick={handleRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 