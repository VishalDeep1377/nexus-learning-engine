"use client"; // Ensure this runs on the client side

import { useState } from "react";
import JobCard from "../../components/ui/JobCard";
import { useEffect } from "react";

const JobSearch = () => {
  const [posting, setPosting] = useState([]);
  const [searching, setSearching] = useState(false)
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [form, setForm] = useState({
    keyword: "",
    location: "",
    dateSincePosted: "past Week",
    jobType: "full time",
    remoteFilter: "remote",
    salary: "100000",
    experienceLevel: "",
    limit: "10",
    page: "0",
  });

  const fetchJobs = async () => {
    const keyword = form.keyword.replace(" ", "%20");
    const url = `https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h?title_filter=${keyword}&location_filter=${form.location}&type_filter=FULL_TIME`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_JOBS,
        "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
      },
    };
    // console.log("The env val is ",process.env.RAPID_API_JOBS)
    try {
      setSearching(true)
      const response = await fetch(url, options);
      const result = await response.json();
      console.log(result);

      setPosting(
        result.map((val) => (
          <JobCard
            key={val.url} // Ensure unique key
            jobTitle={val.title}
            company={val.organization}
            logo={val.organization_logo}
            location={val.locations_derived?.[0] || "Not Specified"}
            description={val.linkedin_org_description || "No description available"}
            postedDate={val.date_posted}
            applyLink={val.url}
          />
        ))
      );
    } catch (e) {
      console.log("Error in retrieving jobs!");
    }
    setSearching(false)
  };

  useEffect(() => {
    if (searchTriggered) {
      fetchJobs();
      setSearchTriggered(false);
    }
  }, [searchTriggered]);
  const handleSearchForm = async (event) => {
    event.preventDefault();
    setSearchTriggered(true);
  };

  return (
    <>
      {/* Search Bar */}
      <div className="flex items-center justify-center p-4">
        <form
          onSubmit={handleSearchForm} // Now handled in client-side
          className="flex flex-col md:flex-row gap-4 bg-slate-200 dark:bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-3xl"
        >
          <input
            type="text"
            name="keyword"
            value={form.keyword}
            onChange={(e) =>
              setForm((state) => ({
                ...state,
                [e.target.name]: e.target.value,
              }))
            }
            placeholder="Job title (e.g. Software Engineer)"
            className="border p-2 rounded-md flex-1 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={(e) =>
              setForm((state) => ({
                ...state,
                [e.target.name]: e.target.value,
              }))
            }
            placeholder="Location (e.g. India, USA)"
            className="border p-2 rounded-md flex-1 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="experienceLevel"
            value={form.experienceLevel}
            onChange={(e) =>
              setForm((state) => ({
                ...state,
                [e.target.name]: e.target.value,
              }))
            }
            className="border p-2 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            <option value="entry level">Entry Level</option>
            <option value="mid level">Mid Level</option>
            <option value="senior level">Senior Level</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
      </div>
      {searching && (<p className="text-center">Loading...</p>)}

      {/* Job Postings */}
    <div className="mt-4 flex flex-row flex-wrap justify-center gap-4">{posting}</div>
    </>
  );
};

export default JobSearch;
