import React, { useState } from 'react';
import { 
  Package, 
  BookOpen, 
  ShieldCheck, 
  FlaskConical, 
  FileText, 
  FileCheck2, 
  RotateCcw, 
  Printer, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ProductCertificationGuideData, ProductProfile } from '../../types/compliance';
import { Step1Product } from './Step1Product';
import { Step2Standard } from './Step2Standard';
import { Step3Certification } from './Step3Certification';
import { Step4Testing } from './Step4Testing';
import { Step5Documents } from './Step5Documents';
import { Step6Application } from './Step6Application';
import { Citation } from '../../types/chat';
import { useLanguage } from '../../context/LanguageContext';

interface ProductCertificationGuideProps {
  guideData: ProductCertificationGuideData;
  onRestart: () => void;
  onAskAI: (question: string) => Promise<{ reply: string; citations: Citation[] }>;
  onJumpToEstimator?: () => void;
}

export const ProductCertificationGuide: React.FC<ProductCertificationGuideProps> = ({
  guideData,
  onRestart,
  onAskAI,
  onJumpToEstimator,
}) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [productProfile, setProductProfile] = useState<ProductProfile>(guideData.productProfile);

  const handleUpdateProfile = (updated: Partial<ProductProfile>) => {
    setProductProfile((prev) => ({ ...prev, ...updated }));
  };

  const steps = [
    { id: 1, label: t('step1'), icon: <Package className="w-4 h-4" /> },
    { id: 2, label: t('step2'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: t('step3'), icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 4, label: t('step4'), icon: <FlaskConical className="w-4 h-4" /> },
    { id: 5, label: t('step5'), icon: <FileText className="w-4 h-4" /> },
    { id: 6, label: t('step6'), icon: <FileCheck2 className="w-4 h-4" /> },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-slide-up">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onRestart}
            className="p-2 rounded-xl text-slate-500 hover:text-bis-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('newConsultationBtn')}</span>
          </button>

          <span className="text-slate-300">|</span>

          <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
            <span>Product:</span>
            <span className="px-2 py-0.5 rounded-md bg-bis-100 text-bis-900 font-mono">
              {productProfile.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('printGuideBtn')}</span>
          </button>

          {onJumpToEstimator && (
            <button
              onClick={onJumpToEstimator}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-bis-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>50% MSME Fee Calc</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 6-Stage Visual Stepper Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
              {t('guideTitle')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('guideSubtitle')} <strong className="text-slate-800">{productProfile.name}</strong>
            </p>
          </div>

          <span className="text-xs font-bold text-bis-800 bg-bis-50 border border-bis-200 px-3 py-1 rounded-full">
            Stage {currentStep} of 6
          </span>
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          {steps.map((s) => {
            const isCurrent = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`p-2.5 rounded-xl text-left transition-all flex flex-col justify-between space-y-1.5 border ${
                  isCurrent
                    ? 'bg-bis-900 text-white border-bis-900 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold ${isCurrent ? 'text-amber-300' : 'text-slate-400'}`}>
                    0{s.id}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className={isCurrent ? 'text-amber-400' : 'text-slate-400'}>
                      {s.icon}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Views Content Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        {currentStep === 1 && (
          <Step1Product
            productProfile={productProfile}
            onUpdateProfile={handleUpdateProfile}
            onNext={() => setCurrentStep(2)}
            onAskAI={onAskAI}
          />
        )}

        {currentStep === 2 && (
          <Step2Standard
            productName={productProfile.name}
            standardDetails={guideData.standardDetails}
            citations={guideData.citations}
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
            onAskAI={onAskAI}
          />
        )}

        {currentStep === 3 && (
          <Step3Certification
            productName={productProfile.name}
            certificationDetails={guideData.certificationDetails}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
            onAskAI={onAskAI}
          />
        )}

        {currentStep === 4 && (
          <Step4Testing
            productName={productProfile.name}
            testingDetails={guideData.testingDetails}
            onNext={() => setCurrentStep(5)}
            onPrev={() => setCurrentStep(3)}
            onAskAI={onAskAI}
          />
        )}

        {currentStep === 5 && (
          <Step5Documents
            productName={productProfile.name}
            documents={guideData.documentChecklist}
            onNext={() => setCurrentStep(6)}
            onPrev={() => setCurrentStep(4)}
            onAskAI={onAskAI}
          />
        )}

        {currentStep === 6 && (
          <Step6Application
            productName={productProfile.name}
            milestones={guideData.applicationMilestones}
            onPrev={() => setCurrentStep(5)}
            onRestart={onRestart}
            onAskAI={onAskAI}
          />
        )}
      </div>
    </div>
  );
};
