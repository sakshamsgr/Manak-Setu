import React from 'react';
import { ExternalLink, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-auto">
      {/* Upper Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Col 1: Manak Setu Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white font-serif">MANAK SETU</span>
            <span className="text-xs font-bold text-amber-400 font-sans">मानक सेतु</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            National Standards Compliance & Advisory Portal for Indian Standards, Certification Schemes, and Statutory Regulations under the BIS Act 2016.
          </p>
        </div>

        {/* Col 2: Interactive Statutory Services */}
        <div className="space-y-2.5">
          <div className="font-bold text-xs uppercase tracking-wider text-white">
            Statutory Services
          </div>
          <ul className="space-y-2 text-[11px] text-slate-400">
            <li>
              <a href="https://www.manakonline.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 flex items-center gap-1 transition-colors">
                <span>e-BIS Portal (Manakonline)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>
              <a href="https://www.services.bis.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 flex items-center gap-1 transition-colors">
                <span>Know Your Standards Directory</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
            <li>
              <a href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 flex items-center gap-1 transition-colors">
                <span>BIS Care Mobile App (Verify CML/HUID)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Interactive Support & Headquarters */}
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
              <a href="tel:1800111200" className="hover:text-amber-300 transition-colors">Toll Free: 1800-11-1200 / +91-11-23230131</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <a href="mailto:helpdesk@bis.gov.in" className="hover:text-amber-300 transition-colors">helpdesk@bis.gov.in</a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="bg-slate-950 px-4 sm:px-8 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © 2026 Manak Setu • Bureau of Indian Standards (BIS)
        </div>
        <div className="flex items-center gap-4">
          <span>BIS Act 2016 Compliant</span>
          <span>•</span>
          <span className="text-amber-400/80 font-mono">v2.0 PWA</span>
        </div>
      </div>
    </footer>
  );
};
