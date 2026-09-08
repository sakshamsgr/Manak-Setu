import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Layers,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { StandardDetails } from '../../types/compliance';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { useLanguage } from '../../context/LanguageContext';

interface Step2StandardProps {
  productName: string;
  standardDetails: StandardDetails;
  citations: Citation[];
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse related standards from raw strings — strips noise, returns structured items.
 * Handles the 'IS XXXX — Title' format returned by the backend.
 */
function parseRelatedStandards(
  raw: string[],
  primaryCode: string
): Array<{ code: string; description: string; isPrimary?: boolean }> {
  if (!raw || raw.length === 0) return [];

  return raw
    .map((rs) => {
      const rsStr = String(rs).trim();

      // Try to extract an IS code from the string
      const match = rsStr.match(/\b(IS\s*[\d]+(?:[:\-\/]\d+)*(?:\s*\(Part\s*\d+(?:\/Sec\s*\d+)?\))?(?:\s*:\s*\d{4})?)\b/i);
      const code = match ? match[1].trim() : '';

      // Description: everything after the em-dash separator or after the code
      let description = '';
      if (rsStr.includes(' — ')) {
        description = rsStr.split(' — ').slice(1).join(' — ').trim();
      } else if (code) {
        description = rsStr.replace(match![0], '').replace(/^[:\-\s]+/, '').trim();
      } else {
        description = rsStr;
      }

      // Remove raw garbage patterns (long run-on strings with no spaces or underscores)
      if (description.includes('_') || description.length > 120) {
        description = description.split(/[_,;]/)[0].trim().slice(0, 100);
      }

      // Skip if code is the same as the primary (already shown in main card)
      const isPrimary = code && code.toUpperCase() === primaryCode.toUpperCase();

      return { code: code || rsStr.slice(0, 50), description, isPrimary: !!isPrimary };
    })
    .filter((item) => item.code && item.code.length > 1);
}

/**
 * Extract key requirement bullet points from the AI reply text.
 * Only uses lines that mention common requirement keywords.
 */
function extractKeyRequirements(replyText: string): string[] {
  if (!replyText) return [];

  const keywords = [
    'safety', 'electrical', 'insulation', 'resistance', 'protection', 'marking',
    'instruction', 'construction', 'heating', 'leakage', 'current', 'voltage',
    'temperature', 'durability', 'performance', 'test', 'clause', 'requirement',
    'conform', 'comply', 'hazard', 'shock', 'fire', 'mechanical', 'thermal',
  ];

  const lines = replyText.split('\n').map((l) => l.replace(/^[-*•\d.)]+\s*/, '').trim());
  const matches: string[] = [];

  for (const line of lines) {
    if (line.length < 10 || line.length > 200) continue;
    const lower = line.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      matches.push(line);
    }
    if (matches.length >= 6) break;
  }

  return matches;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

// ─── Main Component ──────────────────────────────────────────────────────────

export const Step2Standard: React.FC<Step2StandardProps> = ({
  productName,
  standardDetails,
  citations,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();
  const [showFullScope, setShowFullScope] = useState(false);
  const [showAllRequirements, setShowAllRequirements] = useState(false);
  const [showAllRelated, setShowAllRelated] = useState(false);

  const isUnverified =
    !standardDetails.code ||
    standardDetails.code === 'Under Standard Identification' ||
    standardDetails.code === 'Data Not Available';

  // Use reason from backend validation if available, fall back to whyItApplies
  const whyText = standardDetails.reason || standardDetails.whyItApplies || '';

  const parsedRelated = parseRelatedStandards(
    standardDetails.relatedStandards || [],
    standardDetails.code
  );

  // Extract key requirements from raw AI reply (via whyItApplies which contains the reply text)
  const keyRequirements = extractKeyRequirements(standardDetails.whyItApplies || '');

  // Visible related standards (first 3 unless expanded)
  const visibleRelated = showAllRelated ? parsedRelated : parsedRelated.slice(0, 3);
  const visibleRequirements = showAllRequirements ? keyRequirements : keyRequirements.slice(0, 4);

  // Clean scope text — truncate if too long
  const scopeText = standardDetails.scope || '';
  const truncatedScope = scopeText.length > 250 ? scopeText.slice(0, 250) + '…' : scopeText;
  const displayScope = showFullScope ? scopeText : truncatedScope;

  // Build official BIS URL
  const officialUrl =
    standardDetails.officialUrl ||
    (standardDetails.code && standardDetails.code !== 'Under Standard Identification'
      ? `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent(
          standardDetails.code.replace(/[^a-zA-Z0-9]/g, '')
        )}`
      : 'https://www.services.bis.gov.in');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 2 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('step2.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Identify the Indian Standard that applies to your product and understand why it was selected.
        </p>
      </div>

      {/* ── 1. MAIN STANDARD CARD ────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-bis-950 via-bis-900 to-bis-800 text-white shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8 space-y-4">
          {/* Top row: label + confidence */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
              Designated Indian Standard
            </span>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>National Standards Body of India</span>
              </span>
            </div>
          </div>

          {/* Standard Code + Title */}
          {isUnverified ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Standard Needs Verification</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                We could not find sufficient BIS evidence to confidently identify an applicable standard.
                Please verify manually using the BIS official repository or ask the AI assistant.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight break-all">
                {standardDetails.code}
              </div>
              <h3 className="text-sm sm:text-base font-medium text-slate-200 leading-snug">
                {standardDetails.title}
              </h3>
              <div className="flex items-center gap-1.5 pt-1 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recommended for your product</span>
              </div>
            </div>
          )}

          {/* Bottom row: Verify button only (no confidence badge) */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all duration-150"
            >
              <Search className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('step2.viewOfficialDoc')}</span>
              <ExternalLink className="w-3 h-3 text-amber-300" />
            </a>
          </div>
        </div>
      </div>

      {/* ── 2 + 3. WHY IT APPLIES + SCOPE (2-col grid) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Why This Standard Applies */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {t('step2.whyApplies')}
            </span>
          </div>

          {whyText ? (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {whyText.length > 350
                ? whyText.slice(0, 350) + '…'
                : whyText}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Explanation not available from the current BIS evidence.
            </p>
          )}

          {/* Product match chip */}
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
              {t('step2.scope')}
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
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>View Full Scope</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Scope information is not available in the current BIS evidence.
            </p>
          )}
        </div>
      </div>

      {/* ── 4. KEY REQUIREMENTS ──────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-700">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Key Requirements
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Extracted from BIS RAG evidence
          </span>
        </div>

        {keyRequirements.length > 0 ? (
          <>
            <ul className="space-y-2">
              {visibleRequirements.map((req, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed"
                >
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-bis-100 text-bis-800 text-[9px] font-extrabold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            {keyRequirements.length > 4 && (
              <button
                onClick={() => setShowAllRequirements(!showAllRequirements)}
                className="text-xs font-semibold text-bis-700 hover:text-bis-900 flex items-center gap-1 transition-colors mt-1"
              >
                {showAllRequirements ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>View All Requirements ({keyRequirements.length})</span>
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Detailed requirements could not be verified from the available BIS evidence.
          </p>
        )}
      </div>

      {/* ── 5. RELATED / REFERENCED STANDARDS ───────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {t('step2.relatedStandards')}
            </span>
          </div>
        </div>

        {parsedRelated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleRelated.map((rs, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs space-y-0.5 ${
                    rs.isPrimary
                      ? 'bg-bis-50 border-bis-200 shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 font-mono leading-tight">
                      {rs.code}
                    </span>
                    {rs.isPrimary && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded shrink-0">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  {rs.description && (
                    <p className="text-slate-600 leading-snug">{rs.description}</p>
                  )}
                </div>
              ))}
            </div>
            {parsedRelated.length > 3 && (
              <button
                onClick={() => setShowAllRelated(!showAllRelated)}
                className="text-xs font-semibold text-bis-700 hover:text-bis-900 flex items-center gap-1 transition-colors"
              >
                {showAllRelated ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>View Related Standards ({parsedRelated.length})</span>
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No verified related standards found.
          </p>
        )}
      </div>

      {/* ── 6. OFFICIAL BIS EVIDENCE ─────────────────────────────────────── */}
      {citations && citations.length > 0 ? (
        <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-bis-900 text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Official BIS Ground-Truth Evidence &amp; Sources
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {citations.length} source{citations.length !== 1 ? 's' : ''}
                  {standardDetails.evidenceDocument && (
                    <> &middot; Document: <span className="font-semibold text-slate-600">{standardDetails.evidenceDocument}</span></>
                  )}
                  {standardDetails.evidencePage != null && (
                    <> &middot; Page <span className="font-semibold text-slate-600">{standardDetails.evidencePage}</span></>
                  )}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg font-medium hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-bis-700" />
              BIS Verified
            </span>
          </div>
          <CitationsEvidenceGrid citations={citations} />
        </div>
      ) : standardDetails.evidenceDocument ? (
        /* Backend has evidence_document from vector search but no frontend citations */
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-bis-900 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Official BIS Ground-Truth Evidence &amp; Sources
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Source: <span className="font-semibold text-slate-600">Bureau of Indian Standards</span>
                {standardDetails.evidenceDocument && (
                  <> &middot; Document: <span className="font-semibold text-slate-600">{standardDetails.evidenceDocument}</span></>
                )}
                {standardDetails.evidencePage != null && (
                  <> &middot; Page <span className="font-semibold text-slate-600">{standardDetails.evidencePage}</span></>
                )}
              </p>
            </div>
          </div>
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bis-700 hover:text-bis-900 underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Source in Official BIS Repository
          </a>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Official BIS Evidence Not Available</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            No verified BIS source documents were retrieved for this standard. The recommendation
            is based on database matching only. Please verify manually via the official BIS repository.
          </p>
          <a
            href="https://www.services.bis.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit Official BIS Repository
          </a>
        </div>
      )}

      {/* ── 7. ASK AI (compact, no confidence score) ────────────────────── */}
      {onAskAI && !isUnverified && (
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-600">
            Have more questions about this standard?
          </p>
          <button
            onClick={() =>
              onAskAI(
                `Which Indian Standard applies to ${productName || 'my product'} and why? What are the key requirements?`
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors mt-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask Manak Setu AI about this standard
          </button>
        </div>
      )}

      {/* ── 8. BOTTOM NEXT-STEP CTA ──────────────────────────────────── */}
      {!isUnverified && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-900">
                Standard Identified ✓
              </p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                Your applicable Indian Standard has been identified.
              </p>
            </div>
          </div>

          <div className="pl-0 sm:pl-10 space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Next:
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              Check whether this product / standard is covered by a mandatory BIS certification
              or Quality Control Order (QCO).
            </p>
          </div>
        </div>
      )}

      {/* ── NAVIGATION BUTTONS ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: Product Profile</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95"
        >
          <span>{t('step2.continueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
