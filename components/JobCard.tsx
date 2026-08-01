import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface JobCardProps {
  position: string;
  company: string;
  location: string;
  date: string;
  salary: string;
  jobUrl: string;
  companyLogo: string;
  agoTime: string;
}

export default function JobCard({ position, company, location, date, salary, jobUrl, companyLogo, agoTime }: JobCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {!imageError ? (
          <img
            src={companyLogo}
            alt={`${company} logo`}
            className="w-12 h-12 rounded-full object-cover bg-gray-100"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{position}</h3>
          <p className="text-gray-600 dark:text-gray-300">{company}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              📍 {location}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              ⏰ {agoTime || 'New'}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">{salary}</span>
        {jobUrl && (
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Apply Now
          </a>
        )}
      </div>
    </div>
  );
} 