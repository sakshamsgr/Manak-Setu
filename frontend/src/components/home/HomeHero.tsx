import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  Droplets,
  Radio,
  Loader2,
  Gem,
  Award,
  Package,
  Building2,
  Bookmark,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  WashingMachine,
  Snowflake,
  Fan
} from 'lucide-react';
import { MainNavTab } from '../layout/Header';
import { PageInfoButton } from '../common/PageInfoButton';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';

// Custom Lucide-styled Iron icon
const IronIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 18h16a1 1 0 0 0 1-1c0-4.4-3.6-8-8-8H6a3 3 0 0 0-3 3v5a1 1 0 0 0 1 1z" />
    <path d="M11 9V5a1 1 0 0 1 1-1h4" />
    <circle cx="8" cy="14" r="0.5" fill="currentColor" />
    <circle cx="12" cy="14" r="0.5" fill="currentColor" />
    <circle cx="16" cy="14" r="0.5" fill="currentColor" />
  </svg>
);

interface HomeHeroProps {
  onSubmitQuery: (query: string, file?: File) => void;
  onSelectNavTab: (tab: MainNavTab) => void;
  isLoading: boolean;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onSubmitQuery,
  onSelectNavTab,
  isLoading,
}) => {
  const { t } = useLanguage();
  const { 
    productProfile, 
    updateProductProfile,
    savedGuides,
    loadSavedGuide,
    deleteSavedGuide,
    errorMessage,
    retryLastJourney,
    clearError
  } = useProductContext();

  const sampleProductPrompts = [
    {
      icon: <IronIcon className="w-3.5 h-3.5 text-amber-500" />,
      label: 'Electric Iron',
      prompt: 'Electric Iron',
      product: 'Electric Iron',
      cat: 'Electrical & Electronics',
    },
    {
      icon: <WashingMachine className="w-3.5 h-3.5 text-blue-600" />,
      label: 'Electric Washing Machine',
      prompt: 'Electric Washing Machine',
      product: 'Electric Washing Machine',
      cat: 'Electrical & Electronics',
    },
    {
      icon: <Snowflake className="w-3.5 h-3.5 text-sky-500" />,
      label: 'Split Air Conditioner',
      prompt: 'Split Air Conditioner',
      product: 'Split Air Conditioner',
      cat: 'Electrical & Electronics',
    },
    {
      icon: <Fan className="w-3.5 h-3.5 text-teal-600" />,
      label: 'Electric Fan',
      prompt: 'Electric Fan',
      product: 'Electric Fan',
      cat: 'Electrical & Electronics',
    },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    
    // Generate a contextual query for the AI based on the product name since the chatbox is removed
    const effectiveQuery = productProfile.name?.trim() 
      ? `Compliance requirements for ${productProfile.name.trim()}` 
      : 'Compliance requirements for electrical appliances';

    onSubmitQuery(effectiveQuery);
  };

  const handleQuickPromptClick = (item: typeof sampleProductPrompts[0]) => {
    updateProductProfile({
      name: item.product,
      category: item.cat as any,
    });
    onSubmitQuery(item.prompt);
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Subtle Blobs */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-bis-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 -mb-12 -ml-12 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Official Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bis-50 border border-bis-200 text-bis-900 text-xs font-extrabold uppercase tracking-wider shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-bis-700" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t('hero.titlePrefix')} <span className="text-bis-800">{t('hero.titleStandards')}</span> {t('hero.titleAnd')} <span className="text-amber-600">{t('hero.titleCert')}</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Error Banner with Retry Action (Phase 17) */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold leading-snug">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  if (retryLastJourney) {
                    retryLastJourney();
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{t('common.retry') || 'Retry'}</span>
              </button>
              <button
                type="button"
                onClick={clearError}
                className="p-1.5 text-rose-400 hover:text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Primary Interactive Product Profile & Consultation Card (Transplanted Step 1) */}
        <div className="bg-white rounded-3xl shadow-card border-2 border-slate-200/90 p-5 sm:p-7 transition-all hover:border-bis-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t('hero.inputLabel') || 'TELL US ABOUT YOUR PRODUCT OR COMPLIANCE REQUIREMENT'}</span>
              </label>
              <PageInfoButton
                sectionId="section-how-manak-setu-works"
                tooltip="Learn how Manak Setu works in the Guide"
                variant="subtle"
                size="sm"
              />
            </div>

            {/* Transplanted Step 1 Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-bis-700" />
                  <span>{t('s1ProductName') || 'Product Name / Item'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={productProfile.name}
                  onChange={(e) => updateProductProfile({ name: e.target.value })}
                  placeholder="e.g. Electric Iron, Electric Fan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                />
              </div>

              {/* Product Industry Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {t('s1Category') || 'Product Industry Category'}
                </label>
                <select
                  value={productProfile.category}
                  onChange={(e) => updateProductProfile({ category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                >
                  <option value="Electrical & Electronics">Electrical & Electronics</option>
        
                </select>
              </div>

              {/* Scale of Industry / Concession */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('s1Scale') || 'Scale of Industry'}</span>
                  </span>
                  <span className="text-amber-700 font-bold text-[11px]">50% Udyam Subsidy</span>
                </label>
                <select
                  value={productProfile.industryScale}
                  onChange={(e) => updateProductProfile({ industryScale: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                >
                  <option value="micro">{t('s1MicroScale') || 'Micro Enterprise (Investment < 1 Cr)'}</option>
                  <option value="startup">{t('s1StartupScale') || 'Recognized Startup (DPIIT)'}</option>
                  <option value="small">{t('s1SmallScale') || 'Small Enterprise (Investment < 10 Cr)'}</option>
                  <option value="medium">{t('s1MediumScale') || 'Medium Enterprise (Investment < 50 Cr)'}</option>
                  <option value="large">{t('s1LargeScale') || 'Large Scale Industry'}</option>
                </select>
              </div>

              {/* Product Sub-type / Intended Use */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-bis-700" />
                  <span>{t('s1SubType') || 'Product Sub-type / Intended Use'}</span>
                </label>
                <input
                  type="text"
                  value={productProfile.subType || ''}
                  onChange={(e) => updateProductProfile({ subType: e.target.value, intendedUse: e.target.value })}
                  placeholder="e.g. Immersion Water Heater, Portable, Class I"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                />
              </div>

              {/* Key Material / Technical Specifications */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{t('s1TechnicalSpecs') || 'Key Material / Technical Specifications (optional)'}</span>
                </label>
                <input
                  type="text"
                  value={productProfile.technicalSpecs || ''}
                  onChange={(e) => updateProductProfile({ technicalSpecs: e.target.value })}
                  placeholder="e.g. 230V AC, 1500W, Copper Sheathed Tubular Heating Element"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                />
              </div>
            </div>

              
{/* Bottom Action Area: Toggles & Submit Button */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-4 mt-2 w-full">
                
                {/* Domestic vs Foreign Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="origin"
                      checked={!productProfile.isForeign}
                      onChange={() => updateProductProfile({ isForeign: false })}
                      className="w-4 h-4 text-bis-800 focus:ring-bis-500 shrink-0 cursor-pointer"
                    />
                    <span>{t('s1Domestic') || 'Domestic Indian Manufacturer'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="origin"
                      checked={productProfile.isForeign}
                      onChange={() => updateProductProfile({ isForeign: true })}
                      className="w-4 h-4 text-bis-800 focus:ring-bis-500 shrink-0 cursor-pointer"
                    />
                    <span>{t('s1Foreign') || 'Foreign Manufacturer (FMCS)'}</span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full lg:w-auto shrink-0 justify-center px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                    isLoading
                      ? 'bg-blue-800 text-white cursor-wait opacity-90'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-900/20 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                      <span>{t('hero.analyzing') || 'Building Guide...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>{t('hero.startGuide') || 'Start Product Certification Guide'}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </div>
          </form>

          {/* 2-Column Balanced Section: Explore Common Queries (LEFT) & Saved Product Details/Steps (RIGHT) */}
          <div className="mt-6 pt-6 border-t border-slate-200/80 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT SIDE: Explore Common Product Queries */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('hero.samplePrompts') || 'EXPLORE COMMON PRODUCT QUERIES:'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleProductPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPromptClick(item)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-bis-50 border border-slate-200 hover:border-bis-300 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="p-1.5 rounded-lg bg-white group-hover:bg-bis-100 transition-colors shrink-0 shadow-2xs">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-bis-900 leading-snug">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: Saved Product Details/Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <Bookmark className="w-3.5 h-3.5 text-bis-700" />
                  <span>Saved Product Details / Steps</span>
                </div>
                {savedGuides.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-bis-100 text-bis-900 font-mono">
                    {savedGuides.length} saved
                  </span>
                )}
              </div>

              {savedGuides.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                  {savedGuides.map((guide) => (
                    <div
                      key={guide.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-bis-300 transition-all shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div
                        onClick={() => loadSavedGuide(guide)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-bis-900 truncate">
                            {guide.product_name}
                          </h4>
                          {guide.standard_code && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-bis-100 text-bis-900 rounded shrink-0">
                              {guide.standard_code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-amber-700">
                            Step {guide.active_step || 1} of 6
                          </span>
                          <span>•</span>
                          <span className="truncate">Click to continue roadmap</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadSavedGuide(guide)}
                          className="px-2.5 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title="Resume this Product Guide"
                        >
                          <span>Resume</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedGuide(guide.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove saved guide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[116px] p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No Saved Product Guides Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Start a search above and click "Save Progress" inside the guide to resume your certification roadmap anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};