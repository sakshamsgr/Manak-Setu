import React from 'react';
import { 
  ExternalLink, 
  MapPin, 
  Compass, 
  Sparkles, 
  Gem, 
  Calculator, 
  UserCheck, 
  BookOpen, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { MainNavTab } from './Header';
import { useLanguage } from '../../context/LanguageContext';

export interface FooterProps {
  onSelectTab?: (tab: MainNavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const { t } = useLanguage();

  const handleNav = (tab: MainNavTab, e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      window.dispatchEvent(new CustomEvent('manak_setu_navigate', { detail: { tab } }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks: { label: string; tab: MainNavTab; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Product Guide', tab: 'home', icon: Compass },
    { label: 'Ask Manak Setu AI', tab: 'ask-ai', icon: Sparkles },
    { label: 'Hallmarking', tab: 'hallmarking', icon: Gem },
    { label: 'Fee Estimator', tab: 'estimator', icon: Calculator },
    { label: 'Consumer Help', tab: 'consumer', icon: UserCheck },
    { label: 'Info / Guide', tab: 'info', icon: BookOpen },
  ];

  const officialBisServices = [
    {
      title: 'Manakonline / e-BIS Portal',
      url: 'https://www.manakonline.in',
      desc: 'Online application & certification management',
    },
    {
      title: 'Know Your Standards',
      url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails',
      desc: 'Authoritative Indian Standards directory',
    },
    {
      title: 'BIS Care / Licence & HUID Verification',
      url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care',
      desc: 'Verify ISI CM/L licences, Hallmarking & complaints',
    },
    {
      title: 'BIS LIMS / Recognized Laboratories',
      url: 'https://www.lims.bis.gov.in',
      desc: 'Laboratory Information Management System',
    },
    {
      title: 'BIS Official Website',
      url: 'https://www.bis.gov.in',
      desc: 'National standards body of India',
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-auto">
      {/* Upper 4-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* SECTION 1 — MANAK SETU */}
          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-extrabold tracking-tight text-white font-serif">MANAK SETU</span>
                <span className="text-xs font-bold text-amber-400 font-sans">मानक सेतु</span>
              </div>
              <div className="inline-block px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/80 text-[10px] font-extrabold tracking-wider text-amber-300 uppercase">
                AI COMPLIANCE PORTAL
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              National Standards Compliance &amp; Advisory Portal for Indian Standards, BIS Certification, Testing &amp; Regulatory Guidance.
            </p>

            <p className="text-[11px] text-slate-400 italic">
              Built to help industries and consumers navigate BIS requirements.
            </p>
          </div>

          {/* SECTION 2 — QUICK LINKS */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>QUICK LINKS</span>
            </h3>

            <ul className="space-y-2 text-[11px]">
              {quickLinks.map(({ label, tab, icon: Icon }) => (
                <li key={tab}>
                  <a
                    href={`#${tab}`}
                    onClick={(e) => handleNav(tab, e)}
                    className="text-slate-300 hover:text-amber-300 flex items-center gap-2 py-0.5 transition-colors group cursor-pointer"
                  >
                    <Icon className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 3 — OFFICIAL BIS SERVICES */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL BIS SERVICES</span>
            </h3>

            <ul className="space-y-2.5 text-[11px]">
              {officialBisServices.map((service, idx) => (
                <li key={idx}>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col text-slate-300 hover:text-amber-300 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1 font-medium">
                      <span>{service.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-amber-300 transition-colors shrink-0" />
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors">
                      {service.desc}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 4 — SUPPORT & CONTACT */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>SUPPORT &amp; CONTACT</span>
            </h3>

            <div className="space-y-3 text-[11px] text-slate-300">
              {/* BIS Headquarters */}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-slate-300">
                  <div className="font-semibold text-white">Bureau of Indian Standards</div>
                  <div className="text-slate-400 leading-snug">
                    Manak Bhavan, 9 Bahadur Shah Zafar Marg, New Delhi 110002
                  </div>
                </div>
              </div>

              {/* Official BIS Contact Link */}
              <div className="pt-1">
                <a
                  href="https://www.bis.gov.in/contact-us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700/80 text-[11px] font-semibold transition-colors shadow-2xs"
                >
                  <span>Visit Official BIS Contact</span>
                  <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
                </a>
              </div>

              {/* Verified BIS Care / Citizen Help Portal */}
              <div className="pt-1 text-[10px] text-slate-400 leading-relaxed">
                For statutory queries, grievances, or feedback, connect directly through the official{' '}
                <a
                  href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>BIS Care Portal</span>
                  <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Subtle Divider */}
      <div className="border-t border-slate-800/80 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

      {/* Informational Disclaimer Strip */}
      <div className="bg-slate-950/60 px-4 sm:px-6 lg:px-8 py-2.5 text-center text-[10px] text-slate-400 leading-normal">
        <p>
          <span className="font-semibold text-slate-300">Disclaimer:</span> MANAK SETU provides informational guidance. For authoritative requirements, refer to official BIS sources.
        </p>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="bg-slate-950 px-4 sm:px-6 lg:px-8 py-3.5 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="font-medium text-slate-400">
          &copy; 2026 MANAK SETU
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] text-slate-500 font-medium">
          <span>Privacy</span>
          <span>&bull;</span>
          <span>Terms</span>
          <span>&bull;</span>
          <span>Accessibility</span>
        </div>
      </div>
    </footer>
  );
};
