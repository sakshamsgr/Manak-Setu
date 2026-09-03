import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Award, 
  ShieldCheck, 
  Search, 
  Paperclip, 
  Send, 
  Loader2, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  AlertCircle,
  Building2,
  Gem,
  Check,
  Copy,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { sendChatMessage, sendMultimodalMessage } from '../../services/api';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';

export const HallmarkingView: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: Citation[]; filename?: string }>>([]);
  const [sessionId] = useState(() => `hallmarking_${Date.now()}`);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const purityGrades = [
    { carat: '24K (999)', purity: '99.9% Fine Gold', use: 'Gold coins, bullion, high-purity bars' },
    { carat: '23K (958)', purity: '95.8% Pure Gold', use: 'Traditional ceremonial jewellery' },
    { carat: '22K (916)', purity: '91.6% Pure Gold', use: 'Most popular Indian bridal & retail jewellery' },
    { carat: '20K (833)', purity: '83.3% Pure Gold', use: 'Studded & daily wear ornaments' },
    { carat: '18K (750)', purity: '75.0% Pure Gold', use: 'Diamond & gemstone studded jewellery' },
    { carat: '14K (585)', purity: '58.5% Pure Gold', use: 'Modern lightweight & stone-set jewellery' },
  ];

  const quickQuestions = [
    'What are the 3 mandatory marks on hallmarked gold jewellery in India?',
    'How can a consumer verify 6-digit alphanumeric HUID on BIS Care App?',
    'What is the mandatory hallmarking notification under BIS Act 2016?',
    'What are the testing charges per gold article at an Assaying and Hallmarking Centre (AHC)?',
    'How does a retail jeweller register on Manakonline for hallmarking licence?',
  ];

  const handleAsk = async (textToSubmit?: string) => {
    const q = (textToSubmit || query).trim();
    if ((!q && !selectedFile) || isLoading) return;

    const file = selectedFile || undefined;
    const userDisplay = q || (file ? `Uploaded ${file.name} for hallmarking analysis` : '');

    setHistory((prev) => [...prev, { role: 'user', text: userDisplay, filename: file?.name }]);
    setQuery('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      let res;
      if (file) {
        res = await sendMultimodalMessage(sessionId, q, file, language);
      } else {
        res = await sendChatMessage(sessionId, q, language);
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
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `?? **Notice**: ${err.message || 'Unable to retrieve hallmarking standard answer.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
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
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-bis-950 text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
            <Gem className="w-4 h-4 text-amber-400" />
            <span>BIS Gold & Silver Hallmarking Scheme</span>
          </div>

          <a
            href="https://www.manakonline.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
          >
            <span>Jeweller Portal (e-BIS)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('hallmarking.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('hallmarking.subtitle')} Hallmarking protects consumers against adulteration and obligates manufacturers and jewellers to maintain statutory fineness standards.
          </p>
        </div>
      </div>

      {/* 3 Mandatory Signs of Genuine Hallmarked Gold */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>The 3 Mandatory Marks on Genuine BIS Hallmarked Gold Jewellery</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-sm border border-amber-200">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">BIS Standard Logo (Triangle)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official triangular BIS mark certifying that the metal has been assayed and certified in an authorized AHC.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-sm border border-amber-200">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">Purity / Fineness Grade (e.g. 22K916)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Indicates the exact carat and fineness in parts per thousand (e.g. 22K916 means 91.6% pure gold).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-sm border border-amber-200">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">6-Digit Alphanumeric HUID Code</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hallmark Unique Identification code laser-engraved on every single jewellery piece for end-to-end traceability.
            </p>
          </div>
        </div>
      </div>

      {/* Gold Purity Standards Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">
          Recognized Indian Standard Gold Fineness Grades (IS 1417)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-2.5 px-3">Carat & Fineness</th>
                <th className="py-2.5 px-3">Gold Content</th>
                <th className="py-2.5 px-3">Typical Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {purityGrades.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold font-mono text-slate-900">{g.carat}</td>
                  <td className="py-2.5 px-3 text-amber-800 font-semibold">{g.purity}</td>
                  <td className="py-2.5 px-3 text-slate-600">{g.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hallmarking Dedicated AI Assistant */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Hallmarking AI Consultation & Document/Image Analyzer
              </h3>
              <p className="text-xs text-slate-500">
                Ask specific questions or upload jewellery hallmark photos / AHC audit PDFs for standard verification.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
            Source-Backed RAG
          </span>
        </div>

        {/* Quick Question Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleAsk(q)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{q}</span>
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
              <div className="flex items-center gap-2 text-xs text-amber-900 p-2 font-medium bg-amber-50 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Retrieving official Hallmarking documentation from vector database...</span>
              </div>
            )}
          </div>
        )}

        {/* Selected Attachment Pill */}
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 w-fit">
            <Paperclip className="w-4 h-4 text-amber-700" />
            <span className="font-semibold">{selectedFile.name}</span>
            <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-amber-200 rounded text-amber-800"
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
          className="flex items-center gap-2 bg-slate-50 border border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 rounded-2xl p-2 transition-all shadow-inner"
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
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-amber-900 transition-colors"
            title="Upload hallmark photograph or jewellery certificate PDF"
          >
            <Paperclip className="w-4 h-4 text-amber-700" />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('hallmarking.searchPlaceholder')}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-2 py-1"
          />

          <button
            type="submit"
            disabled={(!query.trim() && !selectedFile) || isLoading}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
              (query.trim() || selectedFile) && !isLoading
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <span>{t('hallmarking.askBtn')}</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
