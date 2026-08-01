'use client'
import React, { useState } from 'react'
import { Code2, Send, FileCode, ChevronDown } from 'lucide-react';
import axios from 'axios'
import CodeReviewResult from '@/components/codeReviewResult'
import { BasicEditor } from '@/components/BasicEditor'
import LoadingSkeleton from '@/components/Skeleton/LoadingSkeleton'
import toast from 'react-hot-toast';

// Sample languages with their display names and values
const LANGUAGES = [
    { display: 'Java', value: 'java' },
    { display: 'Python', value: 'python' },
    { display: 'C++', value: 'cpp' },
    { display: 'JavaScript', value: 'javascript' },
    { display: 'Go', value: 'go' },
    { display: 'SQL', value: 'sql' }
];

function CodeReviewer() {
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("");
    const [resultData, setResultData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
    }

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        setIsDropdownOpen(false);
    }

    const handleReview = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!code || !language) {
            toast.error("Please enter code and select a language");
            return;
        }
        try {
            setLoading(true);
            const response = await axios.post('/api/code-reviewer', { language, code });
            console.log("API Response:", response.data);
            setResultData(response.data);
        } catch (error) {
            console.error("Error during code review:", error);
            toast.error("An error occurred during code review");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
                <LoadingSkeleton />
            </div>
        )
    }

    return (
        <main className='min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white'>
            <div className="container mx-auto px-4 md:py-8 py-2">
                <div className="flex items-center justify-center md:gap-3 gap-2 text-center mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Code2 className=" h-3 w-3 md:h-8 md:w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h1 className="md:text-3xl text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Code Reviewer
                    </h1>
                </div>

                <p className="mt-3 text-center text-sm md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                    Get instant feedback on your code quality and suggestions for improvement
                </p>

                <div className="w-full flex flex-col  lg:flex-row gap-2 md:gap-8 justify-center items-start">
                    <form className="w-full lg:w-3/5 bg-white dark:bg-[#212121] rounded-xl shadow-xl overflow-hidden" onSubmit={handleReview}>
                        <div className="md:p-3 p-2 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-auto">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full md:w-48 px-4 py-1 md:py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="flex items-center">
                                        <FileCode className="w-5 h-5  text-gray-500 dark:text-gray-400" />
                                        {language ? LANGUAGES.find(l => l.value === language)?.display || language : 'Select Language'}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute z-10 w-full md:w-48 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                        <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                                            {LANGUAGES.map((lang) => (
                                                <li key={lang.value}>
                                                    <button
                                                        type="button"
                                                        className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        onClick={() => handleLanguageChange(lang.value)}
                                                    >
                                                        {lang.display}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="flex items-center justify-center md:px-6 px-2 py-1 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 w-full md:w-auto"
                                disabled={!code || !language}
                            >
                                <Send className="md:w-4 md:h-4 w-2 h-3 mr-2" />
                                Review Code
                            </button>
                        </div>

                        <div className="p-0">
                            <BasicEditor value={code} onChange={handleCodeChange} language={language} />
                        </div>
                    </form>

                    {resultData && (
                        <div className="w-full lg:w-2/5 sticky top-8">
                            <CodeReviewResult result={resultData} />
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}

export default CodeReviewer;

