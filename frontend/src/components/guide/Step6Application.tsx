import React from 'react';
import { ExternalLink, ArrowLeft, RotateCcw, Printer, Clock, CheckCircle2, Package, FileCheck, ShieldCheck, FlaskConical, FolderCheck, Send, Layers, Sparkles } from 'lucide-react';
import { ApplicationMilestone } from '../../types/compliance';
import { PageInfoButton } from '../common/PageInfoButton';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';

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
  onAskAI,
}) => {
  const { t } = useLanguage();
  const { guideData, productProfile } = useProductContext();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
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
        <PageInfoButton
          sectionId="section-application"
          tooltip="Learn about the e-BIS Application Process in the Guide"
          variant="light"
          size="sm"
        />
      </div>

      {/* 6-Stage Completed Certification Journey Summary Card (Prompt Section 9) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-bis-100 text-bis-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Completed Certification Journey Summary
              </h3>
              <p className="text-xs text-slate-500">
                Product roadmap synthesized across all 6 statutory stages
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready for Filing</span>
          </span>
        </div>

        {/* 6-Stage Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Stage 1: Product Profile */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>Stage 1 • Product</span>
              <Package className="w-3.5 h-3.5 text-bis-700" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {productProfile.name || productName || 'Selected Product'}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {productProfile.industryScale ? `${productProfile.industryScale.toUpperCase()} Scale` : 'Micro/SME'} • {productProfile.isForeign ? 'Foreign Unit' : 'Domestic Facility'}
            </p>
          </div>

          {/* Stage 2: Applicable Standard */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>Stage 2 • Standard</span>
              <FileCheck className="w-3.5 h-3.5 text-bis-700" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-bis-900 truncate">
              {guideData?.standardDetails?.code || 'IS Standard'}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">
              {guideData?.standardDetails?.title || 'Indian Standard Specification'}
            </p>
          </div>

          {/* Stage 3: Certification / QCO */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>Stage 3 • Scheme</span>
              <ShieldCheck className="w-3.5 h-3.5 text-bis-700" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {guideData?.certificationDetails?.scheme || 'Scheme-I (ISI Mark)'}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {guideData?.certificationDetails?.isMandatory ? 'Mandatory under QCO' : 'Voluntary Conformity Assessment'}
            </p>
          </div>

          {/* Stage 4: Testing & Labs */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>Stage 4 • Testing & Labs</span>
              <FlaskConical className="w-3.5 h-3.5 text-bis-700" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {(guideData?.testingDetails?.routineTests?.length || 0) + (guideData?.testingDetails?.requiredTests?.length || 0)} Specified Tests
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {guideData?.testingDetails?.laboratories?.length ? `${guideData.testingDetails.laboratories.length} Recognized Labs` : 'In-House & BIS Labs'}
            </p>
          </div>

          {/* Stage 5: Documents */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-500">
              <span>Stage 5 • Documents</span>
              <FolderCheck className="w-3.5 h-3.5 text-bis-700" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {guideData?.documentChecklist?.length || 6} Statutory Files
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Form-V, Layout, Calibration & Machinery Schedules
            </p>
          </div>

          {/* Stage 6: Application */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-emerald-800">
              <span>Stage 6 • Portal</span>
              <Send className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="font-bold text-xs sm:text-sm text-emerald-950 truncate">
              e-BIS Manakonline
            </div>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Form-V Statutory Submission Ready
            </p>
          </div>
        </div>
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

      {/* Ask AI Helper */}
      {onAskAI && (
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-600">
            Have questions about portal submission, factory audit, or licensing timelines?
          </p>
          <button
            type="button"
            onClick={() =>
              onAskAI(
                productName
                  ? `What are the step-by-step application milestones and audit requirements for ${productName}?`
                  : 'What are the step-by-step application milestones and audit requirements under e-BIS Manakonline?'
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bis-900 hover:text-bis-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Ask Manak Setu AI about Application Process
          </button>
        </div>
      )}

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
