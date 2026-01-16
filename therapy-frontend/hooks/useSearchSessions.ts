'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SearchSessionsResponse, SearchSession } from '@/lib/types';
import { searchSessions } from '@/lib/api';

interface UseSearchSessionsReturn {
  results: SearchSession[];
  isSearching: boolean;
  error: string | null;
  query: string;
  search: (query: string) => Promise<void>;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  hasSearched: boolean;
}

const DEBOUNCE_DELAY = 500;

/**
 * Custom hook for semantic search across sessions
 */
export function useSearchSessions(): UseSearchSessionsReturn {
  const [results, setResults] = useState<SearchSession[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform search
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response: SearchSessionsResponse = await searchSessions(
        searchQuery.trim(),
        10,
        'summary',
      );
      setResults(response.sessions);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Search failed. Please try again.';
      setError(errorMessage);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Search with debouncing
   */
  const search = useCallback(
    (searchQuery: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setQuery(searchQuery);

      if (!searchQuery.trim() || searchQuery.trim().length < 3) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        setIsSearching(false);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, DEBOUNCE_DELAY);
    },
    [performSearch],
  );

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    setIsSearching(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    results,
    isSearching,
    error,
    query,
    search,
    setQuery,
    clearSearch,
    hasSearched,
  };
}
