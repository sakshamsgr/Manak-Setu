import React from 'react';
import { Modal } from '../common/Modal';
import { Download, Smartphone, Monitor, Share, PlusSquare, CheckCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  onNativeInstall: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isIOS,
  onNativeInstall,
}) => {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-bis-900">
          <Download className="w-5 h-5 text-amber-500" />
          <span className="font-extrabold">{t('install.modalTitle') || 'Install Manak Setu PWA'}</span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4 text-xs sm:text-sm text-slate-600">
        <p className="text-slate-700 font-medium leading-relaxed">
          {t('install.description') || 'Install Manak Setu — Bureau of Indian Standards (BIS) AI Compliance Portal as a standalone application on your phone or desktop for instant offline access, fast loading, and official regulatory guidance.'}
        </p>

        {isInstallable && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-sm">{t('install.oneClickReady') || 'One-Click Install Ready'}</div>
              <div className="text-xs text-amber-700">{t('install.oneClickDesc') || 'Click below to add directly to your home screen or desktop.'}</div>
            </div>
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-bis-950 font-extrabold rounded-xl shadow transition-all shrink-0 text-xs sm:text-sm cursor-pointer"
            >
              {t('install.installNow') || 'Install App Now'}
            </button>
          </div>
        )}

        {isIOS ? (
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-bis-700" />
              <span>{t('install.iosTitle') || 'iOS Safari Installation Steps:'}</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>{t('install.iosStep1') || 'Tap the Share icon at the bottom of Safari.'} <Share className="w-3.5 h-3.5 inline mx-1 text-bis-700" /></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>{t('install.iosStep2') || 'Scroll down and tap Add to Home Screen.'} <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-bis-700" /></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>{t('install.iosStep3') || 'Tap Add in the top-right corner to finish.'}</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Monitor className="w-4 h-4 text-bis-700" />
                <span>{t('install.desktopTitle') || 'Desktop (Chrome / Edge)'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('install.desktopDesc') || 'Click the Install icon in your browser address bar (top-right) or select "Install Manak Setu" from the menu.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Smartphone className="w-4 h-4 text-bis-700" />
                <span>{t('install.androidTitle') || 'Android (Chrome)'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('install.androidDesc') || 'Tap the browser menu (⋮) and select "Install app" or "Add to Home screen".'}
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('install.compliantBadge') || 'BIS Act 2016 Compliant PWA'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            {t('install.closeBtn') || 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
