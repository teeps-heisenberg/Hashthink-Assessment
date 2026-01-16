'use client';

import { SearchSession } from '@/lib/types';
import SessionCard from './SessionCard';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface SearchResultsProps {
  results: SearchSession[];
  query: string;
  isSearching: boolean;
  error: string | null;
  hasSearched: boolean;
}

/**
 * Format similarity score as percentage
 */
function formatSimilarity(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

/**
 * Get similarity badge color based on score
 */
function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (similarity >= 0.6) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  if (similarity >= 0.4) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

export default function SearchResults({
  results,
  query,
  isSearching,
  error,
  hasSearched,
}: SearchResultsProps) {
  if (isSearching) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">
          Search failed
        </h3>
        <p className="text-sm text-zinc-500 max-w-sm">{error}</p>
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title="No results found"
        description={`No sessions found matching "${query}". Try different keywords or check your spelling.`}
        icon={<SparklesIcon className="w-12 h-12 text-zinc-600" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Search Results
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Found {results.length} session{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map(({ session, similarity }) => (
          <div key={session.id} className="relative">
            {/* Similarity Badge */}
            <div
              className={`
                absolute -top-2 -right-2 z-10
                inline-flex items-center gap-1 px-2.5 py-1
                text-xs font-semibold rounded-full border
                ${getSimilarityColor(similarity)}
                shadow-lg
              `}
            >
              <SparklesIcon className="w-3 h-3" />
              {formatSimilarity(similarity)} match
            </div>

            {/* Session Card */}
            <SessionCard session={session} />
          </div>
        ))}
      </div>
    </div>
  );
}
