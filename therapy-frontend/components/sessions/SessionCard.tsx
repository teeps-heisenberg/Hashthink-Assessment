'use client';

import { useState } from 'react';
import { Session, isProcessingStatus } from '@/lib/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SessionDetail from './SessionDetail';
import {
  ChevronDownIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface SessionCardProps {
  session: Session;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProcessing = isProcessingStatus(session.status);
  const hasContent = session.transcript || session.summary;

  const toggleExpand = () => {
    if (hasContent) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card 
      padding="none" 
      hover={hasContent}
      className={`overflow-hidden ${isProcessing ? 'animate-pulse-subtle' : ''}`}
    >
      {/* Card Header */}
      <div
        onClick={toggleExpand}
        className={`p-5 ${hasContent ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Status and Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={session.status} />
              {session.isVectorized && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                  Vectorized
                </span>
              )}
            </div>

            {/* Summary Preview */}
            {session.summary ? (
              <p className="text-sm text-zinc-300 line-clamp-2 mb-3">
                {session.summary}
              </p>
            ) : isProcessing ? (
              <div className="space-y-2 mb-3">
                <div className="h-4 bg-[#252525] rounded animate-pulse w-full" />
                <div className="h-4 bg-[#252525] rounded animate-pulse w-3/4" />
              </div>
            ) : session.status === 'failed' ? (
              <p className="text-sm text-red-400/70 mb-3">
                Processing failed. You may try uploading again.
              </p>
            ) : null}

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {getTimeAgo(session.createdAt)}
              </span>
              {session.speakers.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <UserGroupIcon className="w-4 h-4" />
                  {session.speakers.length} speaker{session.speakers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Right: Expand Button */}
          {hasContent && (
            <button
              className={`
                p-2 rounded-xl bg-[#252525] hover:bg-[#2a2a2a] transition-all duration-200
                ${isExpanded ? 'rotate-180' : ''}
              `}
            >
              <ChevronDownIcon className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && hasContent && (
        <div className="border-t border-[#2a2a2a] animate-slide-down">
          <SessionDetail session={session} />
        </div>
      )}
    </Card>
  );
}
