import React, { useState } from 'react';
import { FileText, CheckCircle2, ArrowRight, ArrowLeft, CheckSquare, Square, FolderCheck, Sparkles } from 'lucide-react';
import { DocumentItem } from '../../types/compliance';
import { StepContextualAI } from './StepContextualAI';
import { Citation } from '../../types/chat';
import { useLanguage } from '../../context/LanguageContext';

interface Step5DocumentsProps {
  productName: string;
  documents: DocumentItem[];
  onNext: () => void;
  onPrev: () => void;
  onAskAI: (question: string) => Promise<{ reply: string; citations: Citation[] }>;
}

export const Step5Documents: React.FC<Step5DocumentsProps> = ({
  productName,
  documents,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(['doc_1', 'doc_2']));

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progressPct = Math.round((checkedIds.size / Math.max(1, documents.length)) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 5 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s5Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s5Subtitle')}
        </p>
      </div>

      {/* Progress Bar Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-bis-100 text-bis-800 shrink-0">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              Document Readiness Checklist
            </h4>
            <p className="text-xs text-slate-500">
              {checkedIds.size} of {documents.length} essential files verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-48">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">{progressPct}%</span>
        </div>
      </div>

      {/* Interactive Document Items */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const isChecked = checkedIds.has(doc.id);
          return (
            <div
              key={doc.id}
              onClick={() => toggleCheck(doc.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                isChecked
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:border-bis-300'
              }`}
            >
              <div className="mt-0.5 text-bis-700 shrink-0">
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className={`text-xs sm:text-sm font-bold ${isChecked ? 'text-slate-900' : 'text-slate-700'}`}>
                    {doc.title}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded">
                    {doc.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('prevStepBtn')}</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95"
        >
          <span>{t('s5ContinueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Embedded Contextual AI Assistant */}
      <StepContextualAI
        stepName="Step 5: Document Preparation Checklist"
        productName={productName}
        suggestedQuestions={[
          'What format is required for the factory layout drawing and testing room setup?',
          'What documents are needed to prove in-house chemist qualification?',
          'What is the validity period for raw material test certificates (MTC)?',
        ]}
        onAskQuestion={onAskAI}
      />
    </div>
  );
};
