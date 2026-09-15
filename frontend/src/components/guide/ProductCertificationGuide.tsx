import React, { useEffect, useState } from 'react';
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
import { useProductContext } from '../../context/ProductContext';
import { Step1Product } from './Step1Product';
import { Step2Standard } from './Step2Standard';
// Note: Step3Certification import has been removed because it is now merged into Step2!
import { Step4Testing } from './Step4Testing';
import { Step5Documents } from './Step5Documents';
import { Step6Application } from './Step6Application';
import { PageInfoButton } from '../common/PageInfoButton';
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

  // Immediately skip Step 1 upon entering the guide, because we filled it on the Home page.
  useEffect(() => {
    if (activeStep === 1) {
      setActiveStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NEW FIX: Auto-scroll to the top of the window whenever the step changes!
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  if (!guideData) return null;

  // STRICT ZERO-HALLUCINATION GUARD
  const isNotFound = guideData.standardDetails.code === 'Data Not Available';

  // FIX: Updated to 5 Steps! (Step 2 and 3 are now merged)
  const steps = [
    { id: 1, label: t('productGuide.step1') || 'Product Profile', icon: <Package className="w-4 h-4" /> },
    { id: 2, label: 'Standards & QCO', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 3, label: 'Testing & Labs', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 4, label: 'Documents Checklist', icon: <FileText className="w-4 h-4" /> },
    { id: 5, label: 'Application Process', icon: <FileCheck2 className="w-4 h-4" /> },
  ];

  const currentStepObj = steps.find((s) => s.id === activeStep) || steps[0];

  const getStepSectionId = (step: number) => {
    switch (step) {
      case 1: return 'section-product-profile';
      case 2: return 'section-applicable-standard';
      case 3: return 'section-testing-labs';
      case 4: return 'section-documents';
      case 5: return 'section-application';
      default: return 'section-product-guide-flow';
    }
  };

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
            <span><b>{t('New Product Search') || 'New Product Search'}</b></span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Product:</span>
            <span className="px-2.5 py-1 rounded-md bg-bis-100 text-bis-900 font-mono font-bold">
              {productProfile.name || 'Product'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Small 'i' Information Guide Button */}
          <PageInfoButton
            sectionId={getStepSectionId(activeStep)}
            tooltip={`Open Compliance Guide for Stage ${activeStep}: ${currentStepObj.label}`}
            variant="light"
            size="sm"
          />

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
        <>
          {/* STATIC PART: The Title and Subtitle stay here and scroll normally */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                {t('productGuide.title') || 'Product Certification Roadmap'}
              </h1>
              <p className="text-xs text-slate-500">
                {t('productGuide.subtitle') || 'Compliance guide for'} <strong className="text-slate-800">{productProfile.name || 'Product'}</strong>
              </p>
            </div>
            {/* FIX: Changed to 5 steps */}
            <span className="text-xs font-bold px-3 py-1 bg-bis-50 text-bis-800 border border-bis-200 rounded-full">
              Step {activeStep} of 5
            </span>
          </div>

          {/* 🌟 STICKY PART: Added !mt-2 to forcefully override the parent container's gap! 🌟 */}
          <div className="!mt-2 sticky top-[130px] z-50 bg-white shadow-lg rounded-2xl p-2 sm:p-3 border border-slate-200 transition-all">
            <div className=" grid grid-cols-2 sm:grid-cols-5 gap-2">
              {steps.map((step) => {
                const isCurrent = step.id === activeStep;
                const isPast = step.id < activeStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
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
        </>
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
                className="px-6 py-2.5 bg-bis-900 hover:bg-bis-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Try Another Search Query
              </button>
              {onOpenAssistant && (
                <button
                  onClick={() => onOpenAssistant(`Is there any Indian Standard applicable for ${productProfile.name}?`)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-bis-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Assistant Directly</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* FIX: Render steps 1 through 5, skipping the old step 3 */}
            {activeStep === 1 && (
              <Step1Product
                productProfile={productProfile}
                onUpdateProfile={updateProductProfile}
                onNext={() => setActiveStep(2)}
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 2 && (
              <Step2Standard
                productName={productProfile.name}
                standardDetails={guideData.standardDetails}
                certificationDetails={guideData.certificationDetails} // FIXED: Passed the missing prop
                citations={guideData.citations}
                onNext={() => setActiveStep(3)} // Goes to Testing & Labs
                onPrev={() => setActiveStep(1)}
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 3 && (
              <Step4Testing // Now mapped to Step 3
                productName={productProfile.name}
                standardDetails={guideData.standardDetails}
                testingDetails={guideData.testingDetails}
                onNext={() => setActiveStep(4)} // Goes to Documents
                onPrev={() => setActiveStep(2)} // Goes back to Merged Step 2
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 4 && (
              <Step5Documents // Now mapped to Step 4
                productName={productProfile.name}
                documents={guideData.documentChecklist}
                onNext={() => setActiveStep(5)} // Goes to Application
                onPrev={() => setActiveStep(3)} // Goes back to Testing & Labs
                onAskAI={handleStepAskAI}
              />
            )}
            {activeStep === 5 && (
              <Step6Application // Now mapped to Step 5
                productName={productProfile.name}
                milestones={guideData.applicationMilestones}
                onPrev={() => setActiveStep(4)} // Goes back to Documents
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