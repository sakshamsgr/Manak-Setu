import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, Send, Sparkles, Loader2, ShieldCheck, User, Copy, Check } from 'lucide-react';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { useLanguage } from '../../context/LanguageContext';

interface StepContextualAIProps {
  stepName: string;
  productName: string;
  suggestedQuestions?: string[];
  onAskQuestion: (question: string) => Promise<{ reply: string; citations: Citation[] }>;
}

export const StepContextualAI: React.FC<StepContextualAIProps> = ({
  stepName,
  productName,
  suggestedQuestions = [],
  onAskQuestion,
}) => {
  const { t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: Citation[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleSubmit = async (textToSubmit?: string) => {
    const qText = (textToSubmit || question).trim();
    if (!qText || isLoading) return;

    const userMsg = { role: 'user' as const, text: qText };
    setHistory((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Add step context to prompt so backend responds accurately
      const contextualPrompt = `[Context: ${stepName} for ${productName}] ${qText}`;
      const res = await onAskQuestion(contextualPrompt);

      const assistantMsg = {
        role: 'assistant' as const,
        text: res.reply,
        citations: res.citations,
      };
      setHistory((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg = {
        role: 'assistant' as const,
        text: `?? **Notice**: ${err.message || 'Unable to retrieve standard answer.'}`,
      };
      setHistory((prev) => [...prev, errMsg]);
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
    <div className="mt-8 pt-6 border-t-2 border-slate-200/80 space-y-4">
      {/* Contextual Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-bis-100 text-bis-800">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              {t('contextualAITitle')} — {stepName}
            </h4>
            <p className="text-[11px] text-slate-500">
              {t('contextualAISubtitle')}
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded">
          RAG AI Assistant
        </span>
      </div>

      {/* Suggested Quick Questions */}
      {suggestedQuestions.length > 0 && history.length === 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(sq)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-bis-50 border border-slate-200 hover:border-bis-300 text-slate-700 hover:text-bis-900 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{sq}</span>
            </button>
          ))}
        </div>
      )}

      {/* History Thread for This Step */}
      {history.length > 0 && (
        <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-96 overflow-y-auto custom-scrollbar">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="shrink-0">
                {msg.role === 'user' ? (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bis-900 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-bis-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="font-medium">{msg.text}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="prose prose-slate max-w-none text-xs prose-headings:text-bis-900 prose-p:leading-relaxed prose-table:border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <CitationsEvidenceGrid citations={msg.citations} />
                    )}

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleCopy(msg.text, idx)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-bis-800 p-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-bis-600" />
              <span>Retrieving Indian Standard context from vector database...</span>
            </div>
          )}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-2 bg-slate-50 border border-slate-300 focus-within:border-bis-600 focus-within:ring-2 focus-within:ring-bis-100 rounded-xl p-1.5 transition-all shadow-inner"
      >
        <input
          type="text"
          placeholder={t('contextualAIPlaceholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-2 py-1"
        />

        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shrink-0 ${
            question.trim() && !isLoading
              ? 'bg-bis-800 hover:bg-bis-700 text-white shadow-xs'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>{t('askBtn')}</span>
              <Send className="w-3 h-3" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
