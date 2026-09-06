import React, { useEffect } from 'react';
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
  Database,
  Sparkles,
  Bookmark,
  Check,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { useProductContext } from '../../context/ProductContext';
import { Step1Product } from './Step1Product';
import { Step2Standard } from './Step2Standard';
import { Step3Certification } from './Step3Certification';
import { Step4Testing } from './Step4Testing';
import { Step5Documents } from './Step5Documents';
import { Step6Application } from './Step6Application';
import { useLanguage } from '../../context/LanguageContext';

interface ProductCertificationGuideProps {
  onJumpToEstimator?: () => void;
  onOpenAssistant?: (prompt?: string) => void;
}

export const ProductCertificationGuide: React.FC<ProductCertificationGuideProps> = ({
  onJumpToEstimator,
  onOpenAssistant,
}) => {
  const { t } = useLanguage();
  const { 
    productProfile, 
    guideData, 
    activeStep, 
    setActiveStep, 
    updateProductProfile, 
    askContextualAI, 
    resetJourney,
    saveJourney
  } = useProductContext();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // FIX: Immediately skip Step 1 upon entering the guide, because we filled it on the Home page.
  // This preserves Step 1 in the navigation bar but avoids showing it twice in a row.
  useEffect(() => {
    if (activeStep === 1) {
      setActiveStep(2);
    }
    // We strictly only want this to run once when the guide completely mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!guideData) return null;

  // STRICT ZERO-HALLUCINATION GUARD: Check if the parser returned our "Not Found" fallback state
  const isNotFound = guideData.standardDetails.code === 'Data Not Available';

  const steps = [
    { id: 1, label: t('productGuide.step1') || 'Product Profile', icon: <Package className="w-4 h-4" /> },
    { id: 2, label: t('productGuide.step2') || 'Applicable Standard', icon: <BookOpen className="w-4 h-4" /> },
    { id: 3, label: t('productGuide.step3') || 'Certification Scheme & QCO', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 4, label: t('productGuide.step4') || 'Testing & Labs', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 5, label: t('productGuide.step5') || 'Documents Checklist', icon: <FileText className="w-4 h-4" /> },
    { id: 6, label: t('productGuide.step6') || 'Application Process', icon: <FileCheck2 className="w-4 h-4" /> },
  ];

  const currentStepObj = steps.find((s) => s.id === activeStep) || steps[0];

  const handlePrint = () => {
    window.print();
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      const res = await saveJourney();
      setSaveSuccess(res.message || 'Saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      setSaveSuccess('Saved locally');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepAskAI = async (query: string): Promise<{ reply: string; citations: any[] }> => {
    if (onOpenAssistant) {
      onOpenAssistant(query);
    }
    return askContextualAI(query);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in print:p-0">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={resetJourney}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-bis-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('productGuide.newSearch') || 'New Product Search'}</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Product:</span>
            <span className="px-2.5 py-1 rounded-md bg-bis-100 text-bis-900 font-mono font-bold">
              {productProfile.name || 'Product'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Progress Button */}
          <button
            onClick={handleSaveProgress}
            disabled={isSaving || isNotFound}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
            title="Save your Product Guide search, identified standard, and active step to resume later"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-bis-700" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>{saveSuccess || (isSaving ? 'Saving...' : 'Save Progress')}</span>
          </button>

          {onOpenAssistant && (
            <button
              onClick={() => onOpenAssistant()}
              className="px-3.5 py-1.5 rounded-xl bg-bis-900 hover:bg-bis-800 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('assistant.floatingBtn') || '✨ Ask Manak Setu AI'}</span>
            </button>
          )}

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
            <span className="text-xs font-bold px-3 py-1 bg-bis-50 text-bis-800 border border-bis-200 rounded-full">
              Step {activeStep} of 6
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
            {steps.map((step) => {
              const isCurrent = step.id === activeStep;
              const isPast = step.id < activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-bis-900 text-white font-bold shadow-xs'
                      : isPast
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-bis-800 text-amber-400' : isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
                  </div>
                  <span className="text-[11px] truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Roadmap Step Container */}
      <div className="w-full">
        {isNotFound ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Database className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                {guideData.standardDetails.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {guideData.standardDetails.whyItApplies || guideData.standardDetails.scope}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-left space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Zero-Hallucination Policy Active</span>
              </div>
              <p>
                Our compliance engine strictly refuses to guess or invent standards when exact matches are missing from the verified database.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={resetJourney}
                className="px-6 py-2.5 bg-bis-900 hover:bg-bis-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Try Another Search Query
              </button>
              {onOpenAssistant && (
                <button
                  onClick={() => onOpenAssistant(`Is there any Indian Standard applicable for ${productProfile.name}?`)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-bis-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Assistant Directly</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeStep === 1 && (
              <Step1Product
                productProfile={productProfile}
                onUpdateProfile={updateProductProfile}
                onNext={() => setActiveStep(2)}
              />
            )}
            {activeStep === 2 && (
              <Step2Standard
                productName={productProfile.name}
                standardDetails={guideData.standardDetails}
                citations={guideData.citations}
                onNext={() => setActiveStep(3)}
                onPrev={() => setActiveStep(1)}
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 3 && (
              <Step3Certification
                productName={productProfile.name}
                certificationDetails={guideData.certificationDetails}
                onNext={() => setActiveStep(4)}
                onPrev={() => setActiveStep(2)}
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 4 && (
              <Step4Testing
                productName={productProfile.name}
                testingDetails={guideData.testingDetails}
                onNext={() => setActiveStep(5)}
                onPrev={() => setActiveStep(3)}
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 5 && (
              <Step5Documents
                productName={productProfile.name}
                documents={guideData.documentChecklist}
                onNext={() => setActiveStep(6)}
                onPrev={() => setActiveStep(4)}
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 6 && (
              <Step6Application
                productName={productProfile.name}
                milestones={guideData.applicationMilestones}
                onPrev={() => setActiveStep(5)}
                onRestart={resetJourney}
                onAskAI={handleStepAskAI}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};