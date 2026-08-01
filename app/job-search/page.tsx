'use client'

import JobCard from "@/components/JobCard";
import { useState } from "react";
import toast from "react-hot-toast";

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        await handleSubmit(formData);
                    }}
                    className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-3xl mx-auto mb-8"
                >
                    <input
                        type="text"
                        name="keyword"
                        placeholder="Job title (e.g. Software Engineer)"
                        className="border p-2 rounded-md flex-1 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="text"
                        name="location"
                        placeholder="Location (e.g. India, USA)"
                        className="border p-2 rounded-md flex-1 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <select
                        name="experienceLevel"
                        aria-label="Experience Level"
                        className="border p-2 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Level</option>
                        <option value="entry level">Entry Level</option>
                        <option value="mid level">Mid Level</option>
                        <option value="senior level">Senior Level</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {searchResults.map((job, index) => (
                        <JobCard key={index} {...job} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default JobSearchTest;