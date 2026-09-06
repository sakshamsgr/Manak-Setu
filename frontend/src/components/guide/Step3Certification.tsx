import React from 'react';
import { ShieldCheck, FileCheck2, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Gift } from 'lucide-react';
import { CertificationDetails } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';

interface Step3CertificationProps {
  productName: string;
  certificationDetails: CertificationDetails;
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step3Certification: React.FC<Step3CertificationProps> = ({
  productName,
  certificationDetails,
  onNext,
  onPrev,
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

        {/* QCO Information Card */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-bis-700" />
            <span>Quality Control Order (QCO) Regulatory Framework</span>
          </div>

          {certificationDetails.qcoName ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-bis-700 tracking-wider">Order Title</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{certificationDetails.qcoName}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                {certificationDetails.qcoNotification && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Gazette S.O. Number</span>
                    <p className="font-mono font-semibold text-slate-800">{certificationDetails.qcoNotification}</p>
                  </div>
                )}
                {certificationDetails.notifyingAuthority && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Notifying Authority</span>
                    <p className="font-semibold text-slate-800">{certificationDetails.notifyingAuthority}</p>
                  </div>
                )}
                {certificationDetails.notificationDate && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Notification Date</span>
                    <p className="font-mono font-semibold text-slate-800">{certificationDetails.notificationDate}</p>
                  </div>
                )}
                {certificationDetails.complianceDeadline && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-700">Enforcement Deadline</span>
                    <p className="font-mono font-bold text-amber-900">{certificationDetails.complianceDeadline}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
              {certificationDetails.qcoNotification || 'No mandatory QCO notified yet for this standard. Voluntary certification available.'}
            </p>
          )}
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
            {certificationDetails.keyConditions && certificationDetails.keyConditions.length > 0 ? (
              certificationDetails.keyConditions.map((cond, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-bis-700 shrink-0 mt-0.5" />
                  <span>{cond}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-600">Standard statutory testing and factory audit conditions apply under Scheme-I.</li>
            )}
          </ul>
        </div>

        {/* MSME Exemptions & Subsidies */}
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
            <Gift className="w-4 h-4 text-amber-600" />
            <span>MSME & Startup Statutory Concessions</span>
          </div>
          <div className="space-y-2">
            {certificationDetails.msmeBenefitDetails ? (
              <p className="text-xs text-amber-950 font-medium leading-relaxed p-3 rounded-xl bg-amber-100/60 border border-amber-300/60">
                {certificationDetails.msmeBenefitDetails}
              </p>
            ) : null}
            <ul className="space-y-2">
              {certificationDetails.exemptions && certificationDetails.exemptions.map((ex, i) => (
                <li key={i} className="text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
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
    </div>
  );
};
