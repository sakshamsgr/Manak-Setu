import React from 'react';
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
  ArrowRight,
  AlertTriangle,
  Database
} from 'lucide-react';
import { useProductContext } from '../../context/ProductContext';
import { Step1Product } from './Step1Product';
import { Step2Standard } from './Step2Standard';
import { Step3Certification } from './Step3Certification';
import { Step4Testing } from './Step4Testing';
import { Step5Documents } from './Step5Documents';
import { Step6Application } from './Step6Application';
import { RightSideAssistant } from './RightSideAssistant';
import { useLanguage } from '../../context/LanguageContext';

interface ProductCertificationGuideProps {
  onJumpToEstimator?: () => void;
}

export const ProductCertificationGuide: React.FC<ProductCertificationGuideProps> = ({
  onJumpToEstimator,
}) => {
  const { t } = useLanguage();
  const { 
    productProfile, 
    guideData, 
    activeStep, 
    setActiveStep, 
    updateProductProfile, 
    askContextualAI, 
    resetJourney 
  } = useProductContext();

  if (!guideData) return null;

  // STRICT ZERO-HALLUCINATION GUARD: Check if the parser returned our "Not Found" fallback state
  const isNotFound = guideData.standardDetails.code === 'Data Not Available';

  const steps = [
    { id: 1, label: t('productGuide.step1') || 'Product Profile', icon: <Package className="w-4 h-4" /> },
    { id: 2, label: t('productGuide.step2') || 'Applicable Standard', icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: t('productGuide.step3') || 'Certification Scheme', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 4, label: t('productGuide.step4') || 'Testing Requirements', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 5, label: t('productGuide.step5') || 'Document Checklist', icon: <FileText className="w-4 h-4" /> },
    { id: 6, label: t('productGuide.step6') || 'Application Process', icon: <FileCheck2 className="w-4 h-4" /> },
  ];

  const currentStepObj = steps.find(s => s.id === activeStep) || steps[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-slide-up">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={resetJourney}
            className="p-2 rounded-xl text-slate-500 hover:text-bis-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('productGuide.newConsultation') || 'New Consultation'}</span>
          </button>

          <span className="text-slate-300">|</span>

          <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
            <span>Product:</span>
            <span className="px-2.5 py-1 rounded-md bg-bis-100 text-bis-900 font-mono font-bold">
              {productProfile.name || 'Product'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={isNotFound}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('productGuide.printGuide') || 'Print Guide'}</span>
          </button>

          {onJumpToEstimator && (
            <button
              onClick={onJumpToEstimator}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-bis-950 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>{t('productGuide.msmeCalc') || 'MSME Fee Estimator'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conditionally Render Stepper Header (Hide if Not Found) */}
      {!isNotFound && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                {t('productGuide.title') || 'Product Certification Roadmap'}
              </h1>
              <p className="text-xs text-slate-500">
                {t('productGuide.subtitle') || 'Compliance guide for'} <strong className="text-slate-800">{productProfile.name || 'Product'}</strong>
              </p>
            </div>

            <span className="text-xs font-bold text-bis-800 bg-bis-50 border border-bis-200 px-3 py-1 rounded-full">
              Stage {activeStep} of 6
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
            {steps.map((s) => {
              const isCurrent = activeStep === s.id;
              const isCompleted = activeStep > s.id;

              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
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
      )}

      {/* Two-Column Grid: Left Guide Content (65%) + Right Sticky Assistant (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Active Step Details OR Not Found State */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          
          {isNotFound ? (
            /* --- ZERO-HALLUCINATION FALLBACK UI --- */
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-5">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-black text-slate-900">Standard Not Found</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our system enforces strict compliance accuracy. We currently do not have the Indian Standard or QCO indexed in our RAG database for <strong className="text-slate-800">"{productProfile.name}"</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                <Database className="w-4 h-4 text-slate-400" />
                <span>Zero-Hallucination Protocol Active</span>
              </div>
              <button
                onClick={resetJourney}
                className="mt-4 px-6 py-2.5 bg-bis-900 hover:bg-bis-800 text-white font-bold text-sm rounded-xl shadow transition transform active:scale-95"
              >
                Search Another Product
              </button>
            </div>
          ) : (
            /* --- NORMAL 6-STAGE RENDER --- */
            <>
              {activeStep === 1 && (
                <Step1Product
                  productProfile={productProfile}
                  onUpdateProfile={updateProductProfile}
                  onNext={() => setActiveStep(2)}
                  onAskAI={(q) => askContextualAI(q)}
                />
              )}
              {activeStep === 2 && (
                <Step2Standard
                  productName={productProfile.name}
                  standardDetails={guideData.standardDetails}
                  citations={guideData.citations}
                  onNext={() => setActiveStep(3)}
                  onPrev={() => setActiveStep(1)}
                  onAskAI={(q) => askContextualAI(q)}
                />
              )}
              {activeStep === 3 && (
                <Step3Certification
                  productName={productProfile.name}
                  certificationDetails={guideData.certificationDetails}
                  onNext={() => setActiveStep(4)}
                  onPrev={() => setActiveStep(2)}
                  onAskAI={(q) => askContextualAI(q)}
                />
              )}
              {activeStep === 4 && (
                <Step4Testing
                  productName={productProfile.name}
                  testingDetails={guideData.testingDetails}
                  onNext={() => setActiveStep(5)}
                  onPrev={() => setActiveStep(3)}
                  onAskAI={(q) => askContextualAI(q)}
                />
              )}
              {activeStep === 5 && (
                <Step5Documents
                  productName={productProfile.name}
                  documents={guideData.documentChecklist}
                  onNext={() => setActiveStep(6)}
                  onPrev={() => setActiveStep(4)}
                  onAskAI={(q) => askContextualAI(q)}
                />
              )}
              {activeStep === 6 && (
                <Step6Application
                  productName={productProfile.name}
                  milestones={guideData.applicationMilestones}
                  onPrev={() => setActiveStep(5)}
                  onRestart={resetJourney}
                  onAskAI={(q) => askContextualAI(q)}
                />
              )}
            </>
          )}
        </div>

        {/* Right Column: Persistent BIS RAG AI Assistant with PDF & Photo Upload */}
        <div className="lg:col-span-4">
          <RightSideAssistant
            productName={productProfile.name}
            activeStepName={isNotFound ? 'Database Inquiry' : currentStepObj.label}
            onAskQuestion={askContextualAI}
          />
        </div>
      </div>
    </div>
  );
};