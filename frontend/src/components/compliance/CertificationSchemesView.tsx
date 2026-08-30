import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  FileCheck, 
  Globe2, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Building,
  HelpCircle
} from 'lucide-react';

interface CertificationSchemesViewProps {
  onStartConsultation: (prompt: string) => void;
}

export const CertificationSchemesView: React.FC<CertificationSchemesViewProps> = ({ onStartConsultation }) => {
  const schemes = [
    {
      id: 'scheme_1',
      title: 'Scheme-I: Product Certification (ISI Mark)',
      badge: 'Most Popular • Domestic',
      color: 'border-bis-300 bg-bis-50/50',
      description: 'Third-party assurance of product quality and safety based on factory auditing, routine in-house testing, and independent laboratory evaluation.',
      keySteps: [
        'Confirm product standard in Schedule-I',
        'Setup in-house testing laboratory according to Scheme of Inspection and Testing (SIT)',
        'Submit Form-I on Manakonline with factory layout & test equipment list',
        'Physical verification audit by BIS Inspecting Officer',
        'Independent sample testing at BIS Central / Recognized laboratory',
        'Grant of CM/L licence & ISI mark affixation',
      ],
      suitableFor: 'Domestic manufacturers of electrical appliances, cement, steel, cables, drinking water, chemicals, toys.',
      prompt: 'Explain the complete step-by-step procedure to obtain Scheme-I (ISI Mark) licence on the Manakonline portal.',
    },
    {
      id: 'scheme_2',
      title: 'Scheme-II: Compulsory Registration Scheme (CRS)',
      badge: 'Electronics & IT Hardware',
      color: 'border-amber-300 bg-amber-50/40',
      description: 'Self-declaration of conformity based on testing at BIS-recognized laboratories for electronics, IT hardware, batteries, and solar equipment.',
      keySteps: [
        'Identify product under MeitY / MNRE / DoT notification',
        'Submit test samples to BIS-recognized laboratory for compliance testing',
        'Obtain test report issued within 90 days',
        'Submit online self-declaration application on CRS portal',
        'Grant of Registration with unique R-Number',
        'Affix Standard Mark (CRS Logo with R-Number) on product & carton',
      ],
      suitableFor: 'Laptops, mobile phones, power banks, secondary cells, LED drivers, smart watches, server hardware.',
      prompt: 'What are the required documents and laboratory testing rules for Scheme-II (CRS) registration for electronics?',
    },
    {
      id: 'hallmarking',
      title: 'Hallmarking Scheme: Gold & Silver Jewellery',
      badge: 'Precious Metals • Mandatory',
      color: 'border-yellow-300 bg-yellow-50/40',
      description: 'Purity certification of gold and silver articles to protect consumers against adulteration using 6-digit alphanumeric HUID (Hallmark Unique Identification).',
      keySteps: [
        'Register sales outlets / jewellery showrooms on Manakonline portal',
        'Submit jewellery lots to BIS Assaying & Hallmarking Centres (AHC)',
        'XRF testing and fire assay testing at AHC',
        'Laser engraving of 3 mandatory marks: BIS Logo, Purity in Carat (e.g. 22K916), and 6-digit HUID',
        'Traceability verification in BIS Care Mobile Database',
      ],
      suitableFor: 'Jewellers, bullion assayers, gold & silver manufacturers across 256+ notified districts.',
      prompt: 'Explain the mandatory Gold Hallmarking rules, HUID registration process, and jeweller compliance requirements.',
    },
    {
      id: 'fmcs',
      title: 'Foreign Manufacturers Certification Scheme (FMCS)',
      badge: 'Overseas Exporters to India',
      color: 'border-purple-300 bg-purple-50/40',
      description: 'Grants licence to overseas manufacturers to use the Standard Mark on products exported to India, ensuring equivalent safety and quality.',
      keySteps: [
        'Appoint an Authorized Indian Representative (AIR)',
        'Submit Form-VI with factory manufacturing details and statutory FMCS fees',
        'BIS officer visits overseas factory for verification audit',
        'Testing of counter-samples at BIS Central Laboratory in India',
        'Submission of Performance Bank Guarantee (PBG)',
        'Issuance of FMCS Licence and ISI mark affixation',
      ],
      suitableFor: 'Foreign manufacturers exporting products covered under mandatory QCOs to India.',
      prompt: 'What is the complete procedure, role of Authorized Indian Representative (AIR), and fees for Foreign Manufacturers Certification Scheme (FMCS)?',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
            Conformity Assessment Framework
          </span>
          <span className="text-xs text-slate-300">Regulations 2018</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          BIS Certification Schemes & Compliance Roadmaps
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          The Bureau of Indian Standards operates multiple specialized conformity assessment schemes tailored to domestic manufacturing, electronics hardware, precious metals, and overseas exporters.
        </p>
      </div>

      {/* Schemes Grid */}
      <div className="space-y-6">
        {schemes.map((sc) => (
          <div
            key={sc.id}
            className={`rounded-3xl p-6 sm:p-8 border-2 ${sc.color} bg-white shadow-sm space-y-6`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-900 text-white rounded">
                  {sc.badge}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                  {sc.title}
                </h2>
              </div>

              <button
                onClick={() => onStartConsultation(sc.prompt)}
                className="px-4 py-2 rounded-xl bg-bis-800 hover:bg-bis-700 active:bg-bis-900 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Consult AI on this Scheme</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {sc.description}
            </p>

            {/* Step Pipeline */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Key Compliance Milestones:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sc.keySteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-bis-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-500">
              <strong className="text-slate-700">Target Goods:</strong>
              <span>{sc.suitableFor}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
