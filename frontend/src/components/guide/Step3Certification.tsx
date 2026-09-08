import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Gift,
  BookOpen,
  ExternalLink,
  Sparkles,
  ClipboardCheck,
  Info,
  Circle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { CertificationDetails } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';

interface Step3CertificationProps {
  productName: string;
  certificationDetails: CertificationDetails;
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

// Scale label helper — mirrors what the user selected in Step 1
const scaleLabel = (scale: string): string => {
  const map: Record<string, string> = {
    micro: 'Micro Enterprise (Investment < ₹1 Cr)',
    startup: 'Recognized Startup (DPIIT)',
    small: 'Small Enterprise (Investment < ₹10 Cr)',
    medium: 'Medium Enterprise (Investment < ₹50 Cr)',
    large: 'Large Scale Industry',
  };
  return map[scale] || scale;
};

// ── Compliance roadmap steps ─────────────────────────────────────────────────
const ROADMAP_STEPS = [
  { n: 1, label: 'Confirm Applicable Standard', desc: 'Verify the Indian Standard (IS) that governs your product.' },
  { n: 2, label: 'Check QCO Requirements', desc: 'Review the mandatory Quality Control Order and enforcement dates.' },
  { n: 3, label: 'Prepare Factory & Quality Controls', desc: 'Set up in-house testing equipment and SIT/QCP documentation.' },
  { n: 4, label: 'Complete Required Testing', desc: 'Arrange sample testing at a BIS-recognized laboratory.' },
  { n: 5, label: 'Prepare Application Documents', desc: 'Collect statutory documents per the BIS Form-V checklist.' },
  { n: 6, label: 'Apply for BIS Certification', desc: 'Submit application on manakonline.in portal and pay fees.' },
  { n: 7, label: 'BIS Assessment → Licence / ISI Mark', desc: 'Factory audit, test conformity review, and CM/L licence grant.' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const Step3Certification: React.FC<Step3CertificationProps> = ({
  productName,
  certificationDetails,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();
  const { guideData } = useProductContext();

  const [aiLoading, setAiLoading] = useState(false);

  const standardDetails = guideData?.standardDetails;
  const productProfile = guideData?.productProfile;
  const industryScale = productProfile?.industryScale ?? 'micro';

  const isMandatory = certificationDetails.isMandatory;
  const hasQco = !!certificationDetails.qcoName;

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

  // Checklist items — data-driven where possible
  const checklist = [
    {
      status: standardDetails?.code && standardDetails.code !== 'Data Not Available' ? 'done' : 'warn',
      label: 'Applicable Standard',
      note: standardDetails?.code && standardDetails.code !== 'Data Not Available'
        ? `${standardDetails.code} — Identified`
        : 'Needs Verification',
    },
    {
      status: hasQco ? 'done' : certificationDetails.isMandatory ? 'warn' : 'info',
      label: 'Applicable QCO',
      note: hasQco
        ? `${certificationDetails.qcoName} — Identified`
        : certificationDetails.isMandatory
        ? 'Mandatory — QCO details being verified'
        : 'No mandatory QCO notified',
    },
    { status: 'pending', label: 'Factory Requirements', note: 'To be reviewed in Step 4' },
    { status: 'pending', label: 'Testing Requirements', note: 'Step 4 — Testing & Labs' },
    { status: 'pending', label: 'Documents Checklist', note: 'Step 5 — Documents' },
    { status: 'pending', label: 'BIS Application', note: 'Step 6 — Application Process' },
  ];

  const statusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (s === 'warn') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    if (s === 'info') return <Info className="w-4 h-4 text-bis-500 shrink-0" />;
    return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 3 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s3Title') || 'Certification Scheme & Mandate'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Check whether BIS certification is required for your product, which scheme applies, and what you need to do next.
        </p>
      </div>

      {/* ── 1. CERTIFICATION STATUS CARD ─────────────────────────────── */}
      <div className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm space-y-3 ${
        isMandatory
          ? 'bg-rose-50 border-rose-200'
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          Certification Status
        </div>

        {/* Status pill */}
        <div className="flex flex-wrap items-center gap-3">
          {isMandatory ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-extrabold shadow-sm">
              <AlertCircle className="w-4 h-4" />
              BIS Certification Required
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-extrabold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              Voluntary Certification Available
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg bg-bis-100 border border-bis-200 text-bis-900 text-xs font-bold">
            {certificationDetails.scheme}
          </div>
        </div>

        {/* Short explanation */}
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {isMandatory
            ? hasQco
              ? `Your product is covered by a Quality Control Order (QCO). Certification is mandatory under the applicable regulatory requirements.`
              : `BIS certification is required for ${productName}. Verify applicable QCO details with BIS.`
            : `BIS certification for ${productName} is currently voluntary. You may voluntarily apply for an ISI Mark to demonstrate compliance.`}
        </p>

        {/* Applicability text if present */}
        {certificationDetails.applicability && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{certificationDetails.applicability}</span>
          </div>
        )}
      </div>

      {/* ── 2. APPLICABLE INDIAN STANDARD ────────────────────────────── */}
      {standardDetails && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-bis-700" />
            Your Applicable Indian Standard
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-2xl font-extrabold font-mono text-bis-900 tracking-tight">
                {standardDetails.code !== 'Data Not Available' ? standardDetails.code : 'Needs Verification'}
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {standardDetails.title}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selected from Step 2
              </div>
            </div>

            <a
              href={standardDetails.officialUrl || 'https://www.services.bis.gov.in'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-bis-200 bg-bis-50 hover:bg-bis-100 text-bis-900 text-xs font-bold transition-colors"
            >
              View Standard Details
              <ExternalLink className="w-3.5 h-3.5 text-bis-700" />
            </a>
          </div>
        </div>
      )}

      {/* ── 3. APPLICABLE QCO ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          <FileCheck2 className="w-3.5 h-3.5 text-bis-700" />
          Applicable Quality Control Order (QCO)
        </div>

        {hasQco ? (
          <>
            {/* QCO Title */}
            <div>
              <p className="text-sm font-extrabold text-slate-900 leading-snug">
                {certificationDetails.qcoName}
              </p>
            </div>

            {/* QCO meta-grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Gazette S.O. No.</div>
                <div className="font-mono font-semibold text-slate-800">
                  {certificationDetails.qcoNotification || <span className="text-amber-600">Needs Verification</span>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Notification Date</div>
                <div className="font-mono font-semibold text-slate-800">
                  {certificationDetails.notificationDate || <span className="text-amber-600">Needs Verification</span>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Effective Date</div>
                <div className="font-mono font-semibold text-slate-800">
                  {certificationDetails.effectiveDate || certificationDetails.complianceDeadline || <span className="text-amber-600">Needs Verification</span>}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Notifying Authority</div>
                <div className="font-semibold text-slate-800">
                  {certificationDetails.notifyingAuthority || 'DPIIT / MoC&I'}
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
              {certificationDetails.qcoNotification || 'No mandatory QCO notified yet for this standard.'}
            </p>
            {!isMandatory && (
              <p className="text-[11px] text-slate-500">
                Voluntary certification is available under Scheme-I (ISI Mark) without a QCO mandate.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 4. WHY IS CERTIFICATION REQUIRED? ─────────────────────────── */}
      {standardDetails?.whyItApplies && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <Info className="w-3.5 h-3.5 text-bis-700" />
            Why Is Certification Required?
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {standardDetails.whyItApplies}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-bis-600" />
              Source: Official BIS / Gazette
            </div>
            <a
              href={standardDetails.officialUrl || 'https://www.services.bis.gov.in'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-bis-700 hover:text-bis-900 underline transition-colors"
            >
              View Evidence <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── 5. WHAT YOU NEED TO DO ────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          What You Need To Do
        </div>

        <div className="space-y-2">
          {ROADMAP_STEPS.map((step, idx) => (
            <div key={step.n} className="flex items-start gap-3">
              {/* Number badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                idx < 2
                  ? 'bg-bis-900 text-white'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {step.n}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 py-1">
                <div className={`text-xs font-bold ${idx < 2 ? 'text-bis-900' : 'text-slate-800'}`}>
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  {step.desc}
                </div>
              </div>
              {/* Arrow connector except last */}
              {idx < ROADMAP_STEPS.length - 1 && (
                <div className="absolute left-8 mt-7 text-slate-300" style={{ display: 'none' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 6 + 7. COMPLIANCE CHECKLIST & MSME — 2-col grid on desktop ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── 6. COMPLIANCE CHECKLIST ──────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <ClipboardCheck className="w-3.5 h-3.5 text-bis-700" />
            Your Compliance Checklist
          </div>

          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs">
                {statusIcon(item.status)}
                <div className="min-w-0">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="text-slate-500 ml-1.5">— {item.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── 7. MSME APPLICABILITY ────────────────────────────────── */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-amber-800">
            <Gift className="w-3.5 h-3.5 text-amber-600" />
            MSME Applicability
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Your enterprise type</div>
            <div className="text-sm font-extrabold text-slate-900">
              {scaleLabel(industryScale)}
            </div>
          </div>

          {/* Show verified concession info or fallback */}
          {certificationDetails.msmeBenefitDetails ? (
            <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-300/60 text-xs text-amber-950 font-medium leading-relaxed">
              {certificationDetails.msmeBenefitDetails}
            </div>
          ) : certificationDetails.exemptions && certificationDetails.exemptions.length > 0 ? (
            <ul className="space-y-1.5">
              {certificationDetails.exemptions.map((ex, i) => (
                <li key={i} className="text-xs text-amber-900 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-amber-800 italic">
              Concession details not yet verified from backend. Check the Fee Estimator for the latest MSME rates.
            </p>
          )}

          <a
            href="https://www.bis.gov.in/other-function/msme/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 underline transition-colors"
          >
            View MSME Rules <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── 8. ASK MANAK SETU AI CARD ─────────────────────────────────── */}
      {onAskAI && (
        <div className="rounded-2xl border border-bis-200 bg-bis-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-bis-900">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-bis-900 uppercase tracking-wide">Ask Manak Setu AI</div>
              <div className="text-[11px] text-slate-500">Have a question about your certification requirements?</div>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-70"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Ask Manak Setu AI
          </button>
        </div>
      )}

      {/* ── 9. YOUR NEXT STEP ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          Your Next Step
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-bis-50 border border-bis-200">
            <FileCheck2 className="w-5 h-5 text-bis-800" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900">Testing & Laboratories</div>
            <div className="text-xs text-slate-500">Find the tests required for your product and suitable BIS laboratories.</div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Applicable Standard</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95"
        >
          <span>Continue to Testing & Labs</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
