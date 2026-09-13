import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Printer, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Percent, 
  Coins, 
  IndianRupee, 
  Layers, 
  FileCheck, 
  Info,
  Loader2,
  RefreshCw,
  Search,
  Globe,
  ExternalLink,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { IndustryScale, DatabaseFeeCalculationResponse } from '../../types/estimator';
import { PageInfoButton } from '../common/PageInfoButton';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';
import { calculateFeeEstimate, getStandardsOptions } from '../../services/api';

interface FeeEstimatorViewProps {
  onAskAIAboutEstimate?: (prompt: string) => void;
}

interface StandardOption {
  id: string;
  code: string;
  title: string;
}

const FALLBACK_STANDARDS: StandardOption[] = [
  { id: '368-2014-electric-immersion-water-heaters', code: 'IS 368:2014', title: 'Electric Immersion Water Heaters' },
  { id: '302-2-3_electric_irons_product_manual_PM-IS_302-Part2-Sec3-IEC60335-2-3-2_Oct2024', code: 'IS 302-2-3', title: 'Electric Irons (Safety Requirements)' },
  { id: '302-2-30_room_heaters_product_manual_PM-IS_302-2-30-4_Dec2023', code: 'IS 302-2-30', title: 'Room Heaters (Safety Requirements)' },
  { id: '302-2-80_fans_product_manual_PM-IS_302-Part2-Sec80-4_July2026', code: 'IS 302-2-80', title: 'Electric Fans (Safety Requirements)' },
  { id: '302-2-7_domestic_electric_clothes_washing_machines_product_manual_PM-IS_302-Part2-Sec7-4_June2025', code: 'IS 302-2-7', title: 'Electric Clothes Washing Machines' },
  { id: '302-2-14_electric_kitchen_machines_product_manual_PM-IS_302-2-14-5_June2025', code: 'IS 302-2-14', title: 'Electric Kitchen Machines' },
  { id: '302-2-6_cooking_ranges_hobs_ovens_product_manual_PM-IS_302-2-6-1_Jan2023', code: 'IS 302-2-6', title: 'Cooking Ranges, Hobs and Ovens' },
  { id: '302-2-35_instantaneous_water_heater_product_manual_PM-IS_302-2-35-1_Jan2023', code: 'IS 302-2-35', title: 'Instantaneous Water Heaters' },
  { id: '302-2-11_tumbler_dryers_product_manual_PM-IS_302-2-11-1_Feb2024', code: 'IS 302-2-11', title: 'Tumbler Dryers' },
  { id: '302-2-202_electric_stoves_product_manual_PM-IS_302-2-202-1_Jan2024', code: 'IS 302-2-202', title: 'Electric Stoves and Hotplates' },
];

export const FeeEstimatorView: React.FC<FeeEstimatorViewProps> = ({ onAskAIAboutEstimate }) => {
  const { t } = useLanguage();
  const { productProfile, guideData } = useProductContext();

  // Standards options loaded from backend
  const [standardOptions, setStandardOptions] = useState<StandardOption[]>(FALLBACK_STANDARDS);
  const [standardSearchFilter, setStandardSearchFilter] = useState('');

  // Form State
  const [selectedStandardId, setSelectedStandardId] = useState<string>('368-2014-electric-immersion-water-heaters');
  const [industryScale, setIndustryScale] = useState<IndustryScale>('micro');
  const [productCount, setProductCount] = useState<number>(1);
  const [inspectionDays, setInspectionDays] = useState<number>(2);
  const [isForeignManufacturer, setIsForeignManufacturer] = useState<boolean>(false);
  const [isPrefilledFromGuide, setIsPrefilledFromGuide] = useState<boolean>(false);

  // Calculation & State
  const [result, setResult] = useState<DatabaseFeeCalculationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load available standards options from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadStandards = async () => {
      try {
        const data = await getStandardsOptions();
        if (isMounted && data?.options && data.options.length > 0) {
          setStandardOptions(data.options);
        }
      } catch (err) {
        // Fallback to FALLBACK_STANDARDS silently
      }
    };
    loadStandards();
    return () => {
      isMounted = false;
    };
  }, []);

  // Prefill state from Product Guide context if active
  useEffect(() => {
    if (guideData?.standardDetails) {
      const code = guideData.standardDetails.code || '';
      const matched = standardOptions.find(
        (o) => o.code.toLowerCase().includes(code.toLowerCase()) || (code && code.toLowerCase().includes(o.code.toLowerCase()))
      );
      if (matched) {
        setSelectedStandardId(matched.id);
      }
      setIsPrefilledFromGuide(true);
    }
    if (productProfile) {
      if (productProfile.industryScale) {
        setIndustryScale(productProfile.industryScale as IndustryScale);
      }
      if (typeof productProfile.isForeign === 'boolean') {
        setIsForeignManufacturer(productProfile.isForeign);
      }
    }
  }, [guideData, productProfile, standardOptions]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Filtered standards for dropdown
  const filteredStandards = useMemo(() => {
    if (!standardSearchFilter.trim()) return standardOptions;
    const q = standardSearchFilter.toLowerCase();
    return standardOptions.filter(
      (opt) => opt.code.toLowerCase().includes(q) || opt.title.toLowerCase().includes(q)
    );
  }, [standardOptions, standardSearchFilter]);

  // Current selected standard object
  const currentStandard = useMemo(() => {
    return standardOptions.find((opt) => opt.id === selectedStandardId) || standardOptions[0];
  }, [standardOptions, selectedStandardId]);

  // Database-driven calculation
  const executeCalculation = async () => {
    // Prevent duplicate in-flight requests (Rule 9)
    if (isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data: DatabaseFeeCalculationResponse = await calculateFeeEstimate({
        standardId: selectedStandardId,
        scheme: isForeignManufacturer ? 'Scheme-I' : 'Scheme-I',
        industryScale: isForeignManufacturer ? 'large' : industryScale,
        isForeign: isForeignManufacturer,
        numVarieties: productCount,
        inspectionDays: inspectionDays,
        signal: controller.signal,
      });

      setResult(data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Fee calculation failed:', err);
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout || err.message?.includes('timeout');
      setErrorMessage(
        isTimeout
          ? (t('common.aiTimeout') || 'Fee calculation took longer than 10 seconds. The server might be busy, please retry.')
          : (t('common.apiUnavailable') || 'Failed to retrieve authoritative statutory fee data. Please check connection and try again.')
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Run initial calculation once on mount or when standard options load
  useEffect(() => {
    executeCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStandardId, industryScale, isForeignManufacturer]);

  const handlePrint = () => {
    window.print();
  };

  const handleClearPrefill = () => {
    setIsPrefilledFromGuide(false);
  };

  // Calculate total savings for domestic MSME
  const totalConcessionSaved = useMemo(() => {
    if (!result || !result.items) return 0;
    return result.items.reduce((acc, item) => acc + (item.concession || 0), 0);
  }, [result]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 printable-receipt-root">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg shadow-xs">
              Official BIS Gazette Tariff
            </span>
            <span className="text-xs text-slate-300">Conformity Assessment Regulations 2018</span>
            {isPrefilledFromGuide && (
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Prefilled from Product Guide
              </span>
            )}
          </div>
          <PageInfoButton
            sectionId="section-application"
            tooltip="Learn about BIS Application Fees & Licensing in the Guide"
            variant="dark"
            size="sm"
          />
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          {t('estimator.title') || 'BIS Fee & Compliance Cost Estimator'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t('estimator.subtitle') || 'Authoritative database-driven cost calculations with official MSME concessions, statutory inspection man-days, lab testing tariffs, and 18% GST itemization.'}
        </p>
      </div>

      {/* Prefilled Product Notice (if arrived from Product Guide) */}
      {isPrefilledFromGuide && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900">
                Active Product Context Linked:
              </div>
              <div className="text-xs text-emerald-700">
                Product: <strong className="font-semibold text-emerald-950">{productProfile.name || 'Immersion Heater'}</strong> • Standard: <strong className="font-semibold text-emerald-950">{currentStandard?.code} ({currentStandard?.title})</strong>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearPrefill}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline self-start sm:self-center"
          >
            Change Standard Manually
          </button>
        </div>
      )}

      {/* Interactive Form Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Standard Selector */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>1. {t('estimator.selectStandard') || 'Applicable Indian Standard (IS Code)'}</span>
              <span className="text-[11px] font-normal text-slate-500">From BIS database catalog</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <select
                  value={selectedStandardId}
                  onChange={(e) => setSelectedStandardId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                >
                  {standardOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.code} — {opt.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter standards list..."
                  value={standardSearchFilter}
                  onChange={(e) => setStandardSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
                />
              </div>
            </div>
            {standardSearchFilter && filteredStandards.length > 0 && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto space-y-1 text-xs">
                {filteredStandards.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedStandardId(item.id);
                      setStandardSearchFilter('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      item.id === selectedStandardId ? 'bg-bis-800 text-white font-bold' : 'hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span><strong>{item.code}</strong>: {item.title}</span>
                    <span className="text-[10px] opacity-80">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Scale of Industry Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>2. {t('estimator.scale') || 'Scale of Industry / Enterprise'}</span>
              {!isForeignManufacturer && (
                <span className="text-amber-700 font-bold text-[11px]">Up to 50% Concession</span>
              )}
            </label>
            <select
              value={industryScale}
              onChange={(e) => setIndustryScale(e.target.value as IndustryScale)}
              disabled={isForeignManufacturer}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="micro">{t('step1.microScale') || 'Micro Enterprise (50% Concession with Udyam)'}</option>
              <option value="startup">{t('step1.startupScale') || 'DPIIT Recognized / Women Startup (50% Concession)'}</option>
              <option value="small">{t('step1.smallScale') || 'Small Enterprise (20% Concession)'}</option>
              <option value="medium">{t('step1.mediumScale') || 'Medium Enterprise'}</option>
              <option value="large">{t('step1.largeScale') || 'Large Scale Industry'}</option>
            </select>
            <p className="text-[11px] text-slate-500">
              {isForeignManufacturer ? 'MSME concessions do not apply to overseas manufacturers under FMCS.' : 'Valid Udyam / DPIIT certificate grants statutory 50% or 20% concession.'}
            </p>
          </div>

          {/* 3. Inspection Days */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              3. {t('estimator.inspectionDays') || 'Preliminary Audit / Inspection Days'}
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={inspectionDays}
              onChange={(e) => setInspectionDays(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              Statutory auditor man-days (Official rate: ₹7,000/day domestic, $1,500/day FMCS).
            </p>
          </div>

          {/* 4. Product Varieties / Test Batches */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              4. {t('estimator.varieties') || 'Number of Product Varieties / Test Batches'}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={productCount}
              onChange={(e) => setProductCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              Lab testing charges scale with the number of models/varieties evaluated.
            </p>
          </div>
        </div>

        {/* Foreign Manufacturer Toggle & Calculation Trigger */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="foreignManufacturer"
              checked={isForeignManufacturer}
              onChange={(e) => setIsForeignManufacturer(e.target.checked)}
              className="w-4 h-4 text-bis-800 rounded border-slate-300 focus:ring-bis-500 cursor-pointer"
            />
            <label htmlFor="foreignManufacturer" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Foreign Manufacturer Certification Scheme (FMCS) applicant</span>
            </label>
          </div>

          <button
            onClick={executeCalculation}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all transform active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Calculating with Supabase...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>{t('estimator.calculateBtn') || 'Calculate Statutory Estimate'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State with Retry Button (Rule 8) */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in no-print">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={executeCalculation}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 self-start sm:self-center transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry') || 'Retry'}</span>
          </button>
        </div>
      )}

 {/* Results Card / Itemized Receipt */}
      {result && (
        <div className="bg-white rounded-3xl shadow-card border border-slate-200 overflow-hidden animate-slide-up space-y-6 print-container w-full">
          {/* Result Header */}
          <div className="p-5 sm:p-8 bg-gradient-to-r from-slate-900 to-bis-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 w-full">
            <div className="w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded whitespace-nowrap">
                  {result.is_foreign ? 'Foreign Manufacturer (FMCS)' : `${result.industry_scale.toUpperCase()} ENTERPRISE`}
                </span>
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                  Currency: {result.currency} ({result.currency_symbol})
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold mt-2 text-white leading-tight">
                {t('estimator.receiptTitle') || 'Estimated Cost Breakdown & Itemized Receipt'}: {currentStandard?.code}
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-snug">
                {currentStandard?.title}
              </div>
            </div>

            {totalConcessionSaved > 0 && !result.is_foreign && (
              <div className="w-full md:w-auto px-4 py-3 sm:py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center shrink-0 mt-2 md:mt-0">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                  MSME Subsidy Savings
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white">
                  ₹{totalConcessionSaved.toLocaleString('en-IN')} Saved ({result.concession_percentage}%)
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="px-5 pb-6 sm:p-8 sm:pt-2 space-y-6">
            {/* Mobile Scroll Wrapper with Negative Margins to allow edge-to-edge scrolling on phones */}
            <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 w-[100vw] sm:w-full max-w-full">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] sm:text-[11px] bg-slate-50">
                      <th className="py-3 px-4 min-w-[220px]">Fee Component & Regulatory Schedule</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap min-w-[100px]">Standard Tariff</th>
                      <th className="py-3 px-4 text-right text-emerald-600 whitespace-nowrap min-w-[120px]">MSME Concession</th>
                      <th className="py-3 px-4 text-right text-slate-900 whitespace-nowrap min-w-[100px]">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.items.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="font-bold text-slate-900 leading-snug">{item.category}</div>
                          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">{item.notes}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                          {result.currency_symbol}{item.amount.toLocaleString(result.is_foreign ? 'en-US' : 'en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                          {item.concession > 0 ? `- ${result.currency_symbol}${item.concession.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                          {result.currency_symbol}{item.net.toLocaleString(result.is_foreign ? 'en-US' : 'en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {/* Subtotal */}
                    <tr className="border-t border-slate-200 bg-slate-50/70 font-semibold text-slate-700">
                      <td colSpan={3} className="py-3 px-4 text-right text-xs">
                        Subtotal (Before Tax):
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold whitespace-nowrap">
                        {result.currency_symbol}{result.subtotal.toLocaleString(result.is_foreign ? 'en-US' : 'en-IN')}
                      </td>
                    </tr>

                    {/* GST or Overseas Tax */}
                    <tr className="border-t border-slate-100 bg-slate-50/70 font-semibold text-slate-700">
                      <td colSpan={3} className="py-3 px-4 text-right text-xs">
                        {result.is_foreign ? 'Regulatory Tax / Duty (Overseas Zero-Rated):' : `GST on Statutory Services (${result.tax_rate_percentage}%):`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold whitespace-nowrap">
                        {result.currency_symbol}{result.tax_amount.toLocaleString(result.is_foreign ? 'en-US' : 'en-IN')}
                      </td>
                    </tr>

                    {/* Total Year 1 */}
                    <tr className="border-t-2 border-slate-900 bg-bis-50/80 font-bold">
                      <td colSpan={3} className="py-4 px-4 text-[11px] sm:text-sm text-bis-950 font-extrabold text-right">
                        {t('estimator.year1Total') || 'Total Estimated First-Year Statutory Investment (incl. 18% GST):'}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base sm:text-lg text-bis-900 font-extrabold whitespace-nowrap">
                        {result.currency_symbol}{result.total_year_1.toLocaleString(result.is_foreign ? 'en-US' : 'en-IN')}
                      </td>
                    </tr>

                    {/* Year 2 Recurring */}
                    <tr className="border-t border-bis-200 bg-slate-100/70 font-bold text-slate-700">
                      <td colSpan={3} className="py-3 px-4 text-right">
                        <div className="text-xs font-bold text-slate-700">{t('estimator.year2Recurring') || 'Year 2 Recurring / Renewal Outlay:'}</div>
                        <div className="text-[10px] font-normal text-slate-500 mt-0.5 hidden sm:block">Covers annual licence fee and minimum marking fee with applicable taxes.</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-slate-800 font-bold whitespace-nowrap">
                        {result.currency_symbol}{result.annual_recurring_year_2.toLocaleString(result.is_foreign ? 'en-US' : 'en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Optimization Guidelines */}
            {result.optimization_guidelines && result.optimization_guidelines.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 space-y-2 w-full">
                <div className="font-bold flex items-center gap-1.5 text-sky-900">
                  <ShieldAlert className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>Statutory Fee Optimization Guidelines:</span>
                </div>
                <ul className="list-disc pl-6 space-y-1.5 text-sky-800 text-[11px] sm:text-xs leading-relaxed">
                  {result.optimization_guidelines.map((guide, idx) => (
                    <li key={idx}>{guide}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer Alert */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1 w-full">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Statutory Tariff Distinction Notice:</span>
              </div>
              <p className="leading-relaxed text-amber-800 text-[10px] sm:text-[11px] mt-1">
                {t('estimator.statutoryNote') || 'Official statutory BIS fees (Application, Inspection, Annual Marking) are fixed by Gazette notification under BIS (Conformity Assessment) Regulations 2018. Laboratory testing charges are market-based estimates and vary depending on the chosen NABL laboratory tariff.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 no-print w-full">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span>Print Official Breakdown</span>
              </button>

              {onAskAIAboutEstimate && (
                <button
                  onClick={() =>
                    onAskAIAboutEstimate(
                      `Please explain the detailed statutory fee schedule, inspection charges, and document checklist for ${currentStandard?.code} (${currentStandard?.title}) for a ${result.industry_scale} enterprise.`
                    )
                  }
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-bis-800 hover:bg-bis-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors active:scale-95"
                >
                  <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  <span>Consult AI on this Fee Structure</span>
                  <ArrowRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};