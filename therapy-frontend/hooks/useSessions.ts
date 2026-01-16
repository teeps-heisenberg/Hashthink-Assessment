'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, UploadResponse, isProcessingStatus } from '@/lib/types';
import { getSessions, uploadSession, getSession } from '@/lib/api';

interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  upload: (file: File) => Promise<UploadResponse>;
  isUploading: boolean;
  uploadError: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing sessions data with polling
 */
export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch all sessions
   */
  const fetchSessions = useCallback(async () => {
    try {
      const response = await getSessions();
      setSessions(response.sessions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh sessions
   */
  const refresh = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  /**
   * Upload a file and create a new session
   */
  const upload = useCallback(async (file: File): Promise<UploadResponse> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadSession(file);
      
      // Refresh sessions to include the new one
      await fetchSessions();
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [fetchSessions]);

  /**
   * Start polling if any session is processing
   */
  useEffect(() => {
    const hasProcessing = sessions.some(s => isProcessingStatus(s.status));

    if (hasProcessing) {
      // Poll every 3 seconds while processing
      pollingRef.current = setTimeout(() => {
        fetchSessions();
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [sessions, fetchSessions]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    upload,
    isUploading,
    uploadError,
    refresh,
  };
}

/**
 * Hook for a single session with polling
 */
export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(id);
      setSession(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (session && isProcessingStatus(session.status)) {
      pollingRef.current = setTimeout(() => {
        fetchSession();
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [session, fetchSession]);

  return { session, isLoading, error, refresh: fetchSession };
}
