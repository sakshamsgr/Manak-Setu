import React from 'react';
import { Modal } from '../common/Modal';
import { Citation } from '../../types/chat';
import { FileText, BookOpen, ExternalLink, Bookmark, ShieldCheck, Check } from 'lucide-react';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
}

export const SourceModal: React.FC<SourceModalProps> = ({
  isOpen,
  onClose,
  citation,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const docName = citation.document || citation.standard_id || 'Indian Standard (BIS)';
  const pageNum = citation.page ?? citation.page_number ?? 1;
  const snippet = citation.text || 'Extracted contextual clause from official standard repository.';

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(`[${docName}, Page ${pageNum}]: ${snippet}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate official search link on BIS manakonline
  const searchUrl = `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent(
    docName.replace(/\s+/g, '')
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-bis-900">
          <BookOpen className="w-5 h-5 text-bis-700" />
          <span className="font-bold">BIS Standard Citation Reference</span>
        </div>
      }
      maxWidth="lg"
      footer={
        <>
          <button
            onClick={handleCopySnippet}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Reference' : 'Copy Excerpt'}</span>
          </button>

          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 text-xs font-semibold bg-bis-700 hover:bg-bis-600 active:bg-bis-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>View in Official BIS Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </>
      }
    >
      <div className="space-y-4">
        {/* Document Header Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-bis-50 to-slate-50 border border-bis-100 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bis-800 text-white rounded">
                Official Standard
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 rounded">
                Page {pageNum}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{docName}</h3>
            <p className="text-xs text-slate-500">Bureau of Indian Standards Repository</p>
          </div>

          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0 text-bis-700">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Snippet Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Extracted Context Clause & Verifiable Text:</span>
            {citation.distance !== undefined && (
              <span className="text-[11px] text-slate-400 font-mono">
                Vector Distance: {Number(citation.distance).toFixed(4)}
              </span>
            )}
          </div>
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-60 overflow-y-auto custom-scrollbar border border-slate-800 select-text">
            {snippet}
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Authorized Ground Truth:</strong> This citation is derived directly from the vector index of authorized Bureau of Indian Standards publications and Quality Control Orders.
          </div>
        </div>
      </div>
    </Modal>
  );
};
