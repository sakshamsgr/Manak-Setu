import React from 'react';
import { ExternalLink, ArrowLeft, RotateCcw, Printer, Clock, CheckCircle2 } from 'lucide-react';
import { ApplicationMilestone } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';

interface Step6ApplicationProps {
  productName: string;
  milestones: ApplicationMilestone[];
  onPrev: () => void;
  onRestart: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step6Application: React.FC<Step6ApplicationProps> = ({
  productName,
  milestones,
  onPrev,
  onRestart,
}) => {
  const { t } = useLanguage();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 rounded">
          Stage 6 of 6 • Final Licensing Roadmap
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s6Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s6Subtitle')}
        </p>
      </div>

      {/* Primary Manakonline CTA Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500 text-bis-950 rounded">
            Official Application Portal
          </span>
          <h3 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
            e-BIS Manakonline Portal (manakonline.in)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All statutory BIS applications (Form-I / Form-V), inspection fee payments, and laboratory test tracking are conducted online through the official e-BIS portal.
          </p>
        </div>

        <a
          href="https://www.manakonline.in"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-bis-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition-all shrink-0 transform active:scale-95"
        >
          <span>{t('s6ManakonlineCTA')}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Milestones Timeline */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
          {t('s6TimelineTitle')}
        </div>

        <div className="relative border-l-2 border-bis-200 ml-4 pl-6 sm:pl-8 space-y-6">
          {milestones.map((step) => (
            <div key={step.stepNumber} className="relative group">
              <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 rounded-full bg-bis-900 text-white font-extrabold text-xs flex items-center justify-center border-4 border-white shadow">
                {step.stepNumber}
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 group-hover:border-bis-300 transition-colors shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {step.subtitle && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-bis-700 bg-bis-100 px-2 py-0.5 rounded">
                        {step.subtitle}
                      </span>
                    )}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                      {step.title}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{step.timeline || 'Statutory Timeline'}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-bis-900 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-600 font-bold">Key Action:</span>
                    <span>{step.action || 'Complete statutory filing'}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {step.responsibleParty && (
                      <span><strong>Party: </strong>{step.responsibleParty}</span>
                    )}
                    {step.feeAmount && (
                      <span className="font-mono text-emerald-700 font-bold">Fee: ₹{step.feeAmount}</span>
                    )}
                    {step.sourceUrl && (
                      <a
                        href={step.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-bis-700 hover:text-bis-900 font-bold"
                      >
                        <span>Guidelines</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('prevStepBtn')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printGuideBtn')}</span>
          </button>

          <button
            onClick={onRestart}
            className="px-5 py-2.5 rounded-xl bg-bis-800 hover:bg-bis-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('s6RestartBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
