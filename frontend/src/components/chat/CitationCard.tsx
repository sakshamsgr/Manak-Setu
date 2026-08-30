import React, { useState } from 'react';
import { Citation } from '../../types/chat';
import { BookOpen, FileText, ExternalLink, Sparkles } from 'lucide-react';
import { SourceModal } from './SourceModal';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const docName = citation.document || citation.standard_id || 'Indian Standard (BIS)';
  const pageNumber = citation.page ?? citation.page_number ?? 1;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-bis-50 border border-slate-200 hover:border-bis-300 shadow-sm text-left transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0"
        title={`Click to view verified source text for ${docName} (Page ${pageNumber})`}
      >
        {/* Document Icon */}
        <div className="w-6 h-6 rounded-md bg-bis-100 group-hover:bg-bis-200 text-bis-800 flex items-center justify-center shrink-0 transition-colors">
          <FileText className="w-3.5 h-3.5" />
        </div>

        {/* Text */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
          <span className="font-semibold text-bis-900 group-hover:text-bis-700 transition-colors truncate max-w-[140px] sm:max-w-[200px]">
            Source: {docName}
          </span>
          <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-900 text-slate-600 rounded">
            p. {pageNumber}
          </span>
        </div>

        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-bis-600 transition-colors ml-0.5 shrink-0" />
      </button>

      <SourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        citation={citation}
      />
    </>
  );
};

interface SourcesListProps {
  citations: Citation[];
}

export const SourcesList: React.FC<SourcesListProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <BookOpen className="w-3.5 h-3.5 text-bis-700" />
        <span>Verified BIS Sources ({citations.length}):</span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {citations.map((c, i) => (
          <CitationCard key={`${c.document || c.standard_id}-${c.page || c.page_number}-${i}`} citation={c} index={i} />
        ))}
      </div>
    </div>
  );
};
