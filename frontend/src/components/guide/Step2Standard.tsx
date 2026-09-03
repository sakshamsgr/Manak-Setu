import React from 'react';
import { BookOpen, ExternalLink, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Layers, FileText } from 'lucide-react';
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

export const Step2Standard: React.FC<Step2StandardProps> = ({
  productName,
  standardDetails,
  citations,
  onNext,
  onPrev,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 2 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s2Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s2Subtitle')}
        </p>
      </div>

      {/* Main Standard Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-bis-950 via-bis-900 to-bis-800 text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
            Designated Indian Standard
          </span>
          <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>National Standards Body of India</span>
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {standardDetails.code}
          </div>
          <h3 className="text-sm sm:text-base font-medium text-slate-200">
            {standardDetails.title}
          </h3>
        </div>

        {/* Action Link to Official Portal */}
        <div className="pt-2">
          <a
            href={standardDetails.officialUrl || 'https://www.services.bis.gov.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors"
          >
            <span>{t('s2ViewOfficialDoc')}</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
          </a>
        </div>
      </div>

      {/* Scope & Why It Applies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-bis-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('s2WhyApplies')}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {standardDetails.whyItApplies}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-bis-900">
            <FileText className="w-4 h-4 text-bis-700" />
            <span>{t('s2Scope')}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {standardDetails.scope}
          </p>
        </div>
      </div>

      {/* Related Standards */}
      {standardDetails.relatedStandards && standardDetails.relatedStandards.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
            <Layers className="w-4 h-4 text-bis-700" />
            <span>{t('s2RelatedStandards')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {standardDetails.relatedStandards.map((rs, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800">
                • {rs}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ground-truth Citations */}
      {citations && citations.length > 0 && (
        <CitationsEvidenceGrid citations={citations} />
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
          <span>{t('s2ContinueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
