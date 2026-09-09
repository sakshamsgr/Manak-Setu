import React, { useState } from 'react';
import { Citation } from '../../types/chat';
import { 
  BookOpen, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Check, 
  Bookmark, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { SourceModal } from './SourceModal';

interface CitationEvidenceCardProps {
  citation: Citation;
  index: number;
}

export const CitationEvidenceCard: React.FC<CitationEvidenceCardProps> = ({ citation, index }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const docTitle = citation.document_title || citation.title || citation.document || citation.standard_id || 'Indian Standard (BIS)';
  const pageNumber = citation.page ?? citation.page_number;
  const hasPage = pageNumber !== undefined && pageNumber !== null && pageNumber > 0;
  const snippetText = citation.text || '';

  // Clean IS standard query for official portal lookup
  const stdClean = (citation.standard_id || docTitle).replace(/[^a-zA-Z0-9]/g, '');
  const officialSearchUrl = (citation.url && !citation.url.toLowerCase().endsWith('.pdf'))
    ? citation.url
    : `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent(
        stdClean
      )}`;

  return (
    <>
      <div className="group bg-white rounded-xl border border-slate-200 hover:border-bis-300 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3">
        {/* Top Identification Badge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bis-900 text-white rounded">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>BIS Source #{index + 1}</span>
              </span>
              {hasPage && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 rounded">
                  Page {pageNumber}
                </span>
              )}
            </div>

            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
              Verified Ground Truth
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-bis-800 transition-colors line-clamp-1" title={docTitle}>
            {docTitle}
          </h4>
        </div>

        {/* Snippet preview */}
        {snippetText && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono leading-relaxed line-clamp-2 select-text">
            "{snippetText}"
          </div>
        )}

        {/* Action Button Strip */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-bis-700 hover:text-bis-900 flex items-center gap-1 transition-colors"
          >
            <span>Inspect Verified Clause</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            href={officialSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-bis-800 hover:bg-slate-100 transition-colors"
            title="Search this Standard on Official BIS Portal (manakonline.in)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <SourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        citation={citation}
      />
    </>
  );
};

interface CitationsEvidenceGridProps {
  citations: Citation[];
}

export const CitationsEvidenceGrid: React.FC<CitationsEvidenceGridProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="space-y-3 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <BookOpen className="w-4 h-4 text-bis-800" />
          <span>Official BIS Ground-Truth Evidence & Sources ({citations.length}):</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Retrieved from Authorized BIS Vector Index
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {citations.map((c, i) => (
          <CitationEvidenceCard
            key={`${c.document || c.standard_id}-${c.page || c.page_number}-${i}`}
            citation={c}
            index={i}
          />
        ))}
      </div>
    </div>
  );
};
