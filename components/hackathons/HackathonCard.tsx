'use client';

import { motion } from 'framer-motion';
import { Calendar, Tag, Cpu, ExternalLink, Clock } from 'lucide-react';
import type { Hackathon } from '@/types/hackathon';

function getDaysRemaining(deadline: string): { days: number; label: string; urgent: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, label: 'Deadline passed', urgent: false };
  if (days === 0) return { days, label: 'Deadline today!', urgent: true };
  if (days === 1) return { days, label: 'Deadline tomorrow', urgent: true };
  return { days, label: `${days} days left`, urgent: days < 4 };
}

interface HackathonCardProps {
  hackathon: Hackathon;
  onExplore?: (id: string) => void;
  index?: number;
}

export default function HackathonCard({ hackathon, onExplore, index = 0 }: HackathonCardProps) {
  const { days, label, urgent } = getDaysRemaining(hackathon.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-purple-500/40 p-5 flex flex-col gap-4 transition-all duration-300 overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-purple-600/0 group-hover:bg-purple-600/3 transition-all duration-300" />

      {/* Header */}
      <div className="relative">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="font-semibold text-white text-base leading-snug group-hover:text-purple-200 transition-colors">
            {hackathon.name}
          </h3>
          <span className={`shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full border ${
            hackathon.status === 'ACTIVE'
              ? 'bg-green-600/20 text-green-300 border-green-500/30'
              : hackathon.status === 'UPCOMING'
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/30'
              : 'bg-slate-600/20 text-slate-400 border-slate-500/30'
          }`}>
            {hackathon.status}
          </span>
        </div>
        <p className="text-xs text-slate-400">by {hackathon.organizer}</p>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
        {hackathon.description}
      </p>

      {/* Themes */}
      {hackathon.themes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hackathon.themes.slice(0, 4).map((theme) => (
            <span key={theme} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-purple-600/10 text-purple-300 border border-purple-500/20">
              <Tag className="w-2.5 h-2.5" />
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Technologies */}
      {hackathon.technologies?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hackathon.technologies.slice(0, 5).map((tech) => (
            <span key={tech} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-blue-600/10 text-blue-300 border border-blue-500/20">
              <Cpu className="w-2.5 h-2.5" />
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className={`text-xs font-medium ${urgent ? 'text-orange-400' : 'text-slate-400'}`}>
            {label}
          </span>
        </div>
        <button
          onClick={() => onExplore?.(hackathon._id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 hover:text-purple-200 transition-all duration-200"
        >
          Explore
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
