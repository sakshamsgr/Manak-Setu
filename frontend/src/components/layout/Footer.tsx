import React from 'react';
import { ShieldCheck, ExternalLink, Phone, Mail, MapPin, Award, CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-auto">
      {/* Upper Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: About BIS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bis-700 to-bis-900 border border-amber-400/40 p-1 flex items-center justify-center shadow">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight">Bureau of Indian Standards</div>
              <div className="text-[10px] text-amber-400 font-semibold uppercase">????: ??????????:</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The National Standards Body of India established under the BIS Act 2016 for standardisation, marking, and quality certification of goods.
          </p>
        </div>

        {/* Col 2: Regulatory Schemes */}
        <div className="space-y-2.5">
          <div className="font-bold text-xs uppercase tracking-wider text-white">
            Certification Schemes
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li>• Scheme-I (Product Certification / ISI Mark)</li>
            <li>• Scheme-II (Compulsory Registration - CRS)</li>
            <li>• Scheme-IV (Certificate of Conformity)</li>
            <li>• Hallmarking of Gold & Silver Artefacts (HUID)</li>
            <li>• Foreign Manufacturers Certification Scheme (FMCS)</li>
            <li>• Management Systems Certification (ISO 9001/14001)</li>
          </ul>
        </div>

        {/* Col 3: Key Services */}
        <div className="space-y-2.5">
          <div className="font-bold text-xs uppercase tracking-wider text-white">
            Statutory Services
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li>
              <a href="https://www.manakonline.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 flex items-center gap-1">
                <span>e-BIS Portal (Manakonline)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>
              <a href="https://www.services.bis.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 flex items-center gap-1">
                <span>Know Your Standards Directory</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>
              <a href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 flex items-center gap-1">
                <span>BIS Care Mobile App (Verify CML/HUID)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>• LIMS Laboratory Management System</li>
            <li>• Quality Control Orders (QCO) Gazette Registry</li>
          </ul>
        </div>

        {/* Col 4: Contact & Headquarters */}
        <div className="space-y-2.5">
          <div className="font-bold text-xs uppercase tracking-wider text-white">
            Headquarters & Support
          </div>
          <div className="space-y-2 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Manak Bhavan, 9 Bahadur Shah Zafar Marg, New Delhi - 110002</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Toll Free: 1800-11-1200 / +91-11-23230131</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>helpdesk@bis.gov.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Disclaimer Strip */}
      <div className="bg-slate-950 px-4 sm:px-8 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © 2026 Bureau of Indian Standards (BIS) • AI Compliance Assistant (SIH 2026)
        </div>
        <div className="flex items-center gap-4">
          <span>BIS Act 2016 Compliant</span>
          <span>•</span>
          <span>Vector RAG with Gemini & Supabase</span>
          <span>•</span>
          <span className="text-amber-400/80 font-mono">v2.0 PWA</span>
        </div>
      </div>
    </footer>
  );
};
