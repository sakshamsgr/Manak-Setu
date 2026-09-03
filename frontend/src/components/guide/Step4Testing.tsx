import React from 'react';
import { FlaskConical, CheckCircle2, ArrowRight, ArrowLeft, Building2, Layers, AlertCircle, FileCheck } from 'lucide-react';
import { TestingDetails } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';

interface Step4TestingProps {
  productName: string;
  testingDetails: TestingDetails;
  onNext: () => void;
  onPrev: () => void;
  onAskAI: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step4Testing: React.FC<Step4TestingProps> = ({
  productName,
  testingDetails,
  onNext,
  onPrev,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 4 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s4Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s4Subtitle')}
        </p>
      </div>

      {/* Required Laboratory Tests List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
          <FlaskConical className="w-4 h-4 text-bis-800" />
          <span>{t('s4RequiredTests')}</span>
        </div>

        {testingDetails.requiredTests && testingDetails.requiredTests.length > 0 ? (
          <div className="space-y-3">
            {testingDetails.requiredTests.map((test, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-bis-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-bis-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{test.name}</span>
                  </h4>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                      test.type === 'Routine Test'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-bis-100 text-bis-900'
                    }`}
                  >
                    {test.type}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  {test.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
            <p className="text-xs font-bold text-slate-700">
              No specific test clauses extracted in current document slice.
            </p>
            <p className="text-[11px] text-slate-500">
              Ask the persistent <strong>BIS AI Assistant</strong> on the right to retrieve specific routine and type tests under this standard.
            </p>
          </div>
        )}
      </div>

      {/* Laboratory Facility & Sampling Protocol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
            <Building2 className="w-4 h-4 text-bis-700" />
            <span>{t('s4LabInfo')}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {testingDetails.labInfo}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
            <FileCheck className="w-4 h-4 text-amber-600" />
            <span>Factory Audit Sampling Protocol</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {testingDetails.samplingProtocol}
          </p>
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
          <span>{t('s4ContinueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};
