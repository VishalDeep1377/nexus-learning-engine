'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Question,UserAnswer } from '@/questiontypes';

//mock questions
const mockQuestions: Question[] = [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"]
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"]
    },
    {
      id: 3,
      question: "What is the largest mammal?",
      options: ["African Elephant", "Blue Whale", "Giraffe", "White Rhinoceros"]
    }
  ];

  function TestComponent() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  
    const handleOptionSelect = (selectedOption: string) => {
      setUserAnswers(prev => {
        const currentQuestion = mockQuestions[currentQuestionIndex];
        const existingAnswerIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
        
        if (existingAnswerIndex !== -1) {
          const newAnswers = [...prev];
          newAnswers[existingAnswerIndex] = {
            questionId: currentQuestion.id,
            selectedOption
          };
          return newAnswers;
        }
        return [...prev, {
            questionId: currentQuestion.id,
            selectedOption
          }];
        });
      };

      const handlePrevious = () => {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      };
      const handleNext = () => {
        setCurrentQuestionIndex(prev => Math.min(mockQuestions.length - 1, prev + 1));
      };
    
      const handleSubmit = () => {
        console.log('Test submitted:', userAnswers);
        // Here you would typically send the answers to your backend
        alert('Test submitted successfully!');
      };
    
      const currentQuestion = mockQuestions[currentQuestionIndex];
      const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion.id);
      return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              {/* Progress bar */}
              <div className="mb-8">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / mockQuestions.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestionIndex + 1} of {mockQuestions.length}
            </p>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option:string, index:number) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    currentAnswer?.selectedOption === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center px-4 py-2 rounded-md ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            ><ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>

          {currentQuestionIndex === mockQuestions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Send className="w-5 h-5 mr-2" />
              Submit Test
            </button>
             ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  export default TestComponent;
  