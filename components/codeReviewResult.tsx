"use client";
import { useState } from "react";
import React from "react";
import { ChevronDown, ChevronUp, Star, AlertCircle, CheckCircle, Code } from "lucide-react";

function CodeReviewResult({ result }: { result: any }) {
  const [showOutput, setShowOutput] = useState(false);

  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="w-5 h-5 text-yellow-400" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    const emptyStars = 10 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 dark:text-gray-600" />);
    }
    
    return stars;
  };

  return (
    <div className="w-full bg-white dark:bg-[#212121] text-black dark:text-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Code Review Result</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Detailed analysis and suggestions for your code
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Rating Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quality Rating</h3>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {result.rating ? `${result.rating}/10` : "N/A"}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {result.rating ? renderRating(result.rating) : "No rating available"}
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Output</h3>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {result.output || "No output"}
            </pre>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowOutput(!showOutput)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          <span className="font-medium">
            {showOutput ? "Hide Details" : "Show Details"}
          </span>
          {showOutput ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {/* Detailed Review Sections */}
        {showOutput && (
          <div className="space-y-6 pt-2">
            {/* Error Section */}
            {result.error && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Errors</h3>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              </div>
            )}

            {/* Corrected Code Section */}
            {result.correctedCode && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Corrected Code</h3>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {result.correctedCode}
                  </pre>
                </div>
              </div>
            )}

            {/* Review Section */}
            {result.review && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-500">Detailed Review</h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-800 dark:text-gray-400 prose dark:prose-invert max-w-none">
                    {result.review}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeReviewResult;
