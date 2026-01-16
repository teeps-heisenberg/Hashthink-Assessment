'use client';

import { SessionStatus, getStatusLabel, isProcessingStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: SessionStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isProcessing = isProcessingStatus(status);

  const statusColors: Record<SessionStatus, string> = {
    uploading: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    transcribing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    summarizing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    vectorizing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const dotColors: Record<SessionStatus, string> = {
    uploading: 'bg-blue-400',
    transcribing: 'bg-amber-400',
    summarizing: 'bg-purple-400',
    vectorizing: 'bg-cyan-400',
    completed: 'bg-emerald-400',
    failed: 'bg-red-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${statusColors[status]} ${sizes[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColors[status]} ${
          isProcessing ? 'animate-pulse' : ''
        }`}
      />
      {getStatusLabel(status)}
    </span>
  );
}
