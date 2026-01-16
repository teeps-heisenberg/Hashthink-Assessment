'use client';

import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
  error: string | null;
}

export default function SearchInput({
  query,
  onQueryChange,
  onSearch,
  onClear,
  isSearching,
  error,
}: SearchInputProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onQueryChange(newQuery);
    // Trigger debounced search (hook handles debouncing)
    if (newQuery.trim().length >= 3) {
      onSearch(newQuery);
    }
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          {isSearching ? (
            <LoadingSpinner size="sm" />
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search sessions by meaning (e.g., 'anxiety management', 'coping strategies')..."
          className={`
            w-full pl-12 pr-12 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl
            text-zinc-100 placeholder-zinc-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
            transition-all duration-200
            ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}
          `}
          aria-label="Search therapy sessions"
          aria-describedby={error ? 'search-error' : undefined}
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="search-error"
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400"
          role="alert"
        >
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {query && query.trim().length < 3 && (
        <p className="text-xs text-zinc-500 px-1">
          Enter at least 3 characters to search
        </p>
      )}
    </div>
  );
}
