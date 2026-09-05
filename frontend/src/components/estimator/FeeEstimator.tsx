import React, { useState } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Printer, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Percent,
  Coins,
  IndianRupee,
  Layers,
  FileCheck
} from 'lucide-react';
import { SchemeType, IndustryScale, FeeCalculationResult, FeeItemBreakdown } from '../../types/estimator';

interface FeeEstimatorProps {
  onAskAIAboutEstimate?: (prompt: string) => void;
}

export const FeeEstimator: React.FC<FeeEstimatorProps> = ({ onAskAIAboutEstimate }) => {
  const [schemeType, setSchemeType] = useState<SchemeType>('scheme_1');
  const [industryScale, setIndustryScale] = useState<IndustryScale>('micro');
  const [productCount, setProductCount] = useState<number>(1);
  const [sampleCount, setSampleCount] = useState<number>(1);
  const [isForeignManufacturer, setIsForeignManufacturer] = useState<boolean>(false);
  const [result, setResult] = useState<FeeCalculationResult | null>(null);

  const calculateFees = () => {
    let schemeName = '';
    let scaleLabel = '';
    let concessionPct = 0;
    const items: FeeItemBreakdown[] = [];
    const guidelines: string[] = [];

    // Determine Concession Percentage
    if (isForeignManufacturer) {
      concessionPct = 0;
      scaleLabel = 'Foreign Manufacturer (FMCS)';
    } else {
      switch (industryScale) {
        case 'micro':
          concessionPct = 50;
          scaleLabel = 'Micro Enterprise (50% Concession)';
          break;
        case 'small':
          concessionPct = 20;
          scaleLabel = 'Small Enterprise (20% Concession)';
          break;
        case 'startup':
          concessionPct = 50;
          scaleLabel = 'DPIIT Startup / Women Entrepreneur (50% Concession)';
          break;
        case 'medium':
          concessionPct = 0;
          scaleLabel = 'Medium Enterprise';
          break;
        case 'large':
          concessionPct = 0;
          scaleLabel = 'Large Industry';
          break;
      }
    }

    if (schemeType === 'scheme_1') {
      schemeName = 'Scheme-I: Product Certification (ISI Mark)';
      
      // 1. Application Fee
      const baseAppFee = isForeignManufacturer ? 25000 : 1000 * productCount;
      const appDiscount = (baseAppFee * concessionPct) / 100;
      items.push({
        label: 'Application Fee',
        baseAmount: baseAppFee,
        discountAmount: appDiscount,
        netAmount: baseAppFee - appDiscount,
        frequency: 'one-time',
        description: 'Statutory filing fee per Indian Standard specification.',
      });

      // 2. Preliminary Factory Inspection Fee
      const baseInspFee = isForeignManufacturer ? 75000 : 7000 * Math.max(1, Math.ceil(productCount / 2));
      items.push({
        label: 'Preliminary Inspection Charges',
        baseAmount: baseInspFee,
        discountAmount: 0,
        netAmount: baseInspFee,
        frequency: 'one-time',
        description: 'Man-day audit fee for factory quality control verification.',
      });

      // 3. Minimum Annual Marking Fee
      const baseMarkingFee = isForeignManufacturer ? 80000 : 35000 * productCount;
      const markDiscount = (baseMarkingFee * concessionPct) / 100;
      items.push({
        label: 'Annual Minimum Marking Fee',
        baseAmount: baseMarkingFee,
        discountAmount: markDiscount,
        netAmount: baseMarkingFee - markDiscount,
        frequency: 'annual',
        description: 'Minimum fee for usage of the prestigious ISI mark for 1 year.',
      });

      // 4. Laboratory Testing Fee
      const baseTestFee = 18000 * sampleCount;
      items.push({
        label: 'Sample Testing Charges (Estimated)',
        baseAmount: baseTestFee,
        discountAmount: 0,
        netAmount: baseTestFee,
        frequency: 'per-sample',
        description: 'Average testing charges at BIS or BIS-recognized laboratory.',
      });

      guidelines.push('Licence is granted for a minimum initial period of 1 to 2 years.');
      guidelines.push('Micro & Small enterprises must present valid Udyam Registration Certificate to claim concession.');
      guidelines.push('Surveillance samples are drawn at regular intervals during the licence tenure.');
    } 
    else if (schemeType === 'scheme_2') {
      schemeName = 'Scheme-II: Compulsory Registration Scheme (CRS)';

      // Application Fee
      const baseAppFee = 1000 * productCount;
      const appDiscount = (baseAppFee * concessionPct) / 100;
      items.push({
        label: 'Application Fee',
        baseAmount: baseAppFee,
        discountAmount: appDiscount,
        netAmount: baseAppFee - appDiscount,
        frequency: 'one-time',
        description: 'Registration portal processing fee.',
      });

      // Processing Fee per Report
      const baseProcFee = 50000 * productCount;
      const procDiscount = (baseProcFee * (concessionPct > 0 ? 20 : 0)) / 100;
      items.push({
        label: 'Technical Processing & Evaluation Fee',
        baseAmount: baseProcFee,
        discountAmount: procDiscount,
        netAmount: baseProcFee - procDiscount,
        frequency: 'one-time',
        description: 'Evaluation of BIS recognized laboratory test report.',
      });

      // Annual Registration Fee
      const baseRegFee = 10000;
      items.push({
        label: 'Registration Fee (2 Years Validity)',
        baseAmount: baseRegFee,
        discountAmount: 0,
        netAmount: baseRegFee,
        frequency: 'annual',
        description: 'Valid for 2 continuous years under MeitY / MeitY QCO provisions.',
      });

      guidelines.push('Test reports must be issued by a BIS recognized lab within the last 90 days.');
      guidelines.push('Affix the Standard Mark (CRS Logo with R-Number) upon approval.');
    }
    else if (schemeType === 'hallmarking') {
      schemeName = 'Hallmarking Scheme: Gold & Silver Jewellery';

      // Registration Fee
      const baseRegFee = industryScale === 'micro' ? 3750 : 7500;
      items.push({
        label: 'Jeweller Registration Fee (5 Years)',
        baseAmount: 7500,
        discountAmount: 7500 - baseRegFee,
        netAmount: baseRegFee,
        frequency: 'annual',
        description: 'One-time registration valid for 5 full years across registered sales outlets.',
      });

      // Estimated Assaying & Hallmarking Fee
      const estArticles = sampleCount * 250;
      const baseAssayFee = estArticles * 45; // ~?45 per gold article
      items.push({
        label: `Assaying & Hallmarking Charges (${estArticles} articles)`,
        baseAmount: baseAssayFee,
        discountAmount: 0,
        netAmount: baseAssayFee,
        frequency: 'per-sample',
        description: 'HUID engraving and purity verification at AHC center.',
      });

      guidelines.push('Hallmarking is mandatory in 256+ notified districts across India.');
      guidelines.push('Includes unique 6-digit alphanumeric HUID (Hallmark Unique Identification).');
    }
    else {
      // General / Management / Scheme-IV
      schemeName = 'Management Systems Certification / Scheme-IV';

      items.push({
        label: 'Application Fee',
        baseAmount: 10000,
        discountAmount: (10000 * concessionPct) / 100,
        netAmount: 10000 - (10000 * concessionPct) / 100,
        frequency: 'one-time',
        description: 'Formal system certification application.',
      });

      items.push({
        label: 'Assessment & Audit Charges (Stage 1 & 2)',
        baseAmount: 24000,
        discountAmount: 0,
        netAmount: 24000,
        frequency: 'one-time',
        description: '2 man-days audit for ISO 9001 / ISO 14001 / ISO 22000.',
      });

      items.push({
        label: 'Annual Licence Fee',
        baseAmount: 15000,
        discountAmount: (15000 * concessionPct) / 100,
        netAmount: 15000 - (15000 * concessionPct) / 100,
        frequency: 'annual',
        description: 'System certificate validity fee.',
      });

      guidelines.push('Valid for 3 years subject to annual surveillance audits.');
    }

    const totalFirstYearCost = items.reduce((acc, item) => acc + item.netAmount, 0);
    const totalConcessionSaved = items.reduce((acc, item) => acc + item.discountAmount, 0);

    const calculated: FeeCalculationResult = {
      schemeName,
      scaleLabel,
      breakdown: items,
      totalFirstYearCost,
      totalConcessionSaved,
      concessionPercentage: concessionPct,
      schemeGuidelines: guidelines,
      applicableStandardNotice: 'Estimates are based on BIS (Conformity Assessment) Regulations 2018 & Gazette notifications. Actual testing fees may vary depending on laboratory tariff.',
    };

    setResult(calculated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="bg-gradient-to-r from-bis-900 via-bis-800 to-bis-950 rounded-2xl p-6 text-white shadow-lg border border-bis-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Official Tariff Calculator
                </span>
                <span className="text-xs text-slate-300">BIS Act 2016 Compliant</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                BIS Fee & Certification Cost Estimator
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Calculate official statutory application fees, inspection man-day charges, minimum marking fees, and instant MSME/Startup concessions.
              </p>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0 hidden sm:block">
              <Calculator className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Interactive Form Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Scheme Type Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Certification Scheme Type
              </label>
              <select
                value={schemeType}
                onChange={(e) => setSchemeType(e.target.value as SchemeType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              >
                <option value="scheme_1">Scheme-I: Product Certification (ISI Mark)</option>
                <option value="scheme_2">Scheme-II: Compulsory Registration (CRS Electronics)</option>
                <option value="hallmarking">Hallmarking Scheme: Gold & Silver Jewellery</option>
                <option value="scheme_4">Scheme-IV: Certificate of Conformity (CoC)</option>
                <option value="management_sys">Management Systems Certification (ISO 9001/14001)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Choose the regulatory conformity assessment scheme applicable to your product.
              </p>
            </div>

            {/* 2. Scale of Industry Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>2. Scale of Industry / Enterprise</span>
                <span className="text-amber-700 font-semibold text-[11px]">Up to 50% Concession</span>
              </label>
              <select
                value={industryScale}
                onChange={(e) => setIndustryScale(e.target.value as IndustryScale)}
                disabled={isForeignManufacturer}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="micro">Micro Enterprise (50% Fee Concession - Udyam)</option>
                <option value="startup">DPIIT Recognized Startup / Women-led (50% Concession)</option>
                <option value="small">Small Enterprise (20% Fee Concession)</option>
                <option value="medium">Medium Enterprise (Standard Rates)</option>
                <option value="large">Large Scale Enterprise (Standard Rates)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Special government incentives are available for Micro & DPIIT startups.
              </p>
            </div>

            {/* 3. Product Varieties / Models */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Number of Product Varieties / Licences
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={productCount}
                onChange={(e) => setProductCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              />
              <p className="text-[11px] text-slate-500">
                Number of distinct standard specifications or product categories.
              </p>
            </div>

            {/* 4. Test Sample Batches */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Testing Batches / Sample Sets
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={sampleCount}
                onChange={(e) => setSampleCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
              />
              <p className="text-[11px] text-slate-500">
                Expected number of test samples to be sent to BIS recognized laboratory.
              </p>
            </div>
          </div>

          {/* Foreign Manufacturer Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="foreignManufacturer"
                checked={isForeignManufacturer}
                onChange={(e) => setIsForeignManufacturer(e.target.checked)}
                className="w-4 h-4 text-bis-700 rounded border-slate-300 focus:ring-bis-500"
              />
              <label htmlFor="foreignManufacturer" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Foreign Manufacturer Certification Scheme (FMCS) applicant
              </label>
            </div>

            <button
              onClick={calculateFees}
              className="px-6 py-2.5 bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Calculate Estimate</span>
            </button>
          </div>
        </div>

        {/* Results Card */}
        {result && (
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden animate-slide-up">
            {/* Result Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-bis-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded">
                  {result.scaleLabel}
                </span>
                <h2 className="text-lg sm:text-xl font-bold mt-1 text-white">
                  Estimated Fee Breakdown: {result.schemeName}
                </h2>
              </div>

              {result.totalConcessionSaved > 0 && (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center shrink-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    MSME Subsidy Savings
                  </div>
                  <div className="text-base font-extrabold text-white">
                    ?{result.totalConcessionSaved.toLocaleString('en-IN')} Saved
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown Table */}
            <div className="p-5 sm:p-6 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                      <th className="py-3 px-4">Fee Component</th>
                      <th className="py-3 px-4">Frequency</th>
                      <th className="py-3 px-4 text-right">Standard Tariff</th>
                      <th className="py-3 px-4 text-right text-emerald-600">Concession</th>
                      <th className="py-3 px-4 text-right text-slate-900">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.breakdown.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.label}</div>
                          <div className="text-[11px] text-slate-500">{item.description}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-full">
                            {item.frequency}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          ?{item.baseAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                          {item.discountAmount > 0 ? `- ?${item.discountAmount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ?{item.netAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 bg-bis-50/50 font-bold">
                      <td colSpan={4} className="py-4 px-4 text-sm text-bis-950 font-extrabold">
                        Total Estimated First-Year Statutory Investment:
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-base sm:text-lg text-bis-900 font-extrabold">
                        ?{result.totalFirstYearCost.toLocaleString('en-IN')}*
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Guidelines & Notes */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-bis-700" />
                  <span>Regulatory Compliance Notes:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {result.schemeGuidelines.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                  <li>Applicable GST (currently 18%) is extra on all statutory fees.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-400">
                  *Excludes travel/stay of inspecting officers for factory audits.
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Summary</span>
                  </button>

                  {onAskAIAboutEstimate && (
                    <button
                      onClick={() =>
                        onAskAIAboutEstimate(
                          `Please explain the detailed fee structure, required documents, and inspection process for ${result.schemeName} for a ${result.scaleLabel}.`
                        )
                      }
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-bis-700 hover:bg-bis-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Consult AI on this Fee</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
