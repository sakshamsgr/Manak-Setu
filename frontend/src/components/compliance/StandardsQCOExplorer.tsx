import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Loader2,
  Database
} from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import { Citation } from '../../types/chat';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';

interface StandardsQCOExplorerProps {
  onConsultStandard?: (prompt: string) => void;
}

export const StandardsQCOExplorer: React.FC<StandardsQCOExplorerProps> = ({ onConsultStandard }) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Dynamic AI State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [retrievedDocs, setRetrievedDocs] = useState<Citation[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Citation | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setAiSummary(null);
    setRetrievedDocs([]);

    try {
      // Create a unique session ID for this specific search
      const sessionId = `explorer_${Date.now()}`;
      
      // We instruct the AI to act as a catalog searcher for this page
      const prompt = `Identify the specific Indian Standards (IS codes), Quality Control Orders (QCOs), and testing parameters for: ${searchQuery}. Summarize the requirements.`;
      
      const res = await sendChatMessage(sessionId, prompt, language);
      setAiSummary(res.reply);

      // Deduplicate citations by document name and page so the UI grid looks clean
      const uniqueDocs = res.citations?.reduce((acc, current) => {
        const isDuplicate = acc.find(
          (item) => item.document === current.document && item.page === current.page
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, [] as Citation[]) || [];

      setRetrievedDocs(uniqueDocs);
    } catch (error) {
      console.error("Database search failed:", error);
      setAiSummary("Unable to connect to the BIS Standards Database. Please ensure the API backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Live Database Search
          </span>
          <span className="text-xs text-slate-300">Official BIS Standards Repository</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          Indian Standards (IS) & Quality Control Orders (QCO)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Search the live database for authorized Indian Standard specifications, determine whether your product falls under a mandatory Gazette Quality Control Order (QCO), and view mandatory laboratory testing benchmarks.
        </p>
      </div>

      {/* RAG Search Toolbar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by product (e.g., Electric Iron, Cement, Toys) or IS Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-bis-900 hover:bg-bis-800 disabled:opacity-70 text-white font-bold text-sm rounded-xl shadow transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
            <span>{isLoading ? 'Searching Database...' : 'Search Database'}</span>
          </button>
        </div>
      </form>

      {/* Results Section */}
      {hasSearched && !isLoading && (
        <div className="space-y-6">
          
          {/* AI Summary Panel */}
          {aiSummary && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Compliance Summary
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {aiSummary}
              </p>
            </div>
          )}

          {/* Zero-Hallucination Guard UI */}
          {retrievedDocs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">No Data Available</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                We currently do not have standards or QCO data for "{searchQuery}" in our indexed database. We will update this in the future.
              </p>
            </div>
          ) : (
            /* Database Citations Grid */
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-2">
                Retrieved Official Documents ({retrievedDocs.length}):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {retrievedDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedDoc(doc)}
                    className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 hover:border-bis-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 text-xs font-mono font-extrabold bg-bis-100 text-bis-900 rounded-lg border border-bis-200 truncate max-w-[280px]">
                          {doc.document_title || doc.title || doc.document}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          Page {doc.page ?? doc.page_number ?? 1}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 line-clamp-4 leading-relaxed mt-2">
                        {doc.text}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-bis-700">
                      <span>View Full Extracted Clause</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard Detail Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={
          <div className="flex items-center gap-2 text-bis-900">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="font-mono text-sm">{selectedDoc?.document_title || selectedDoc?.title || selectedDoc?.document} (Page {selectedDoc?.page ?? selectedDoc?.page_number ?? 1})</span>
          </div>
        }
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setSelectedDoc(null)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            {onConsultStandard && selectedDoc && (
              <button
                onClick={() => {
                  const prompt = `Can you explain the requirements listed in ${selectedDoc.document_title || selectedDoc.document} on page ${selectedDoc.page} regarding: "${selectedDoc.text?.slice(0, 50) ?? ''}..."?`;
                  setSelectedDoc(null);
                  onConsultStandard(prompt);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-bis-800 hover:bg-bis-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Consult AI on this Clause</span>
              </button>
            )}
          </>
        }
      >
        {selectedDoc && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Exact Database Extract:
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedDoc.text}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-emerald-900">Authorized Bureau of Indian Standards Indexed Clause</span>
              </div>
              <a
                href={selectedDoc.url || `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent((selectedDoc.standard_id || selectedDoc.document).replace(/[^a-zA-Z0-9]/g, ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bis-800 hover:text-bis-900 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Official BIS Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};