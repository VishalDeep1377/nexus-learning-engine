import { useState } from 'react';
import { Building2, MapPin, Clock, ExternalLink } from 'lucide-react';

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
    <div className="group relative p-[1px] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
      {/* Animated glowing border background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent group-hover:from-blue-500/50 group-hover:to-indigo-500/10 transition-colors duration-500" />
      
      {/* Content Container */}
      <div className="relative h-full bg-[#0a0d14]/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between">
        
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-xl blur-lg group-hover:bg-blue-500/20 transition-colors" />
              {!imageError && companyLogo ? (
                <img
                  src={companyLogo}
                  alt={`${company} logo`}
                  className="relative w-14 h-14 rounded-xl object-contain bg-white/5 border border-white/10 p-1"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="relative w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
            {agoTime && (
              <span className="shrink-0 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {agoTime}
              </span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
              {position}
            </h3>
            <p className="text-gray-400 font-medium mt-1 truncate">
              {company}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1.5 break-all line-clamp-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
            {salary && (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="font-mono">$</span> {salary}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          {jobUrl ? (
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors text-sm"
            >
              Apply Now
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </a>
          ) : (
            <button
               disabled
               className="flex items-center justify-center w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-600 font-semibold text-sm cursor-not-allowed"
            >
               Application Closed
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 