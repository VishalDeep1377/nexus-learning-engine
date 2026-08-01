import React from "react";

interface JobCardProps {
  jobTitle: string;
  company: string;
  logo?: string;
  location: string;
  description: string;
  postedDate: string;
  applyLink: string;
}

const JobCard: React.FC<JobCardProps> = ({ jobTitle, company, logo, location, description, postedDate, applyLink }) => {
  return (
    <div className="p-5 w-80 my-5 min-h-[370px] rounded-2xl bg-gray-200 shadow-lg dark:bg-gray-800 dark:shadow-md transition-all duration-300">
      <div className="h-40 bg-gray-300 rounded-lg shadow-inner flex justify-center items-center dark:bg-gray-700">
        {logo ? <img src={logo} alt="Company Logo" className="h-24 w-24 object-contain" /> : "No Image"}
      </div>
      <h2 className="text-lg font-semibold text-blue-700 mt-4 dark:text-blue-400">{jobTitle}</h2>
      <p className="text-gray-700 dark:text-gray-300">{company} - {location}</p>
      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{description}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Posted on: {postedDate}</p>
      <a
        href={applyLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-4 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Apply Now
      </a>
    </div>
  );
};

export default JobCard;
