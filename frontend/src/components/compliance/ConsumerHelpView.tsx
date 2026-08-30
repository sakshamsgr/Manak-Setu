import React from 'react';
import { 
  UserCheck, 
  Smartphone, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink,
  Sparkles,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface ConsumerHelpViewProps {
  onStartConsultation: (prompt: string) => void;
}

export const ConsumerHelpView: React.FC<ConsumerHelpViewProps> = ({ onStartConsultation }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
            Consumer Empowerment & Protection
          </span>
          <span className="text-xs text-slate-300">BIS Care Portal</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          Verify ISI Mark, Hallmarking & Consumer Rights
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Learn how to authenticate ISI-marked goods using the CM/L licence number, verify gold jewellery with 6-digit HUID, report substandard products, and exercise rights under the Consumer Protection Act 2019.
        </p>
      </div>

      {/* 3 Pillars of Consumer Verification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: ISI Mark Verification */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-bis-100 text-bis-800 flex items-center justify-center font-extrabold text-sm">
            1
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900">
              Verify ISI Mark (CM/L Number)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every genuine ISI mark MUST carry a 7 or 8-digit CM/L (Certification Marks Licence) number below the mark and the Indian Standard number above.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Standard ISI Format:</div>
            <div className="font-bold text-bis-900">IS 302-2-3 (Standard Code)</div>
            <div className="text-slate-500">CM/L - XXXXXXX (7/8 Digits)</div>
          </div>
        </div>

        {/* Card 2: Gold Hallmarking HUID */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-sm">
            2
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900">
              Verify Gold Jewellery HUID
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Since April 2023, every piece of gold jewellery must bear 3 marks: BIS Logo, Purity mark (e.g. 22K916), and a 6-digit alphanumeric HUID code.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1 font-mono">
            <div className="text-[10px] text-amber-700 uppercase font-sans font-bold">3 Mandatory Marks:</div>
            <div className="font-bold">1. BIS Triangle Logo</div>
            <div className="font-bold">2. Purity: 22K916 / 18K750</div>
            <div className="font-bold text-amber-950">3. HUID: [6 Characters e.g. AB1234]</div>
          </div>
        </div>

        {/* Card 3: BIS Care Mobile App */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-sm">
            3
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900">
              Download BIS Care Mobile App
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use the official "BIS Care" Android & iOS app to scan HUID codes, verify manufacturer licence details, and lodge instant complaints.
            </p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.bis.biscare"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>BIS Care Mobile Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grievance & Reporting Redressal */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
            How to Report Misuse of ISI Mark & Substandard Products
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Under Section 29 of the BIS Act 2016, manufacturing, importing, or selling goods bearing counterfeit ISI marks or non-compliant mandatory QCO goods is a cognizable criminal offence punishable by imprisonment up to 2 years and hefty fines.
        </p>

        <div className="pt-2">
          <button
            onClick={() => onStartConsultation('How can a consumer verify if an ISI mark is genuine or counterfeit? What is the grievance redressal process on the BIS Care App?')}
            className="px-5 py-2.5 rounded-xl bg-bis-800 hover:bg-bis-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Ask AI about Consumer Rights & Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
