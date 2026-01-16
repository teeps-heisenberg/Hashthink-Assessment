'use client';

import { Session } from '@/lib/types';
import SessionCard from './SessionCard';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
}

export default function SessionList({ sessions, isLoading, error }: SessionListProps) {
  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">Failed to load sessions</h3>
        <p className="text-sm text-zinc-500 max-w-sm">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">
          Sessions
          <span className="ml-2 text-sm font-normal text-zinc-500">
            ({sessions.length})
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
