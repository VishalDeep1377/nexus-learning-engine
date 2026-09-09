'use client'

import JobCard from "@/components/JobCard";
import { useState } from "react";
import toast from "react-hot-toast";
import { Search, MapPin, Briefcase, Loader2, Sparkles } from "lucide-react";

interface JobListing {
    position: string;
    company: string;
    location: string;
    date: string;
    salary: string;
    jobUrl: string;
    companyLogo: string;
    agoTime: string;
}

const JobSearchTest = () => {
    const [searchResults, setSearchResults] = useState<JobListing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (formData: FormData) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/jobs', {
                method: 'POST',
                body: JSON.stringify({
                    keyword: formData.get('keyword'),
                    location: formData.get('location'),
                    experienceLevel: formData.get('experienceLevel'),
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch jobs');
            }

            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to fetch jobs. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-12 relative overflow-hidden bg-[#06080f]">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-6 shadow-lg shadow-blue-500/20">
                        <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 tracking-tight">
                        Discover Your Next Role
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
                        Search curated tech opportunities matching your skills and experience. Let's build your career.
                    </p>
                </div>

                {/* Search Dashboard */}
                <div className="max-w-5xl mx-auto mb-16 p-1.5 rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-transparent shadow-[0_32px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            await handleSubmit(formData);
                        }}
                        className="flex flex-col md:flex-row gap-3 bg-[#0a0d14]/80 p-4 rounded-[1.75rem] border border-white/5"
                    >
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                name="keyword"
                                placeholder="Job title (e.g. Software Engineer)"
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-[15px]"
                                required
                            />
                        </div>

                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <MapPin className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                name="location"
                                placeholder="Location (e.g. Remote, USA)"
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all text-[15px]"
                                required
                            />
                        </div>

                        <div className="relative md:w-48 group">
                            <select
                                name="experienceLevel"
                                aria-label="Experience Level"
                                className="w-full pl-4 pr-10 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-gray-300 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all appearance-none cursor-pointer text-[15px]"
                                required
                                defaultValue=""
                            >
                                <option value="" disabled className="bg-gray-900 text-gray-500">Select Level</option>
                                <option value="entry level" className="bg-gray-800 text-white">Entry Level</option>
                                <option value="mid level" className="bg-gray-800 text-white">Mid Level</option>
                                <option value="senior level" className="bg-gray-800 text-white">Senior Level</option>
                            </select>
                            {/* Custom caret indicator since appearance is none */}
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl transition-all font-bold shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Search Jobs
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results Grid */}
                <div className="max-w-7xl mx-auto">
                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map((job, index) => (
                                <JobCard key={index} {...job} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-24 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-md max-w-4xl mx-auto">
                            <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-300 mb-3">No Jobs Found Yet</h2>
                            <p className="text-gray-500 max-w-sm mx-auto text-[15px]">
                                Try adjusting your keywords, testing different locations, or expanding your experience level.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default JobSearchTest;