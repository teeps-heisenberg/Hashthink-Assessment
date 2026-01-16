'use client';

import Header from '@/components/layout/Header';
import AudioUpload from '@/components/sessions/AudioUpload';
import SessionList from '@/components/sessions/SessionList';
import { useSessions } from '@/hooks/useSessions';

export default function Home() {
  const {
    sessions,
    isLoading,
    error,
    upload,
    isUploading,
    uploadError,
  } = useSessions();

  const handleUpload = async (file: File) => {
    await upload(file);
  };

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

        {/* Sessions Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <SessionList
            sessions={sessions}
            isLoading={isLoading}
            error={error}
          />
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
