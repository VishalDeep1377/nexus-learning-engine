'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, XCircle, Bot, Timer } from 'lucide-react';
import type { AgentTraceEntry, AgentStatus } from '@/types/hackathon';

const statusConfig: Record<AgentStatus, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  PENDING: {
    icon: <Circle className="w-4 h-4" />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-700/30',
    borderColor: 'border-slate-600/30',
    label: 'Waiting',
  },
  RUNNING: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-500/30',
    label: 'Running',
  },
  COMPLETED: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    borderColor: 'border-green-500/30',
    label: 'Done',
  },
  FAILED: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-400',
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-500/30',
    label: 'Failed',
  },
};

interface AgentTraceProps {
  agents: AgentTraceEntry[];
  title?: string;
}

function formatMs(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AgentTrace({ agents, title = "AI Workflow" }: AgentTraceProps) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-700/50" />

        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {agents.map((agent, i) => {
              const config = statusConfig[agent.status];
              return (
                <motion.div
                  key={agent.agentName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="relative flex items-start gap-3 pl-6"
                >
                  {/* Status dot */}
                  <div className={`absolute left-0 flex items-center justify-center w-5.5 h-5.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.color} z-10 leading-none`}
                    style={{ width: '22px', height: '22px', marginTop: '1px' }}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-lg border p-3 ${config.bgColor} ${config.borderColor}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${config.color}`}>
                        {agent.agentName}
                      </span>
                      <div className="flex items-center gap-2">
                        {agent.durationMs && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Timer className="w-3 h-3" />
                            {formatMs(agent.durationMs)}
                          </span>
                        )}
                        <span className={`text-xs ${config.color}`}>{config.label}</span>
                      </div>
                    </div>
                    {agent.result && (
                      <p className="text-xs text-slate-400 mt-0.5">{agent.result}</p>
                    )}
                    {agent.error && (
                      <p className="text-xs text-red-400 mt-0.5">⚠ {agent.error}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
