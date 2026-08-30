import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SchemeType, IndustryScale, FeeCalculationResult, FeeItemBreakdown } from '../../types/estimator';

interface FeeEstimatorViewProps {
  onAskAIAboutEstimate?: (prompt: string) => void;
}

export const FeeEstimatorView: React.FC<FeeEstimatorViewProps> = ({ onAskAIAboutEstimate }) => {
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

    if (isForeignManufacturer) {
      concessionPct = 0;
      scaleLabel = 'Foreign Manufacturer (FMCS)';
    } else {
      switch (industryScale) {
        case 'micro':
          concessionPct = 50;
          scaleLabel = 'Micro Enterprise (50% Concession with Udyam)';
          break;
        case 'small':
          concessionPct = 20;
          scaleLabel = 'Small Enterprise (20% Concession)';
          break;
        case 'startup':
          concessionPct = 50;
          scaleLabel = 'DPIIT Startup / Women-led Unit (50% Concession)';
          break;
        case 'medium':
          concessionPct = 0;
          scaleLabel = 'Medium Scale Enterprise';
          break;
        case 'large':
          concessionPct = 0;
          scaleLabel = 'Large Scale Industry';
          break;
      }
    }

    if (schemeType === 'scheme_1') {
      schemeName = 'Scheme-I: Product Certification (ISI Mark)';
      
      // Statutory Application Fee
      const baseAppFee = isForeignManufacturer ? 25000 : 1000 * productCount;
      const appDiscount = (baseAppFee * concessionPct) / 100;
      items.push({
        label: 'Statutory Application Fee (Official BIS)',
        baseAmount: baseAppFee,
        discountAmount: appDiscount,
        netAmount: baseAppFee - appDiscount,
        frequency: 'one-time',
        description: 'Fixed statutory fee under BIS (Conformity Assessment) Regulations 2018.',
      });

      // Preliminary Factory Inspection Fee
      const baseInspFee = isForeignManufacturer ? 75000 : 7000 * Math.max(1, Math.ceil(productCount / 2));
      items.push({
        label: 'Preliminary Inspection Charges (Official BIS)',
        baseAmount: baseInspFee,
        discountAmount: 0,
        netAmount: baseInspFee,
        frequency: 'one-time',
        description: 'Statutory man-day audit fee for factory inspection by BIS officer.',
      });

      // Minimum Annual Marking Fee
      const baseMarkingFee = isForeignManufacturer ? 80000 : 35000 * productCount;
      const markDiscount = (baseMarkingFee * concessionPct) / 100;
      items.push({
        label: 'Minimum Annual Marking Fee (Official BIS)',
        baseAmount: baseMarkingFee,
        discountAmount: markDiscount,
        netAmount: baseMarkingFee - markDiscount,
        frequency: 'annual',
        description: 'Annual statutory tariff for usage of the ISI Standard Mark.',
      });

      // Estimated Lab Testing Fee (Clearly separated!)
      const baseTestFee = 18000 * sampleCount;
      items.push({
        label: 'Estimated Laboratory Testing Charges (Third-Party / Lab Tariff)',
        baseAmount: baseTestFee,
        discountAmount: 0,
        netAmount: baseTestFee,
        frequency: 'per-sample',
        description: 'Estimated testing charges at BIS or NABL recognized lab (varies by product standard).',
      });

      guidelines.push('Licence is granted for a minimum initial period of 1 to 2 years.');
      guidelines.push('Valid Udyam Registration Certificate is required to claim the 50% / 20% MSME concession.');
      guidelines.push('GST at 18% is applicable extra on all statutory BIS fees.');
    } 
    else if (schemeType === 'scheme_2') {
      schemeName = 'Scheme-II: Compulsory Registration Scheme (CRS Electronics)';

      const baseAppFee = 1000 * productCount;
      const appDiscount = (baseAppFee * concessionPct) / 100;
      items.push({
        label: 'Statutory Application Fee (Official BIS)',
        baseAmount: baseAppFee,
        discountAmount: appDiscount,
        netAmount: baseAppFee - appDiscount,
        frequency: 'one-time',
        description: 'CRS portal registration fee.',
      });

      const baseProcFee = 50000 * productCount;
      const procDiscount = (baseProcFee * (concessionPct > 0 ? 20 : 0)) / 100;
      items.push({
        label: 'Test Report Evaluation Fee (Official BIS)',
        baseAmount: baseProcFee,
        discountAmount: procDiscount,
        netAmount: baseProcFee - procDiscount,
        frequency: 'one-time',
        description: 'Technical evaluation of test report from BIS recognized lab.',
      });

      items.push({
        label: 'Registration Fee (2 Years Validity - Official BIS)',
        baseAmount: 10000,
        discountAmount: 0,
        netAmount: 10000,
        frequency: 'annual',
        description: 'Statutory 2-year validity registration fee.',
      });

      guidelines.push('Test report must be from a BIS-recognized lab and issued within the last 90 days.');
      guidelines.push('Standard Mark (CRS Logo with R-Number) must be displayed on product & packaging.');
    }
    else if (schemeType === 'hallmarking') {
      schemeName = 'Hallmarking Scheme: Gold & Silver Jewellery';

      const baseRegFee = industryScale === 'micro' ? 3750 : 7500;
      items.push({
        label: 'Jeweller Registration Fee (5 Years - Official BIS)',
        baseAmount: 7500,
        discountAmount: 7500 - baseRegFee,
        netAmount: baseRegFee,
        frequency: 'annual',
        description: 'Statutory 5-year registration for jewellery sales outlets.',
      });

      const estArticles = sampleCount * 200;
      const baseAssayFee = estArticles * 45;
      items.push({
        label: `Estimated Assaying & Hallmarking Charges (${estArticles} articles)`,
        baseAmount: baseAssayFee,
        discountAmount: 0,
        netAmount: baseAssayFee,
        frequency: 'per-sample',
        description: 'Statutory ?45 per gold jewellery article at recognized AHC centers.',
      });

      guidelines.push('Includes unique 6-digit alphanumeric HUID (Hallmark Unique Identification).');
    }
    else {
      schemeName = 'Management Systems Certification / Scheme-IV';

      items.push({
        label: 'Application Fee (Official BIS)',
        baseAmount: 10000,
        discountAmount: (10000 * concessionPct) / 100,
        netAmount: 10000 - (10000 * concessionPct) / 100,
        frequency: 'one-time',
        description: 'Statutory system certification application.',
      });

      items.push({
        label: 'Assessment & Audit Charges (Stage 1 & 2)',
        baseAmount: 24000,
        discountAmount: 0,
        netAmount: 24000,
        frequency: 'one-time',
        description: 'Man-day audit fee for ISO 9001 / ISO 14001.',
      });

      items.push({
        label: 'Annual Licence Fee (Official BIS)',
        baseAmount: 15000,
        discountAmount: (15000 * concessionPct) / 100,
        netAmount: 15000 - (15000 * concessionPct) / 100,
        frequency: 'annual',
        description: 'System certificate validity fee.',
      });
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
      applicableStandardNotice: 'Official BIS statutory fees are governed by BIS (Conformity Assessment) Regulations 2018. Laboratory testing fees are market estimates and subject to laboratory tariffs.',
    };

    setResult(calculated);

    if (totalConcessionSaved > 0) {
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
            Statutory Tariff & Concessions
          </span>
          <span className="text-xs text-slate-300">Conformity Assessment Regulations 2018</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          BIS Fee & Certification Cost Estimator
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Transparently calculate official statutory application fees, inspection man-day charges, minimum marking fees, and instant 50% Udyam MSME / DPIIT Startup concessions.
        </p>
      </div>

      {/* Interactive Form Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Scheme Type Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              1. Certification Scheme Type
            </label>
            <select
              value={schemeType}
              onChange={(e) => setSchemeType(e.target.value as SchemeType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
            >
              <option value="scheme_1">Scheme-I: Product Certification (ISI Mark)</option>
              <option value="scheme_2">Scheme-II: Compulsory Registration (CRS Electronics)</option>
              <option value="hallmarking">Hallmarking Scheme: Gold & Silver Jewellery</option>
              <option value="scheme_4">Scheme-IV: Certificate of Conformity (CoC)</option>
              <option value="management_sys">Management Systems Certification (ISO 9001/14001)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Select the applicable regulatory scheme for your product category.
            </p>
          </div>

          {/* 2. Scale of Industry Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>2. Scale of Industry / Enterprise</span>
              <span className="text-amber-700 font-bold text-[11px]">Up to 50% Concession</span>
            </label>
            <select
              value={industryScale}
              onChange={(e) => setIndustryScale(e.target.value as IndustryScale)}
              disabled={isForeignManufacturer}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="micro">Micro Enterprise (50% Fee Concession with Udyam)</option>
              <option value="startup">DPIIT Recognized Startup / Women-led (50% Concession)</option>
              <option value="small">Small Enterprise (20% Fee Concession)</option>
              <option value="medium">Medium Enterprise (Standard Statutory Tariff)</option>
              <option value="large">Large Scale Enterprise (Standard Statutory Tariff)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Special government incentives for Micro & DPIIT registered startups.
            </p>
          </div>

          {/* 3. Product Varieties */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              3. Number of Product Varieties / Licences
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={productCount}
              onChange={(e) => setProductCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              Number of distinct standard specifications or product lines.
            </p>
          </div>

          {/* 4. Test Sample Batches */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              4. Testing Batches / Sample Sets
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={sampleCount}
              onChange={(e) => setSampleCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              Expected number of test samples to be sent to BIS recognized lab.
            </p>
          </div>
        </div>

        {/* Foreign Manufacturer Toggle */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="foreignManufacturer"
              checked={isForeignManufacturer}
              onChange={(e) => setIsForeignManufacturer(e.target.checked)}
              className="w-4 h-4 text-bis-800 rounded border-slate-300 focus:ring-bis-500"
            />
            <label htmlFor="foreignManufacturer" className="text-xs font-bold text-slate-700 cursor-pointer">
              Foreign Manufacturer Certification Scheme (FMCS) applicant
            </label>
          </div>

          <button
            onClick={calculateFees}
            className="px-6 py-2.5 bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow flex items-center gap-2 transition-all transform active:scale-95 shrink-0"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Calculate Statutory Estimate</span>
          </button>
        </div>
      </div>

      {/* Results Card */}
      {result && (
        <div className="bg-white rounded-3xl shadow-card border border-slate-200 overflow-hidden animate-slide-up space-y-6">
          {/* Result Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-bis-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded">
                {result.scaleLabel}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold mt-1 text-white">
                Estimated Fee Breakdown: {result.schemeName}
              </h2>
            </div>

            {result.totalConcessionSaved > 0 && (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center shrink-0">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                  MSME Subsidy Savings
                </div>
                <div className="text-base font-extrabold text-white">
                  ?{result.totalConcessionSaved.toLocaleString('en-IN')} Saved
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="p-6 sm:p-8 space-y-6">
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
                        <div className="font-bold text-slate-900">{item.label}</div>
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
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {item.discountAmount > 0 ? `- ?${item.discountAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        ?{item.netAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 bg-bis-50/60 font-bold">
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

            {/* Disclaimer Alert */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700" />
                <span>Statutory Tariff Distinction Notice:</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                Official statutory BIS fees (Application, Inspection, Annual Marking) are fixed by Gazette notification under BIS (Conformity Assessment) Regulations 2018. Laboratory testing charges are market-based estimates and vary depending on the chosen NABL laboratory tariff.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Breakdown</span>
              </button>

              {onAskAIAboutEstimate && (
                <button
                  onClick={() =>
                    onAskAIAboutEstimate(
                      `Please explain the detailed statutory fee schedule, inspection charges, and document checklist for ${result.schemeName} for a ${result.scaleLabel}.`
                    )
                  }
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-bis-800 hover:bg-bis-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Consult AI on this Fee Structure</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
