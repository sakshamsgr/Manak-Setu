import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ShieldCheck, 
  BookOpen, 
  FlaskConical, 
  FileText, 
  Factory, 
  Tag, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  RotateCcw, 
  Printer, 
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ComplianceDossier } from '../../types/compliance';
import { ChatMessage } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { MessageItem } from '../chat/MessageItem';

interface ConsultationDossierProps {
  dossier: ComplianceDossier;
  followUpMessages: ChatMessage[];
  onSendFollowUp: (text: string) => void;
  onReset: () => void;
  isLoading: boolean;
  onJumpToEstimator?: () => void;
}

export const ConsultationDossier: React.FC<ConsultationDossierProps> = ({
  dossier,
  followUpMessages,
  onSendFollowUp,
  onReset,
  isLoading,
  onJumpToEstimator,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'roadmap' | 'fullAnalysis'>('overview');

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isLoading) return;
    onSendFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-6xl mx-auto pb-12">
      {/* Top Action & Navigation Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 rounded-xl text-slate-500 hover:text-bis-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700 truncate max-w-[280px] sm:max-w-md">
            Query: "{dossier.query}"
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>

          {onJumpToEstimator && (
            <button
              onClick={onJumpToEstimator}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-bis-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Calculate Fees (50% MSME)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Executive Dossier Card */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 text-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-extrabold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg shadow-sm">
                Compliance Dossier
              </span>
              <span className="px-3 py-1 text-xs font-bold bg-bis-800 border border-bis-700 text-slate-200 rounded-lg">
                {dossier.scheme}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Official BIS Standards Authority Assessment</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              {dossier.productName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Regulatory compliance pathway, applicable Indian Standard specification, and statutory conformity assessment roadmap.
            </p>
          </div>

          {/* Standard & Applicability Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Standard Box */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Applicable Indian Standard:</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                {dossier.applicableStandard.code}
              </div>
              <div className="text-xs text-slate-300 line-clamp-1">
                {dossier.applicableStandard.title}
              </div>
            </div>

            {/* Applicability Box */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Regulatory Applicability:</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-300">
                {dossier.applicability}
              </div>
              <div className="text-xs text-slate-300 line-clamp-1">
                {dossier.qcoNotification || 'Statutory compliance mandate under BIS Act 2016.'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Dossier */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-bis-800 text-bis-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Executive Summary & Pillars
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'border-bis-800 text-bis-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Certification Roadmap (6 Steps)
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'requirements'
                ? 'border-bis-800 text-bis-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            4 Compliance Pillars Checklist
          </button>
          <button
            onClick={() => setActiveTab('fullAnalysis')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'fullAnalysis'
                ? 'border-bis-800 text-bis-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Full Regulatory Analysis
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* 4 Pillars Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-bis-700"></span>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
                    4 Pillars of BIS Conformity Assessment
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dossier.requirements.map((req, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-bis-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-bis-100 text-bis-800">
                            {req.category === 'Testing' && <FlaskConical className="w-4 h-4" />}
                            {req.category === 'Documentation' && <FileText className="w-4 h-4" />}
                            {req.category === 'Factory QC' && <Factory className="w-4 h-4" />}
                            {req.category === 'Marking' && <Tag className="w-4 h-4" />}
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{req.title}</span>
                        </div>

                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 rounded">
                          Mandatory
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                      <ul className="space-y-1.5 pt-1">
                        {req.details.map((d, di) => (
                          <li key={di} className="text-xs text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Roadmap Preview */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
                      Step-by-Step Licensing Pipeline
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className="text-xs font-bold text-bis-700 hover:text-bis-900 flex items-center gap-1"
                  >
                    <span>View Full Roadmap</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dossier.roadmap.slice(0, 3).map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-full bg-bis-900 text-white text-xs font-bold flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {step.estimatedTimeline}
                        </span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{step.title}</div>
                      <p className="text-xs text-slate-500 line-clamp-2">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Sources / Citations Section */}
              <CitationsEvidenceGrid citations={dossier.citations} />
            </div>
          )}

          {/* TAB 2: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Comprehensive 6-Step Certification Journey for {dossier.productName}
                </h3>
                <p className="text-xs text-slate-500">
                  Follow this standardized statutory roadmap to achieve Bureau of Indian Standards (BIS) certification without compliance delays.
                </p>
              </div>

              <div className="relative border-l-2 border-bis-200 ml-4 pl-6 sm:pl-8 space-y-8">
                {dossier.roadmap.map((step) => (
                  <div key={step.stepNumber} className="relative group">
                    {/* Circle Badge on Timeline */}
                    <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 rounded-full bg-bis-900 text-white font-extrabold text-xs flex items-center justify-center border-4 border-white shadow">
                      {step.stepNumber}
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 group-hover:border-bis-300 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-bis-700 bg-bis-100 px-2 py-0.5 rounded">
                            {step.subtitle}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                            {step.title}
                          </h4>
                        </div>
                        {step.estimatedTimeline && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-600 font-mono">
                            ? {step.estimatedTimeline}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>

                      {step.actionItem && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-bis-800">
                          <span className="text-amber-500">? Key Action:</span>
                          <span>{step.actionItem}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REQUIREMENTS */}
          {activeTab === 'requirements' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Detailed Conformity Assessment Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory documentation, testing infrastructure, and quality control specifications.
                </p>
              </div>

              <div className="space-y-4">
                {dossier.requirements.map((req, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-bis-900 text-white font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{req.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded">
                        Category: {req.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {req.details.map((d, di) => (
                        <div key={di} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FULL ANALYSIS */}
          {activeTab === 'fullAnalysis' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="prose prose-slate max-w-none prose-headings:text-bis-950 prose-strong:text-slate-900 prose-p:leading-relaxed prose-table:border prose-table:border-slate-300 prose-th:bg-slate-200 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {dossier.fullMarkdownResponse}
                  </ReactMarkdown>
                </div>
              </div>

              <CitationsEvidenceGrid citations={dossier.citations} />
            </div>
          )}
        </div>
      </div>

      {/* Interactive Consultation Follow-Up Section */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-bis-800" />
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Interactive Consultation Follow-up
            </h3>
            <p className="text-xs text-slate-500">
              Ask deeper questions regarding testing fees, document templates, recognized laboratories, or specific clauses.
            </p>
          </div>
        </div>

        {/* Follow-up Message History */}
        {followUpMessages.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100 max-h-96 overflow-y-auto custom-scrollbar p-2">
            {followUpMessages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleFollowUpSubmit} className="pt-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 focus-within:border-bis-600 focus-within:ring-2 focus-within:ring-bis-100 rounded-xl p-2 transition-all">
            <input
              type="text"
              placeholder={`Ask a follow-up about ${dossier.productName} (e.g. "What is the fee for a micro enterprise?", "Where is the testing lab in Delhi?")...`}
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 py-1.5 px-2"
            />

            <button
              type="submit"
              disabled={!followUpText.trim() || isLoading}
              className={`p-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shrink-0 ${
                followUpText.trim() && !isLoading
                  ? 'bg-bis-700 hover:bg-bis-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Ask</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
