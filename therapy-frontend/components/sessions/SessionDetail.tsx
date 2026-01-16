'use client';

import { useState } from 'react';
import { Session } from '@/lib/types';
import {
  DocumentTextIcon,
  SparklesIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface SessionDetailProps {
  session: Session;
}

type Tab = 'summary' | 'transcript';

export default function SessionDetail({ session }: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; available: boolean }[] = [
    {
      id: 'summary',
      label: 'Summary',
      icon: <SparklesIcon className="w-4 h-4" />,
      available: !!session.summary,
    },
    {
      id: 'transcript',
      label: 'Transcript',
      icon: <DocumentTextIcon className="w-4 h-4" />,
      available: !!session.transcript,
    },
  ];

  return (
    <div className="p-5">
      {/* Speakers */}
      {session.speakers.length > 0 && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#2a2a2a]">
          <UserIcon className="w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Speakers:</span>
          <div className="flex flex-wrap gap-2">
            {session.speakers.map((speaker, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs font-medium rounded-lg bg-[#252525] text-zinc-300"
              >
                {speaker}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs
          .filter((tab) => tab.available)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-[#252525] text-zinc-400 border border-transparent hover:text-zinc-200'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
      </div>

      {/* Content */}
      <div className="relative">
        {activeTab === 'summary' && session.summary && (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="p-4 bg-[#151515] rounded-xl border border-[#252525]">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {session.summary}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'transcript' && session.transcript && (
          <div className="relative">
            <div className="p-4 bg-[#151515] rounded-xl border border-[#252525] max-h-96 overflow-y-auto custom-scrollbar">
              <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                {session.transcript}
              </pre>
            </div>
            {session.transcript.length > 1000 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#151515] to-transparent pointer-events-none rounded-b-xl" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
