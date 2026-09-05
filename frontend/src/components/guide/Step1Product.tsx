import React from 'react';
import { Package, Building2, ArrowRight } from 'lucide-react';
import { ProductProfile } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';

interface Step1ProductProps {
  productProfile: ProductProfile;
  onUpdateProfile: (updated: Partial<ProductProfile>) => void;
  onNext: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step1Product: React.FC<Step1ProductProps> = ({
  productProfile,
  onUpdateProfile,
  onNext,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 1 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s1Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s1Subtitle')}
        </p>
      </div>

      {/* Interactive Product Parameters Form Card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="space-y-5"
      >
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-bis-700" />
                <span>{t('s1ProductName')}</span>
              </label>
              <input
                type="text"
                value={productProfile.name}
                onChange={(e) => onUpdateProfile({ name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              />
            </div>

            {/* Product Industry Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t('s1Category')}
              </label>
              <select
                value={productProfile.category}
                onChange={(e) => onUpdateProfile({ category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              >
                <option value="Electrical & Electronics">Electrical & Electronics</option>
                <option value="Food & Agriculture">Food & Agriculture</option>
                <option value="Civil Engineering">Civil Engineering & Construction</option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Chemical">Chemicals & Polymers</option>
                <option value="Medical Equipment">Medical & Safety Equipment</option>
              </select>
            </div>

            {/* Scale of Industry / Concession */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('s1Scale')}</span>
                </span>
                <span className="text-amber-700 font-bold text-[11px]">50% Udyam Subsidy</span>
              </label>
              <select
                value={productProfile.industryScale}
                onChange={(e) => onUpdateProfile({ industryScale: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              >
                <option value="micro">{t('s1MicroScale')}</option>
                <option value="startup">{t('s1StartupScale')}</option>
                <option value="small">{t('s1SmallScale')}</option>
                <option value="medium">{t('s1MediumScale')}</option>
                <option value="large">{t('s1LargeScale')}</option>
              </select>
            </div>

            {/* Product Sub-type / Intended Use */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-bis-700" />
                <span>{t('s1SubType', 'Product Sub-type / Intended Use')}</span>
              </label>
              <input
                type="text"
                value={productProfile.subType || ''}
                onChange={(e) => onUpdateProfile({ subType: e.target.value, intendedUse: e.target.value })}
                placeholder="e.g. Immersion Water Heater, Portable, Class I"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              />
            </div>

            {/* Key Material / Technical Specifications */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>{t('s1TechnicalSpecs', 'Key Material / Technical Specifications (optional)')}</span>
              </label>
              <input
                type="text"
                value={productProfile.technicalSpecs || ''}
                onChange={(e) => onUpdateProfile({ technicalSpecs: e.target.value })}
                placeholder="e.g. 230V AC, 1500W, Copper Sheathed Tubular Heating Element"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Domestic vs Foreign Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="radio"
                name="origin"
                checked={!productProfile.isForeign}
                onChange={() => onUpdateProfile({ isForeign: false })}
                className="text-bis-800 focus:ring-bis-500"
              />
              <span>{t('s1Domestic')}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="radio"
                name="origin"
                checked={productProfile.isForeign}
                onChange={() => onUpdateProfile({ isForeign: true })}
                className="text-bis-800 focus:ring-bis-500"
              />
              <span>{t('s1Foreign')}</span>
            </label>
          </div>
        </div>

        {/* Continue Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow transition-all transform active:scale-95 cursor-pointer"
          >
            <span>{t('s1ContinueBtn')}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </form>
    </div>
  );
};
