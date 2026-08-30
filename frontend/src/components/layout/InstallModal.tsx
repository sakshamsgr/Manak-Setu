import React from 'react';
import { Modal } from '../common/Modal';
import { Download, Smartphone, Monitor, Share, PlusSquare, CheckCircle } from 'lucide-react';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-bis-900">
          <Download className="w-5 h-5 text-amber-500" />
          <span>Install BIS AI Assistant PWA</span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4 text-sm text-slate-600">
        <p className="text-slate-700 font-medium">
          Install the BIS AI Assistant as a standalone application on your device for instant offline access, fast loading, and official Indian Standards consultation anytime.
        </p>

        {isInstallable && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm">One-Click Installation Ready</div>
              <div className="text-xs text-amber-700">Click below to add directly to your home screen or desktop.</div>
            </div>
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-bis-950 font-bold rounded-lg shadow transition-all shrink-0 text-xs sm:text-sm"
            >
              Install Now
            </button>
          </div>
        )}

        {isIOS ? (
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-bis-700" />
              <span>iOS Safari Installation Steps:</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Tap the <strong className="text-slate-900">Share</strong> icon <Share className="w-3.5 h-3.5 inline mx-1 text-bis-700" /> at the bottom of Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-bis-700" />.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Tap <strong className="text-slate-900">Add</strong> in the top-right corner to finish.</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Monitor className="w-4 h-4 text-bis-700" />
                <span>Desktop (Chrome / Edge)</span>
              </div>
              <p className="text-xs text-slate-600">
                Click the <strong className="text-slate-900">Install icon</strong> in your browser address bar or use the top navigation button.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Smartphone className="w-4 h-4 text-bis-700" />
                <span>Android (Chrome)</span>
              </div>
              <p className="text-xs text-slate-600">
                Tap the browser menu <strong className="text-slate-900">(?)</strong> and select <strong className="text-slate-900">"Install app"</strong> or "Add to Home screen".
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure & Official PWA</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
