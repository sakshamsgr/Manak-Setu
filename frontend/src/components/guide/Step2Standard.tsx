import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  Sparkles,
  Info,
  AlertTriangle,
  Target,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StandardDetails, CertificationDetails } from '../../types/compliance';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { useLanguage } from '../../context/LanguageContext';

interface Step2StandardProps {
  productName: string;
  standardDetails: StandardDetails;
  certificationDetails: CertificationDetails;
  citations: Citation[];
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function parseRelatedStandards(raw: string[], primaryCode: string) {
  if (!raw || raw.length === 0) return [];
  return raw
    .map((rs) => {
      const rsStr = String(rs).trim();
      const match = rsStr.match(/\b(IS\s*[\d]+(?:[:\-\/]\d+)*(?:\s*\(Part\s*\d+(?:\/Sec\s*\d+)?\))?(?:\s*:\s*\d{4})?)\b/i);
      const code = match ? match[1].trim() : '';
      let description = rsStr.includes(' — ') ? rsStr.split(' — ').slice(1).join(' — ').trim() : code ? rsStr.replace(match![0], '').replace(/^[:\-\s]+/, '').trim() : rsStr;
      if (description.includes('_') || description.length > 120) description = description.split(/[_,;]/)[0].trim().slice(0, 100);
      return { code: code || rsStr.slice(0, 50), description, isPrimary: !!(code && code.toUpperCase() === primaryCode.toUpperCase()) };
    })
    .filter((item) => item.code && item.code.length > 1);
}

// ── Component ─────────────────────────────────────────────────────────────────
export const Step2Standard: React.FC<Step2StandardProps> = ({
  productName,
  standardDetails,
  certificationDetails,
  citations,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();
  const [aiLoading, setAiLoading] = useState(false);
  const [showFullScope, setShowFullScope] = useState(false);
  const [showAllRelated, setShowAllRelated] = useState(false);

  const isMandatory = certificationDetails.isMandatory;
  const hasQco = !!certificationDetails.qcoName;
  const isUnverified = !standardDetails?.code || standardDetails.code === 'Data Not Available' || standardDetails.code === 'Under Standard Identification';

  const whyText = standardDetails?.reason || standardDetails?.whyItApplies || '';
  const scopeText = standardDetails?.scope || '';
  const truncatedScope = scopeText.length > 250 ? scopeText.slice(0, 250) + '…' : scopeText;
  const displayScope = showFullScope ? scopeText : truncatedScope;

  const parsedRelated = parseRelatedStandards(standardDetails?.relatedStandards || [], standardDetails?.code || '');
  const visibleRelated = showAllRelated ? parsedRelated : parsedRelated.slice(0, 3);

  // AI suggested questions contextual to this product
  const aiQuestions = [
    `Why is BIS certification ${isMandatory ? 'mandatory' : 'required'} for ${productName}?`,
    `What tests do I need for ${productName}?`,
    `What documents are required for BIS Scheme-I application?`,
    `Which BIS scheme applies to ${productName}?`,
  ];

  const handleAskAI = async (question: string) => {
    if (!onAskAI) return;
    setAiLoading(true);
    try {
      await onAskAI(question);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 2 of 5
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          Applicable Standards and QCO
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Find out the official rulebook (Standard) for your product, and check if the government requires it to be certified before selling.
        </p>
      </div>

      {/* ── 1. APPLICABLE INDIAN STANDARD ────────────────────────────── */}
      {standardDetails && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-bis-700" />
            The Official Rulebook for Your Product
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-2xl font-extrabold font-mono text-bis-900 tracking-tight">
                {!isUnverified ? standardDetails.code : 'Needs Verification'}
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {standardDetails.title}
              </p>
              {!isUnverified && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  We found the exact standard for your product!
                </div>
              )}
            </div>

            <a
              href={standardDetails.officialUrl || 'https://www.services.bis.gov.in'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-bis-200 bg-bis-50 hover:bg-bis-100 text-bis-900 text-xs font-bold transition-colors"
            >
              View Official Rulebook
              <ExternalLink className="w-3.5 h-3.5 text-bis-700" />
            </a>
          </div>
        </div>
      )}

      {/* ── 2. CERTIFICATION STATUS CARD ─────────────────────────────── */}
      <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
        isMandatory ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          Government Certification Rules
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isMandatory ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-extrabold shadow-sm">
              <AlertCircle className="w-4 h-4" />
              Strictly Required (Mandatory)
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-extrabold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              Voluntary (Your Choice)
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-bold shadow-sm">
            {certificationDetails.scheme}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {isMandatory
            ? hasQco
              ? `The government has made it a strict rule that you MUST get a BIS license before you can sell ${productName || 'this product'} in India.`
              : `A BIS license is required for ${productName || 'this product'}. Please verify the exact government rules with BIS.`
            : `You are not legally forced to get a license for ${productName || 'this product'}, but getting one shows people your product is safe and high quality!`}
        </p>
      </div>

      {/* ── 3. APPLICABLE QCO (Only shows if mandatory) ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          <FileCheck2 className="w-3.5 h-3.5 text-bis-700" />
          Applicable Quality Control Order (QCO)
        </div>

        {hasQco ? (
          <>
            <div>
              <p className="text-sm font-extrabold text-slate-900 leading-snug">
                {certificationDetails.qcoName}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Government Order No.</div>
                <div className="font-mono font-semibold text-slate-800">
                  {certificationDetails.qcoNotification || <span className="text-amber-600">Needs Verification</span>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Announcement Date</div>
                <div className="font-mono font-semibold text-slate-800">
                  {certificationDetails.notificationDate || <span className="text-amber-600">Needs Verification</span>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Strictly Enforced By</div>
                <div className="font-mono font-semibold text-rose-700">
                  {certificationDetails.effectiveDate || certificationDetails.complianceDeadline || <span className="text-amber-600">Needs Verification</span>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Made a Rule By</div>
                <div className="font-semibold text-slate-800">
                  {certificationDetails.notifyingAuthority || 'Govt. of India'}
                </div>
              </div>
            </div>

            <a
              href="https://www.bis.gov.in/statutory-functions/quality-control-orders/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-bis-200 bg-bis-50 hover:bg-bis-100 text-bis-900 text-xs font-bold transition-colors"
            >
              View Official QCO
              <ExternalLink className="w-3.5 h-3.5 text-bis-700" />
            </a>
          </>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-xs font-semibold text-slate-700">
              {certificationDetails.qcoNotification || 'The government has not made a mandatory QCO rule for this product yet.'}
            </p>
            {!isMandatory && (
              <p className="text-[11px] text-slate-500">
                You can still apply for a voluntary ISI Mark to prove your product is safe!
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 4. WHY IT APPLIES + SCOPE ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Why This Standard Applies */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Why do you need this?
            </span>
          </div>

          {whyText ? (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {whyText.length > 350 ? whyText.slice(0, 350) + '…' : whyText}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">Explanation not available.</p>
          )}

          {productName && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-bis-50 text-bis-800 border border-bis-100 rounded-md inline-flex items-center gap-1">
              <Target className="w-3 h-3" />
              {productName}
            </span>
          )}
        </div>

        {/* Standard Scope & Coverage */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-bis-50 text-bis-700">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              What does this rulebook cover?
            </span>
          </div>

          {scopeText ? (
            <>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {displayScope}
              </p>
              {scopeText.length > 250 && (
                <button
                  onClick={() => setShowFullScope(!showFullScope)}
                  className="text-xs font-semibold text-bis-700 hover:text-bis-900 flex items-center gap-1 transition-colors mt-1"
                >
                  {showFullScope ? (
                    <><ChevronUp className="w-3.5 h-3.5" /><span>Show Less</span></>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /><span>Read Full Scope</span></>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 italic">Scope information is not available.</p>
          )}
        </div>
      </div>

{/* ── VISUAL SEPARATOR ─────────────────────────────────────────── */}
      <div className="pt-3 pb-1">
        <div className="flex items-center gap-3 opacity-70">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Supplementary References
          </span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
      </div>

      {/* ── 5 & 6. RELATED STANDARDS & OFFICIAL EVIDENCE (Side-by-Side) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        
        {/* Left Column: RELATED STANDARDS */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Other Helpful Rulebooks
            </span>
          </div>

          {parsedRelated.length > 0 ? (
            <div className="flex flex-col gap-2">
              {visibleRelated.map((rs, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs space-y-0.5 ${rs.isPrimary ? 'bg-bis-50 border-bis-200 shadow-xs' : 'bg-white border-slate-200'}`}>
                  <div className="font-bold text-slate-900 font-mono leading-tight">{rs.code}</div>
                  {rs.description && <p className="text-slate-600 leading-snug">{rs.description}</p>}
                </div>
              ))}
              {parsedRelated.length > 3 && (
                <button
                  onClick={() => setShowAllRelated(!showAllRelated)}
                  className="text-xs font-semibold text-bis-700 hover:text-bis-900 flex items-center gap-1 transition-colors pt-1.5 w-fit"
                >
                  {showAllRelated ? <><ChevronUp className="w-3.5 h-3.5" /><span>Show Less</span></> : <><ChevronDown className="w-3.5 h-3.5" /><span>View Related Standards ({parsedRelated.length})</span></>}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No related standards found.</p>
          )}
        </div>

        {/* Right Column: OFFICIAL BIS EVIDENCE */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex-1 w-full p-5 [&>div]:pt-0 [&>div]:border-t-0 [&>div>div]:!grid-cols-1">
            {citations && citations.length > 0 ? (
               <CitationsEvidenceGrid citations={citations} />
            ) : (
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 mb-1">
                   <div className="p-1.5 rounded-lg bg-bis-900 text-amber-400">
                     <BookOpen className="w-4 h-4" />
                   </div>
                   <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                     Official Evidence
                   </span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium">Scanned directly from official government documents.</p>
                 <p className="text-xs text-slate-400 italic mt-2">No citations available.</p>
               </div>
            )}
          </div>
        </div>
        
      </div>

      {/* ── 7. ASK MANAK SETU AI CARD ─────────────────────────────────── */}
      {onAskAI && (
        <div className="rounded-2xl border border-bis-200 bg-bis-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-bis-900">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-bis-900 uppercase tracking-wide">Ask Manak Setu AI</div>
              <div className="text-[11px] text-slate-500">Still confused? Ask me a simple question!</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {aiQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAskAI(q)}
                disabled={aiLoading}
                className="text-[11px] font-semibold text-bis-800 bg-white border border-bis-200 hover:bg-bis-100 hover:border-bis-300 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60 text-left"
              >
                {q}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleAskAI(aiQuestions[0])}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-70 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Ask Manak Setu AI
          </button>
        </div>
      )}


      {/* ── NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: Product Profile</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95 cursor-pointer"
        >
          <span>Continue to Testing & Labs</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};