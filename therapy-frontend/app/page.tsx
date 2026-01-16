'use client';

import Header from '@/components/layout/Header';
import AudioUpload from '@/components/sessions/AudioUpload';
import SessionList from '@/components/sessions/SessionList';
import SearchInput from '@/components/sessions/SearchInput';
import SearchResults from '@/components/sessions/SearchResults';
import { useSessions } from '@/hooks/useSessions';
import { useSearchSessions } from '@/hooks/useSearchSessions';
import Button from '@/components/ui/Button';

export default function Home() {
  const {
    sessions,
    isLoading,
    error,
    upload,
    isUploading,
    uploadError,
  } = useSessions();

  const {
    results: searchResults,
    isSearching,
    error: searchError,
    query,
    search,
    setQuery,
    clearSearch,
    hasSearched,
  } = useSearchSessions();

  const handleUpload = async (file: File) => {
    await upload(file);
  };

  const isInSearchMode = hasSearched && query.trim().length >= 3;

  return (
    <div className="min-h-screen bg-[#0f0f0f] gradient-bg">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <section className="mb-10 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">
              Upload Session
            </h2>
            <p className="text-sm text-zinc-500">
              Upload a therapy session recording for transcription and analysis
            </p>
          </div>
          <AudioUpload
            onUpload={handleUpload}
            isUploading={isUploading}
            error={uploadError}
          />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent mb-10" />

        {/* Search Section */}
        <section className="mb-10 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">
              Search Sessions
            </h2>
            <p className="text-sm text-zinc-500">
              Find sessions by meaning using semantic search
            </p>
          </div>
          <SearchInput
            query={query}
            onQueryChange={setQuery}
            onSearch={search}
            onClear={clearSearch}
            isSearching={isSearching}
            error={searchError}
          />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent mb-10" />

        {/* Results Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {isInSearchMode ? (
            <div className="space-y-4">
              <SearchResults
                results={searchResults}
                query={query}
                isSearching={isSearching}
                error={searchError}
                hasSearched={hasSearched}
              />
              <div className="pt-4 border-t border-[#2a2a2a]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="w-full sm:w-auto"
                >
                  Show all sessions
                </Button>
              </div>
            </div>
          ) : (
            <SessionList
              sessions={sessions}
              isLoading={isLoading}
              error={error}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-6 mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-zinc-600 text-center">
            Therapy Session Processing • AI-Powered Transcription & Analysis
          </p>
        </div>
      </footer>
    </div>
  );
}
