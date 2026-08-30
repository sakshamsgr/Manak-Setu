import React, { useState } from 'react';
import { GovBanner } from './components/layout/GovBanner';
import { Header, MainNavTab } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { InstallModal } from './components/layout/InstallModal';

import { HomeHero } from './components/home/HomeHero';
import { ConsultationDossier } from './components/home/ConsultationDossier';
import { TrustStatsSection } from './components/home/TrustStatsSection';

import { ConsultationChatView } from './components/chat/ConsultationChatView';
import { StandardsQCOExplorer } from './components/compliance/StandardsQCOExplorer';
import { CertificationSchemesView } from './components/compliance/CertificationSchemesView';
import { LabDirectoryView } from './components/compliance/LabDirectoryView';
import { ConsumerHelpView } from './components/compliance/ConsumerHelpView';
import { FeeEstimatorView } from './components/estimator/FeeEstimatorView';

import { useChat } from './hooks/useChat';
import { useConsultation } from './hooks/useConsultation';
import { usePWAInstall } from './hooks/usePWAInstall';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  // General Chat Session Hook
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    deleteSession,
    clearCurrentMessages,
    messages,
    isLoading: isChatLoading,
    sendMessage: sendChatMessage,
    sendAttachment: sendChatAttachment,
  } = useChat();

  // Structured Product Consultation Hook
  const {
    activeDossier,
    followUpMessages,
    isLoading: isConsultationLoading,
    startConsultation,
    sendFollowUp,
    resetConsultation,
  } = useConsultation();

  // PWA Installation Hook
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePWAInstall();

  // Handle hero consultation query submit
  const handleHeroSubmit = (query: string, file?: File) => {
    setActiveTab('home');
    startConsultation(query, file);
  };

  // Jump to chat with a pre-filled prompt
  const handleStartChatPrompt = (prompt: string) => {
    setActiveTab('chat');
    sendChatMessage(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-bis-200 selection:text-bis-950">
      {/* 1. Official Government of India Top Banner */}
      <GovBanner />

      {/* 2. Official BIS Header & Unified Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenInstallModal={() => setShowInstallModal(true)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstallClick={triggerInstall}
      />

      {/* 3. Main Content Views */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* VIEW 1: HOME / COMPLIANCE NAVIGATOR */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col space-y-8">
            {/* Hero Consultation Query Box */}
            <HomeHero
              onSubmitQuery={handleHeroSubmit}
              onSelectNavTab={setActiveTab}
              isLoading={isConsultationLoading}
            />

            {/* If user has an active product dossier, render it prominently */}
            {activeDossier ? (
              <div className="px-4 sm:px-6 lg:px-8">
                <ConsultationDossier
                  dossier={activeDossier}
                  followUpMessages={followUpMessages}
                  onSendFollowUp={sendFollowUp}
                  onReset={resetConsultation}
                  isLoading={isConsultationLoading}
                  onJumpToEstimator={() => setActiveTab('estimator')}
                />
              </div>
            ) : (
              /* Otherwise, show the National Standardization Infrastructure statistics */
              <TrustStatsSection />
            )}
          </div>
        )}

        {/* VIEW 2: AI CONSULTATION ASSISTANT (CHAT) */}
        {activeTab === 'chat' && (
          <ConsultationChatView
            sessions={sessions}
            activeSession={activeSession}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={createNewSession}
            onDeleteSession={deleteSession}
            messages={messages}
            isLoading={isChatLoading}
            onSendMessage={sendChatMessage}
            onSendAttachment={sendChatAttachment}
            onClearChat={clearCurrentMessages}
          />
        )}

        {/* VIEW 3: STANDARDS & QCO FINDER */}
        {activeTab === 'standards' && (
          <StandardsQCOExplorer onConsultStandard={handleStartChatPrompt} />
        )}

        {/* VIEW 4: CERTIFICATION ROADMAP & SCHEMES */}
        {activeTab === 'certification' && (
          <CertificationSchemesView onStartConsultation={handleStartChatPrompt} />
        )}

        {/* VIEW 5: TESTING & LABORATORIES DIRECTORY */}
        {activeTab === 'labs' && (
          <LabDirectoryView onConsultLab={handleStartChatPrompt} />
        )}

        {/* VIEW 6: STATUTORY FEE ESTIMATOR */}
        {activeTab === 'estimator' && (
          <FeeEstimatorView onAskAIAboutEstimate={handleStartChatPrompt} />
        )}

        {/* VIEW 7: CONSUMER VERIFICATION & HELP */}
        {activeTab === 'consumer' && (
          <ConsumerHelpView onStartConsultation={handleStartChatPrompt} />
        )}
      </main>

      {/* 4. Official Footer */}
      <Footer />

      {/* 5. PWA Guidance Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        onNativeInstall={triggerInstall}
      />
    </div>
  );
};

export default App;
