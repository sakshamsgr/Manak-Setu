import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  UserCheck, 
  Search, 
  Paperclip, 
  Send, 
  Loader2, 
  ExternalLink, 
  ShieldAlert, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  HelpCircle,
  Copy,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  Mail,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { sendChatMessage, sendMultimodalMessage, verifyConsumerMark, ConsumerVerificationResult } from '../../services/api';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { PageInfoButton } from '../common/PageInfoButton';
import { Gem, ArrowRight } from 'lucide-react';

interface ConsumerHelpViewProps {
  onNavigateToHallmarking?: () => void;
}

export const ConsumerHelpView: React.FC<ConsumerHelpViewProps> = ({ onNavigateToHallmarking }) => {
  const { t, language } = useLanguage();

  // Verification Tool State
  const [verifyType, setVerifyType] = useState<'cml' | 'huid' | 'standard'>('cml');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ConsumerVerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Chat State
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: Citation[]; filename?: string }>>([]);
  const [sessionId] = useState(() => `consumer_${Date.now()}`);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState<{ text: string; file?: File } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const verifyAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (verifyAbortRef.current) verifyAbortRef.current.abort();
    };
  }, []);

  const quickCategories = [
    {
      label: 'Verify ISI / CM/L Mark',
      prompt: 'How do I verify the authenticity of an ISI Mark and its 7-digit CM/L number on the BIS Care app?',
    },
    {
      label: 'Verify Gold HUID',
      prompt: 'How can a consumer check the 6-digit Hallmark Unique Identification (HUID) on gold jewellery?',
    },
    {
      label: 'File a Quality Complaint',
      prompt: 'What is the procedure for a consumer to file a formal complaint against substandard or duplicate ISI goods under the BIS Act 2016?',
    },
    {
      label: 'Mandatory ISI Products',
      prompt: 'Which everyday consumer products like helmets, packaged water, and toys are legally mandatory to carry the ISI mark?',
    },
    {
      label: 'Consumer Compensation Rights',
      prompt: 'What rights and compensation does a consumer have if an ISI-certified product is defective or fails safety limits?',
    },
  ];

  const handleVerify = async (customCode?: string) => {
    const codeToVerify = (customCode || verifyCode).trim().toUpperCase();
    if (!codeToVerify || verifyLoading) return;

    if (verifyAbortRef.current) {
      verifyAbortRef.current.abort();
    }
    const controller = new AbortController();
    verifyAbortRef.current = controller;

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const res = await verifyConsumerMark({
        queryType: verifyType,
        code: codeToVerify,
        language,
        signal: controller.signal,
      });
      setVerifyResult(res);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout;
      setVerifyError(
        isTimeout
          ? (t('common.aiTimeout') || 'Verification took longer than expected. Please retry.')
          : (t('common.apiUnavailable') || 'Verification failed. Please try again.')
      );
    } finally {
      setVerifyLoading(false);
      verifyAbortRef.current = null;
    }
  };

  const handleAsk = async (textToSubmit?: string) => {
    const q = (textToSubmit || query).trim();
    if ((!q && !selectedFile) || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const file = selectedFile || undefined;
    const userDisplay = q || (file ? `Uploaded ${file.name} for consumer verification` : '');

    setLastQuery({ text: q, file });
    setHistory((prev) => [...prev, { role: 'user', text: userDisplay, filename: file?.name }]);
    setQuery('');
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      let res;
      if (file) {
        res = await sendMultimodalMessage(sessionId, q, file, language, controller.signal);
      } else {
        res = await sendChatMessage(
          sessionId, 
          q, 
          language, 
          { 
            page: 'consumer',
            tab: 'consumer',
            userType: 'consumer',
            stage: 'Consumer Protection & Grievance',
          }, 
          controller.signal
        );
      }

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          citations: res.citations,
        },
      ]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout || err.message?.includes('timeout');
      const errText = isTimeout
        ? (t('common.aiTimeout') || 'Response is taking longer than expected. Please retry.')
        : (t('common.apiUnavailable') || 'Unable to connect right now. Please try again.');

      setErrorMessage(errText);
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **${errText}**`,
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryLast = () => {
    if (lastQuery) {
      handleAsk(lastQuery.text);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-bis-950 via-slate-900 to-bis-900 text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>BIS Consumer Protection & Grievance Gateway</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
            >
              <span>BIS Care Mobile Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <PageInfoButton
              sectionId="section-consumer-verification"
              tooltip="Learn about Consumer Verification & BIS Care in the Guide"
              variant="dark"
              size="sm"
            />
          </div>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('consumer.title') || 'BIS Consumer Help & Verification Gateway'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('consumer.subtitle') || 'Empowering consumers to verify genuine ISI marks, check HUID jewellery purity, and report substandard goods.'}
          </p>
        </div>
      </div>

      {/* Dedicated Hallmarking Portal Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-bis-950 shrink-0 shadow-xs">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-amber-950">
              Looking for Gold or Silver Hallmarking? Visit our Dedicated Hallmarking Portal
            </div>
            <div className="text-[11px] text-amber-800">
              Explore our dedicated Hallmarking portal for consumer checks, official IS 1417 / IS 2112 purity tables, and jeweller licensing guides.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onNavigateToHallmarking) {
              onNavigateToHallmarking();
            } else {
              window.dispatchEvent(new CustomEvent('manak_setu_navigate', { detail: { tab: 'hallmarking' } }));
            }
          }}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
        >
          <span>Dedicated Hallmarking Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
          {/* Interactive Mark & Licence Verifier Tool */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-bis-700" />
                  <span>Instant Mark & Licence Verifier</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Verify CM/L licence formats, 6-digit gold HUID codes, or mandatory Indian Standard mandates (QCO).
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => { setVerifyType('cml'); setVerifyResult(null); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    verifyType === 'cml' ? 'bg-white text-bis-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CM/L Licence
                </button>
                <button
                  type="button"
                  onClick={() => { setVerifyType('huid'); setVerifyResult(null); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    verifyType === 'huid' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gold HUID
                </button>
                <button
                  type="button"
                  onClick={() => { setVerifyType('standard'); setVerifyResult(null); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    verifyType === 'standard' ? 'bg-white text-bis-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IS Standard
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                  placeholder={
                    verifyType === 'cml'
                      ? 'Enter 7 or 8-digit CM/L number (e.g. 1234567 or CM/L-9876543)'
                      : verifyType === 'huid'
                      ? 'Enter 6-character alphanumeric HUID code (e.g. AB12CD)'
                      : 'Enter Indian Standard number (e.g. IS 368 or 302)'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-bis-500 focus:border-bis-500 text-xs sm:text-sm font-semibold transition-all shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={!verifyCode.trim() || verifyLoading}
                className="px-6 py-2.5 rounded-xl bg-bis-900 hover:bg-bis-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Verify Mark</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-[11px]">Quick Samples:</span>
              <button
                type="button"
                onClick={() => { setVerifyType('cml'); setVerifyCode('1234567'); handleVerify('1234567'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                CM/L-1234567
              </button>
              <button
                type="button"
                onClick={() => { setVerifyType('huid'); setVerifyCode('AB12CD'); handleVerify('AB12CD'); }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-mono text-[11px]"
              >
                HUID: AB12CD
              </button>
              <button
                type="button"
                onClick={() => { setVerifyType('standard'); setVerifyCode('368'); handleVerify('368'); }}
                className="px-2.5 py-1 rounded-lg bg-bis-50 hover:bg-bis-100 text-bis-900 font-mono text-[11px]"
              >
                IS 368:2014
              </button>
            </div>

            {/* Verification Result Card */}
            {verifyResult && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-slide-up">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    {/* CM/L Licence badges */}
                    {verifyResult.query_type === 'cml' && verifyResult.found === true ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Licence Found
                      </span>
                    ) : verifyResult.query_type === 'cml' && verifyResult.valid_format === true && verifyResult.found === false && !verifyResult.error ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Valid Format — Not Found
                      </span>
                    ) : verifyResult.query_type === 'cml' && verifyResult.valid_format === false ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Invalid CM/L Format
                      </span>
                    ) : verifyResult.query_type === 'cml' && verifyResult.error ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Verification Error
                      </span>
                    ) : (
                      /* HUID / Standard badges */
                      verifyResult.title === 'INVALID HUID FORMAT' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Invalid HUID Format
                        </span>
                      ) : verifyResult.title === 'HUID VERIFIED — DEMO DATA' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          HUID VERIFIED — DEMO DATA
                        </span>
                      ) : verifyResult.title === 'HUID NOT FOUND' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          HUID NOT FOUND
                        </span>
                      ) : verifyResult.error ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Verification Error
                        </span>
                      ) : verifyResult.valid_format !== false ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Valid Format
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Format Discrepancy
                        </span>
                      )
                    )}

                    {verifyResult.is_mandatory && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase tracking-wide">
                        Mandatory Under QCO
                      </span>
                    )}
                    {verifyResult.title === 'HUID VERIFIED — DEMO DATA' && verifyResult.prototype_label && (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wide">
                        {verifyResult.prototype_label}
                      </span>
                    )}
                  </div>

                  <a
                    href={verifyResult.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-bis-700 hover:text-bis-900 flex items-center gap-1"
                  >
                    <span>Validate on Official BIS Portal (manual)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{verifyResult.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{verifyResult.description}</p>
                </div>

                {/* CM/L Database Record Grid — rendered exclusively from database values */}
                {verifyResult.query_type === 'cml' && verifyResult.found === true && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">CM/L Number</div>
                      <div className="text-xs font-bold text-slate-900 font-mono">{verifyResult.licence_number || '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Manufacturer</div>
                      <div className="text-xs font-bold text-slate-900">{verifyResult.manufacturer || '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Product</div>
                      <div className="text-xs font-bold text-slate-900">{verifyResult.product || '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Standard</div>
                      <div className="text-xs font-bold text-slate-900">{verifyResult.standard || '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Location</div>
                      <div className="text-xs font-bold text-slate-900">{verifyResult.location || '—'}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Status</div>
                      <div className={`text-xs font-bold ${
                        verifyResult.status?.toLowerCase() === 'active'
                          ? 'text-emerald-700'
                          : verifyResult.status?.toLowerCase() === 'cancelled' || verifyResult.status?.toLowerCase() === 'revoked'
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}>{verifyResult.status || '—'}</div>
                    </div>
                    {(verifyResult.valid_from || verifyResult.valid_until) && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2 flex gap-6">
                        {verifyResult.valid_from && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Valid From</div>
                            <div className="text-xs font-bold text-slate-900">{verifyResult.valid_from}</div>
                          </div>
                        )}
                        {verifyResult.valid_until && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Valid Until</div>
                            <div className="text-xs font-bold text-slate-900">{verifyResult.valid_until}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {verifyResult.query_type === 'huid' && verifyResult.huid && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">HUID</div><div className="text-xs font-bold text-slate-900">{verifyResult.huid}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">Material</div><div className="text-xs font-bold text-slate-900">{verifyResult.article_material || '—'}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">Purity</div><div className="text-xs font-bold text-slate-900">{verifyResult.purity || '—'}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">Jeweller Reg. No.</div><div className="text-xs font-bold text-slate-900">{verifyResult.jeweller_registration_number || '—'}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">Jeweller</div><div className="text-xs font-bold text-slate-900">{verifyResult.jeweller_name || '—'}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">AHC Centre</div><div className="text-xs font-bold text-slate-900">{verifyResult.ahc_centre_name || '—'}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">AHC Recognition No.</div><div className="text-xs font-bold text-slate-900">{verifyResult.ahc_recognition_number || '—'}</div></div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">AHC Address</div><div className="text-xs font-bold text-slate-900">{verifyResult.ahc_address || '—'}</div></div>
                  </div>
                )}

                {/* Mandatory marks breakdown if HUID */}
                {verifyResult.mandatory_marks && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {verifyResult.mandatory_marks.map((m, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
                        <div className="text-xs font-bold text-amber-900">{m.mark}</div>
                        <div className="text-[11px] text-slate-500">{m.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* QCO details if standard */}
                {verifyResult.qco && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1 text-xs">
                    <div className="font-bold text-amber-900">Quality Control Order Mandate:</div>
                    <div className="text-slate-700">Order: <strong>{verifyResult.qco.qco_name}</strong> ({verifyResult.qco.notification_number})</div>
                    <div className="text-slate-500 text-[11px]">Effective Date: {verifyResult.qco.effective_date}</div>
                  </div>
                )}

                {/* Step-by-step verification instructions */}
                {verifyResult.verification_steps && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-bold text-slate-800">How to Verify Your HUID with BIS</div>
                    <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
                      {verifyResult.verification_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {verifyError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{verifyError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('common.retry') || 'Retry'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 3 Consumer Guidance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="p-2 rounded-xl bg-bis-50 text-bis-800 w-fit">
                <Smartphone className="w-5 h-5 text-bis-700" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Verify ISI / CM/L Number</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every genuine ISI product carries a 7 or 8-digit CM/L number. Verify manufacturer name, brand, address, and license validity instantly on the BIS Care app.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800 w-fit">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Verify 6-Digit HUID on Gold</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the 6-digit alphanumeric code engraved on gold jewellery in the 'Verify HUID' tab to view jeweller registration and assay center details.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-800 w-fit">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Report Substandard / Fake Goods</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                File complaints against misuse of ISI mark, deceptive labelling, or substandard Quality Control Order (QCO) items with photos/invoices.
              </p>
            </div>
          </div>

          {/* Grievance & Complaint Redressal Pathway */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Consumer Grievance & Complaint Redressal Process</span>
                </h3>
                <p className="text-xs text-slate-500">
                  How to lodge a legally binding complaint against substandard or counterfeit ISI marked products under the BIS Act 2016.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="tel:1915"
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-bis-700" />
                  <span>NCH: 1915</span>
                </a>
                <a
                  href="mailto:complaints@bis.gov.in"
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-bis-700" />
                  <span>complaints@bis.gov.in</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-extrabold text-bis-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bis-900 text-white flex items-center justify-center text-[11px]">1</span>
                  <span>Gather Evidence</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Take clear photos of the product, ISI mark, 7-digit CM/L number, batch number, and keep the retail purchase invoice.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-extrabold text-bis-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bis-900 text-white flex items-center justify-center text-[11px]">2</span>
                  <span>Check BIS Care</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Validate the CM/L on the BIS Care App. If the manufacturer name or address does not match, it is a counterfeit mark.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-extrabold text-bis-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bis-900 text-white flex items-center justify-center text-[11px]">3</span>
                  <span>Lodge Grievance</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  File a complaint online via the e-BIS Complaints Portal or call BIS consumer toll-free helpline 1800-11-0001.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-extrabold text-bis-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bis-900 text-white flex items-center justify-center text-[11px]">4</span>
                  <span>Enforcement & Remedy</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  BIS officers conduct enforcement raids and test samples. Consumers are entitled to refund or replacement under CPA 2019.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Consumer Help AI Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-bis-100 text-bis-900">
                  <HelpCircle className="w-5 h-5 text-bis-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    BIS Consumer Compliance Assistant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ask questions or upload photos of product marks, labels, or invoices for instant standard guidance.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300">
                Official Sources
              </span>
            </div>

            {/* Quick Topic Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickCategories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(cat.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-bis-50 border border-slate-200 hover:border-bis-300 text-slate-700 hover:text-bis-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Chat History Thread */}
            {history.length > 0 && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-96 overflow-y-auto custom-scrollbar">
                {history.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 text-xs leading-relaxed ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-bis-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-2xs space-y-3'
                      }`}
                    >
                      {msg.filename && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-black/20 px-2 py-0.5 rounded w-fit mb-1">
                          <Paperclip className="w-3 h-3" />
                          <span>{msg.filename}</span>
                        </div>
                      )}

                      <div className="prose prose-slate max-w-none text-xs prose-headings:text-bis-900 prose-p:leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>

                      {msg.citations && msg.citations.length > 0 && (
                        <CitationsEvidenceGrid citations={msg.citations} />
                      )}

                      {msg.role === 'assistant' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleCopy(msg.text, idx)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                          >
                            {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-bis-800 p-2 font-medium bg-bis-50 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-bis-600" />
                    <span>Searching official standards database...</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner with Retry (Rule 8 & 9) */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetryLast}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('common.retry') || 'Retry'}</span>
                </button>
              </div>
            )}

            {/* Selected Attachment Pill */}
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-bis-50 border border-bis-200 text-xs text-bis-900 w-fit">
                <Paperclip className="w-4 h-4 text-bis-700" />
                <span className="font-semibold">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 hover:bg-bis-200 rounded text-bis-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-300 focus-within:border-bis-600 focus-within:ring-2 focus-within:ring-bis-100 rounded-2xl p-2 transition-all shadow-inner"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-bis-900 transition-colors"
                title="Upload mark photo or invoice PDF"
              >
                <Paperclip className="w-4 h-4 text-bis-700" />
              </button>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('consumer.searchPlaceholder') || 'Ask a consumer question (e.g. How to verify CML number, What if an ISI helmet breaks?)...'}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-2 py-1"
              />

              <button
                type="submit"
                disabled={(!query.trim() && !selectedFile) || isLoading}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                  (query.trim() || selectedFile) && !isLoading
                    ? 'bg-bis-900 hover:bg-bis-800 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>{t('assistant.sendBtn') || 'Send'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
    </div>
  );
};
