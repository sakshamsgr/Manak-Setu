import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Loader2, 
  FolderCheck, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  FileCheck2, 
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { DocumentItem } from '../../types/compliance';
import { PageInfoButton } from '../common/PageInfoButton';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';
import { scanDocumentCompliance, DocumentScanResult } from '../../services/api';

interface Step5DocumentsProps {
  productName: string;
  documents: DocumentItem[];
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

interface DocState {
  status: 'Not Uploaded' | 'Scanning' | 'Verified' | 'Discrepancy' | 'Failed' | 'Verification Pending' | 'Uploaded';
  fileName?: string;
  fileSize?: number;
  verifiedAt?: string;
  summary?: string;
  checklistMatches?: string[];
  discrepancies?: string[];
  statutoryDisclaimer?: string;
  errorMessage?: string;
}

export const Step5Documents: React.FC<Step5DocumentsProps> = ({
  productName,
  documents,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t, language } = useLanguage();
  const { guideData } = useProductContext();
  const [docStates, setDocStates] = useState<Record<string, DocState>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    return () => {
      // Abort all active scans on unmount
      Object.values(abortControllersRef.current).forEach(c => c.abort());
    };
  }, []);

  const categories = ['All', 'Legal', 'Technical', 'Quality Control', 'Testing'];

  const verifiedCount = Object.values(docStates).filter(d => d.status === 'Verified').length;
  const pendingCount = Object.values(docStates).filter(d => d.status === 'Verification Pending' || d.status === 'Uploaded').length;
  const totalCount = documents.length;
  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const handleFileUpload = async (doc: DocumentItem, file: File) => {
    const docId = doc.id;

    // File validation: Size limit 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setDocStates(prev => ({
        ...prev,
        [docId]: {
          status: 'Failed',
          fileName: file.name,
          errorMessage: 'File exceeds maximum 10MB limit. Please upload a smaller PDF or image.'
        }
      }));
      return;
    }

    // Cancel existing scan on this document if in-flight
    if (abortControllersRef.current[docId]) {
      abortControllersRef.current[docId].abort();
    }
    const controller = new AbortController();
    abortControllersRef.current[docId] = controller;

    // 1. Transition to Scanning
    setDocStates(prev => ({
      ...prev,
      [docId]: {
        status: 'Scanning',
        fileName: file.name,
        fileSize: file.size
      }
    }));

    try {
      const res: DocumentScanResult = await scanDocumentCompliance({
        file,
        documentId: docId,
        documentTitle: doc.title,
        standardId: guideData?.standardDetails?.code,
        language,
        signal: controller.signal
      });

      setDocStates(prev => ({
        ...prev,
        [docId]: {
          status: res.status,
          fileName: file.name,
          fileSize: file.size,
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          summary: res.summary,
          checklistMatches: res.checklist_matches,
          discrepancies: res.discrepancies,
          statutoryDisclaimer: res.statutory_disclaimer
        }
      }));

      // Automatically expand card to show findings if verified, pending, or discrepancy
      setExpandedDocId(docId);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout || err.message?.includes('timeout');
      const errDetail = isTimeout
        ? (t('common.aiTimeout') || 'AI scan took longer than 10 seconds. Please retry.')
        : (err.message || t('common.apiUnavailable') || 'Document compliance scan failed.');

      setDocStates(prev => ({
        ...prev,
        [docId]: {
          status: 'Failed',
          fileName: file.name,
          fileSize: file.size,
          errorMessage: errDetail
        }
      }));
    } finally {
      delete abortControllersRef.current[docId];
    }
  };

  const handleRemoveDoc = (docId: string) => {
    if (abortControllersRef.current[docId]) {
      abortControllersRef.current[docId].abort();
      delete abortControllersRef.current[docId];
    }
    setDocStates(prev => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    if (expandedDocId === docId) setExpandedDocId(null);
  };

  const handleManualToggle = (docId: string) => {
    setDocStates(prev => {
      const current = prev[docId];
      if (current?.status === 'Verification Pending' || current?.status === 'Verified') {
        const next = { ...prev };
        delete next[docId];
        return next;
      } else {
        return {
          ...prev,
          [docId]: {
            status: 'Verification Pending',
            fileName: 'Self-Certified Declaration',
            verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            summary: 'Applicant self-certified that this statutory document is prepared and retained at the factory for BIS auditor inspection.',
            statutoryDisclaimer: 'Self-certified declarations are retained for physical documentary verification by BIS officers during preliminary factory audit.'
          }
        };
      }
    });
  };

  const filteredDocs = selectedCategory === 'All'
    ? documents
    : documents.filter(d => d.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
            Stage 5 of 6
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {t('s5Title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('s5Subtitle')}
          </p>
        </div>
        <PageInfoButton
          sectionId="section-documents"
          tooltip="Learn about Statutory Application Documents in the Guide"
          variant="light"
          size="sm"
        />
      </div>

      {/* Progress Card (Derived strictly from verified documents - Plan Section 14) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-bis-100 text-bis-800 shrink-0">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              Statutory Document Readiness
            </h4>
            <p className="text-xs text-slate-500">
              {verifiedCount} of {totalCount} essential application files verified
              {pendingCount > 0 ? ` • ${pendingCount} pending officer scrutiny` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-56">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPct === 100 ? 'bg-emerald-600' : 'bg-bis-800'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 min-w-[36px] text-right">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Statutory Pre-Audit Notice */}
      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-start gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] text-sky-900">
          Upload PDF drawings, machinery schedules, or test certificates for automated BIS pre-submission audit. AI scan results provide statutory format verification; legal grant of licence is executed by BIS following factory audit.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const count = cat === 'All'
            ? documents.length
            : documents.filter(d => d.category.toLowerCase() === cat.toLowerCase()).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-bis-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCategory === cat ? 'bg-bis-800 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Document Items List */}
      <div className="space-y-3">
        {filteredDocs.map((doc) => {
          const state = docStates[doc.id] || { status: 'Not Uploaded' };
          const isVerified = state.status === 'Verified';
          const isPending = state.status === 'Verification Pending' || state.status === 'Uploaded';
          const isScanning = state.status === 'Scanning';
          const isDiscrepancy = state.status === 'Discrepancy';
          const isFailed = state.status === 'Failed';
          const isExpanded = expandedDocId === doc.id;

          return (
            <div
              key={doc.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isVerified
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : isPending
                  ? 'bg-sky-50/40 border-sky-300 shadow-xs'
                  : isScanning
                  ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                  : isDiscrepancy
                  ? 'bg-amber-50/60 border-amber-400 shadow-xs'
                  : isFailed
                  ? 'bg-rose-50/50 border-rose-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {doc.title}
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded">
                      {doc.category}
                    </span>
                    {doc.required && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 rounded">
                        Mandatory
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {doc.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500">
                    {doc.responsibleParty && (
                      <span><strong>Party: </strong>{doc.responsibleParty}</span>
                    )}
                    {doc.applicableWhen && (
                      <span><strong>Applicable: </strong>{doc.applicableWhen}</span>
                    )}
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-bis-700 hover:text-bis-900 font-bold"
                      >
                        <span>Official Format</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Status & Upload Action Controls */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Status Badge */}
                  {isScanning ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      <span>AI Pre-Scanning...</span>
                    </span>
                  ) : isVerified ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        title="Remove file"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold border border-sky-200">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>Officer Scrutiny Pending</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        title="Remove file"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isDiscrepancy ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Discrepancy</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        title="Remove file"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isFailed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Scan Failed</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      Not Uploaded
                    </span>
                  )}

                  {/* Upload Action */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[doc.id] = el)}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(doc, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    />

                    {!isVerified && !isScanning && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[doc.id]?.click()}
                          className="px-3 py-1.5 rounded-xl bg-bis-50 hover:bg-bis-100 text-bis-900 text-xs font-bold border border-bis-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-bis-700" />
                          <span>{isFailed || isDiscrepancy || isPending ? 'Re-Upload & Scan' : 'Upload & Scan'}</span>
                        </button>

                        {!isPending && (
                          <button
                            type="button"
                            onClick={() => handleManualToggle(doc.id)}
                            title="Mark self-certified readiness for officer audit"
                            className="px-2 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium hover:bg-slate-100"
                          >
                            Self-Certify
                          </button>
                        )}
                      </>
                    )}

                    {(isVerified || isDiscrepancy || isPending) && (
                      <button
                        type="button"
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                        className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Analysis' : 'View Analysis'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message if Failed */}
              {isFailed && state.errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{state.errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[doc.id]?.click()}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* Expanded AI Scan Findings Drawer */}
              {isExpanded && (isVerified || isDiscrepancy || isPending) && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Automated Pre-Audit Analysis</span>
                    </div>
                    {state.fileName && (
                      <span className="font-mono text-[11px] text-slate-500">
                        {state.fileName} ({state.verifiedAt})
                      </span>
                    )}
                  </div>

                  {state.summary && (
                    <p className="text-slate-700 leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {state.summary}
                    </p>
                  )}

                  {state.checklistMatches && state.checklistMatches.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-800 text-[11px]">Verified Compliance Criteria:</div>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-600 text-[11px]">
                        {state.checklistMatches.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {state.discrepancies && state.discrepancies.length > 0 && (
                    <div className="space-y-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <div className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Action Required Before Submission:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-amber-900 text-[11px]">
                        {state.discrepancies.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {state.statutoryDisclaimer && (
                    <p className="text-[10px] text-slate-400 italic pt-1">
                      {state.statutoryDisclaimer}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ask AI Helper */}
      {onAskAI && (
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-600">
            Have questions about Form-V, machinery schedules, or NABL calibration certificates?
          </p>
          <button
            type="button"
            onClick={() =>
              onAskAI(
                productName
                  ? `What statutory documents, calibration certificates, and layout plans are required for ${productName}?`
                  : 'What statutory documents, calibration certificates, and layout plans are required for BIS certification?'
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bis-900 hover:text-bis-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Ask Manak Setu AI about Documents
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('prevStepBtn')}</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95"
        >
          <span>{t('s5ContinueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
