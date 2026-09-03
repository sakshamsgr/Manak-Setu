import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const GovBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-slate-950 text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: National Affiliation */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-400 tracking-wide">{t('gov.indiaHindi')}</span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-200">{t('gov.india')}</span>
          <span className="hidden md:inline text-slate-400">• {t('gov.ministry')}</span>
        </div>

        {/* Right: Official Portal Jump Links */}
        <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
          <a
            href="https://www.manakonline.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <span>{t('gov.manakonline')}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-slate-700">|</span>
          <a
            href="https://www.services.bis.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <span>{t('gov.standardsPortal')}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-slate-700">|</span>
          <a
            href="https://bis.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <span>{t('gov.officialPortal')}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
