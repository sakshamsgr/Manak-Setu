import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  Scale, 
  Building, 
  Coins, 
  FileCheck2, 
  HelpCircle, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface AboutBISProps {
  onStartConsultation: (prompt?: string) => void;
}

export const AboutBIS: React.FC<AboutBISProps> = ({ onStartConsultation }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-bis-900 to-bis-950 rounded-2xl p-6 text-white shadow-lg border border-bis-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                Statutory Framework & Quality Architecture
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white">
                About the Bureau of Indian Standards (BIS)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5">
                The National Standards Body of India, operating under the BIS Act 2016 to foster harmonious development of standardization, product certification, and hallmarking.
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0 hidden sm:block">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        {/* 5 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-bis-100 text-bis-800 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Scheme-I: ISI Mark Certification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Third-party assurance of product quality, safety, and reliability. Involves factory evaluation, in-process QC audit, and surveillance testing.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Scheme-II: Compulsory Registration (CRS)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Self-declaration of conformity based on laboratory test reports for electronics, IT hardware, batteries, and telecom equipment.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Hallmarking Scheme</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Purity certification for gold and silver jewellery using 6-digit alphanumeric HUID (Hallmark Unique Identification Number).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900">Foreign Manufacturers (FMCS)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Grants licence to overseas manufacturers to use the Standard Mark on products exported to India, ensuring equivalent quality.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              5
            </div>
            <h3 className="font-bold text-sm text-slate-900">Management Systems Certification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conformity certification for ISO 9001 (Quality), ISO 14001 (Environment), ISO 22000 (Food Safety), and ISO 27001 (Information Security).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              6
            </div>
            <h3 className="font-bold text-sm text-slate-900">Laboratory Recognition (LIMS)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Centralized network of government and NABL-accredited commercial testing facilities linked through Laboratory Information Management System.
            </p>
          </div>
        </div>

        {/* MSME Incentives Section */}
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-2xl p-6 border border-amber-200/80 space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm sm:text-base">
            <Coins className="w-5 h-5 text-amber-600" />
            <span>Government Incentives for MSMEs and DPIIT Startups</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Under special gazette notifications, the Bureau of Indian Standards offers extensive financial concessions to promote Indian indigenous manufacturing:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <div className="font-bold text-xs text-slate-900">50% Concession for Micro & Startups</div>
              <div className="text-xs text-slate-600">
                50% waiver on application fees and minimum annual marking fees for Micro enterprises holding Udyam certificates and DPIIT-recognized startups.
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <div className="font-bold text-xs text-slate-900">20% Concession for Small Enterprises</div>
              <div className="text-xs text-slate-600">
                20% reduction on statutory application and marking fees for registered Small Enterprises.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Consultation CTA */}
        <div className="p-6 bg-bis-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-base">Have specific regulatory questions?</div>
            <div className="text-xs text-slate-300">
              Our AI Assistant is indexed with the latest Indian Standards, QCOs, and licensing regulations.
            </div>
          </div>

          <button
            onClick={() => onStartConsultation('Explain the complete step-by-step procedure to apply for a BIS licence on the Manakonline portal.')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-bis-950 font-bold text-xs sm:text-sm rounded-xl shadow transition-all shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
