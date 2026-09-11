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
  Award,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { StandardDetails } from '../../types/compliance';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';

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
  const { guideData } = useProductContext();

  const [showFullScope, setShowFullScope] = useState(false);
  const [showAllRelated, setShowAllRelated] = useState(false);

  const activeTesting = guideData?.testingDetails;
  const activeCert = guideData?.certificationDetails;
  const activeDocs = guideData?.documentChecklist || [];
  const activeStd = guideData?.standardDetails || standardDetails;

  const isUnverified =
    !activeStd.code ||
    activeStd.code === 'Under Standard Identification' ||
    activeStd.code === 'Data Not Available';

  // Use reason from backend validation if available, fall back to whyItApplies
  const whyText = activeStd.reason || activeStd.whyItApplies || '';

  const parsedRelated = parseRelatedStandards(
    activeStd.relatedStandards || [],
    activeStd.code
  );

  // 1. Compliance Requirements
  const complianceReqs: string[] = [];
  if (!isUnverified && activeStd.code) {
    if (activeStd.whyItApplies && activeStd.whyItApplies.length > 20) {
      complianceReqs.push(activeStd.whyItApplies);
    } else if (activeStd.scope && activeStd.scope.length > 15) {
      complianceReqs.push(`Mandatory conformity to specifications defined under ${activeStd.code}: ${activeStd.scope}`);
    }
    if (activeStd.reason && activeStd.reason !== activeStd.whyItApplies) {
      complianceReqs.push(activeStd.reason);
    }
    if (activeCert?.keyConditions && activeCert.keyConditions.length > 0) {
      activeCert.keyConditions.forEach((cond) => {
        if (!complianceReqs.includes(cond)) {
          complianceReqs.push(cond);
        }
      });
    }
  }

  // 2. Testing Requirements (from verified routine and type tests)
  const testingReqs: string[] = [];
  if (activeTesting?.routineTests && activeTesting.routineTests.length > 0) {
    activeTesting.routineTests.slice(0, 3).forEach((t) => {
      const clauseStr = t.clause ? ` (${t.clause})` : '';
      const methodStr = t.testMethod && !t.testMethod.toLowerCase().includes('bis standard method') ? ` — Method: ${t.testMethod}` : '';
      testingReqs.push(`${t.name}${clauseStr}: Routine in-house factory test required for every production unit${methodStr}.`);
    });
  } else if (activeTesting?.requiredTests && activeTesting.requiredTests.length > 0) {
    activeTesting.requiredTests.slice(0, 3).forEach((t) => {
      const clauseStr = t.clause ? ` (${t.clause})` : '';
      testingReqs.push(`${t.name}${clauseStr}: ${t.description || 'Statutory laboratory verification test.'}`);
    });
  }

  // 3. Certification / QCO
  const certReqs: string[] = [];
  if (activeCert) {
    if (activeCert.qcoName) {
      certReqs.push(`Quality Control Order: ${activeCert.qcoName}${activeCert.notifyingAuthority ? ` (Notified by ${activeCert.notifyingAuthority})` : ''}.`);
    }
    if (activeCert.scheme) {
      certReqs.push(`Certification Scheme: ${activeCert.scheme}${activeCert.isMandatory ? ' (Mandatory for sale in India)' : ' (Voluntary certification)'}.`);
    }
    if (activeCert.complianceDeadline && activeCert.complianceDeadline !== 'None') {
      certReqs.push(`Enforcement Deadline: Compliance required from ${activeCert.complianceDeadline}.`);
    }
  }

  // 4. Documents / Records
  const documentReqs: string[] = [];
  if (activeDocs && activeDocs.length > 0) {
    activeDocs.slice(0, 3).forEach((doc) => {
      documentReqs.push(`${doc.title}: ${doc.description || 'Statutory application documentation requirement.'}`);
    });
  }

  // Source & Citation
  const evidenceSource =
    activeStd.evidenceDocument ||
    activeStd.officialSource ||
    (citations && citations.length > 0 && citations[0].document ? citations[0].document : null) ||
    (activeStd.code && !isUnverified ? `Bureau of Indian Standards (${activeStd.code})` : null);

  const evidenceUrl =
    activeStd.officialUrl ||
    (citations && citations.length > 0 && citations[0].url ? citations[0].url : null);

  const hasAnyRequirements =
    complianceReqs.length > 0 ||
    testingReqs.length > 0 ||
    certReqs.length > 0 ||
    documentReqs.length > 0;

  // Visible related standards (first 3 unless expanded)
  const visibleRelated = showAllRelated ? parsedRelated : parsedRelated.slice(0, 3);

  // Clean scope text — truncate if too long
  const scopeText = activeStd.scope || '';
  const truncatedScope = scopeText.length > 250 ? scopeText.slice(0, 250) + '…' : scopeText;
  const displayScope = showFullScope ? scopeText : truncatedScope;

  // Build official BIS URL
  const officialUrl =
    activeStd.officialUrl ||
    (activeStd.code && activeStd.code !== 'Under Standard Identification'
      ? `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent(
          activeStd.code.replace(/[^a-zA-Z0-9]/g, '')
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
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-700">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              KEY REQUIREMENTS
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Extracted from BIS RAG evidence
          </span>
        </div>

        {hasAnyRequirements ? (
          <div className="space-y-4 pt-1">
            {/* Compliance Requirements */}
            {complianceReqs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-bis-700" />
                  <span>Compliance Requirements</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {complianceReqs.map((req, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-bis-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Testing Requirements */}
            {testingReqs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Testing Requirements</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {testingReqs.map((req, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Certification / QCO */}
            {certReqs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Certification / QCO</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {certReqs.map((req, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documents / Records */}
            {documentReqs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>Documents / Records</span>
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {documentReqs.map((req, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-sky-600 font-bold shrink-0 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source / Citation */}
            {evidenceSource && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Source:</span>
                  <span>{evidenceSource}</span>
                </div>
                {evidenceUrl && (
                  <a
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-bis-700 hover:text-bis-900 font-semibold"
                  >
                    <span>View Official BIS Evidence</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-3 text-center space-y-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-medium text-slate-600">
              No verified key requirements were found in the available BIS evidence for this standard.
            </p>
            <p className="text-[11px] text-slate-400">
              Please verify the applicable requirements using the official BIS source or ask Manak Setu AI.
            </p>
          </div>
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
