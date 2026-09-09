import React from 'react';
import { Info } from 'lucide-react';

export interface PageInfoButtonProps {
  sectionId: string;
  tooltip?: string;
  variant?: 'dark' | 'light' | 'subtle' | 'amber';
  className?: string;
  size?: 'xs' | 'sm';
}

export const navigateToInfoSection = (sectionId: string) => {
  try {
    sessionStorage.setItem('bis_active_tab', 'info');
    window.location.hash = `info#${sectionId}`;
    window.dispatchEvent(
      new CustomEvent('manak_setu_navigate', {
        detail: { tab: 'info', sectionId },
      })
    );

    // If section element is already present in the active DOM, scroll immediately
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error('Failed to navigate to info section:', err);
  }
};

export const PageInfoButton: React.FC<PageInfoButtonProps> = ({
  sectionId,
  tooltip = 'Learn more in the BIS Compliance Guide',
  variant = 'light',
  className = '',
  size = 'sm',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 shadow-xs';
      case 'amber':
        return 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 hover:text-amber-200 border border-amber-400/40 shadow-xs';
      case 'subtle':
        return 'bg-slate-200/60 hover:bg-slate-300 text-slate-600 hover:text-slate-900 border border-slate-300/80';
      case 'light':
      default:
        return 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs';
    }
  };

  const dimensions = size === 'xs' ? 'w-5 h-5' : 'w-6 h-6';
  const iconDimensions = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToInfoSection(sectionId);
      }}
      className={`inline-flex items-center justify-center rounded-full transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer shrink-0 ${dimensions} ${getVariantStyles()} ${className}`}
      aria-label={tooltip}
      title={tooltip}
    >
      <Info className={`${iconDimensions} stroke-[2.2]`} />
    </button>
  );
};
