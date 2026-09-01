import React from 'react';
import { ShieldCheck, Award, FileCheck2, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Gift, Info } from 'lucide-react';
import { CertificationDetails } from '../../types/compliance';
import { StepContextualAI } from './StepContextualAI';
import { Citation } from '../../types/chat';
import { useLanguage } from '../../context/LanguageContext';

interface Step3CertificationProps {
  productName: string;
  certificationDetails: CertificationDetails;
  onNext: () => void;
  onPrev: () => void;
  onAskAI: (question: string) => Promise<{ reply: string; citations: Citation[] }>;
}

export const Step3Certification: React.FC<Step3CertificationProps> = ({
  productName,
  certificationDetails,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 3 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s3Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s3Subtitle')}
        </p>
      </div>

      {/* Applicability Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {t('s3Applicability')}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {certificationDetails.isMandatory ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs sm:text-sm font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{t('s3MandatoryNotice')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t('s3VoluntaryNotice')}</span>
                </span>
              )}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-bis-50 border border-bis-200 text-bis-900 text-xs font-bold shrink-0">
            {certificationDetails.scheme}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-700">Quality Control Order (QCO) Reference:</div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
            {certificationDetails.qcoNotification}
          </p>
        </div>
      </div>

      {/* Conditions & Exemptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conditions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
            <FileCheck2 className="w-4 h-4 text-bis-800" />
            <span>{t('s3Conditions')}</span>
          </div>
          <ul className="space-y-2">
            {certificationDetails.keyConditions.map((cond, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-bis-700 shrink-0 mt-0.5" />
                <span>{cond}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* MSME Exemptions & Subsidies */}
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>MSME & Startup Concessions</span>
          </div>
          <ul className="space-y-2">
            {certificationDetails.exemptions.map((ex, i) => (
              <li key={i} className="text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
          <span>{t('s3ContinueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Embedded Contextual AI Assistant */}
      <StepContextualAI
        stepName="Step 3: Certification & QCO Scheme"
        productName={productName}
        suggestedQuestions={[
          'What is the penalty for selling non-ISI marked goods under this Quality Control Order?',
          'What are the annual minimum marking fee rates for this scheme?',
          'Is testing required for each model variety separately?',
        ]}
        onAskQuestion={onAskAI}
      />
    </div>
  );
};
