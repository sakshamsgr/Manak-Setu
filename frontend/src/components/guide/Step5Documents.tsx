import React, { useState } from 'react';
import { 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  FolderCheck, 
  ExternalLink, 
  Sparkles,
  Info
} from 'lucide-react';
import { DocumentItem } from '../../types/compliance';
import { PageInfoButton } from '../common/PageInfoButton';
import { useLanguage } from '../../context/LanguageContext';

interface Step5DocumentsProps {
  productName: string;
  documents: DocumentItem[];
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step5Documents: React.FC<Step5DocumentsProps> = ({
  productName,
  documents,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Legal', 'Technical', 'Quality Control', 'Testing'];

  const totalCount = documents.length;
  const mandatoryCount = documents.filter(d => d.required).length;

  const filteredDocs = selectedCategory === 'All'
    ? documents
    : documents.filter(d => d.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
            Stage 4 of 5
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {t('s5Title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('s5Subtitle')}
          </p>
        </div>
        <PageInfoButton
          sectionId="section-documents"
          tooltip="Learn about Statutory Application Documents in the Guide"
          variant="light"
          size="sm"
        />
      </div>

      {/* Statutory Documents Summary Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-bis-100 text-bis-800 shrink-0">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              Statutory Application Checklist
            </h4>
            <p className="text-xs text-slate-500">
              {totalCount} statutory {totalCount === 1 ? 'document' : 'documents'} required for application under Scheme-I
            </p>
          </div>
        </div>

        {mandatoryCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              {mandatoryCount} Mandatory
            </span>
          </div>
        )}
      </div>

      {/* Document Preparation Notice */}
      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-start gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-bold text-xs text-sky-950">Document Preparation</h4>
          <p className="leading-relaxed text-[11px] text-sky-900">
            Prepare the documents required for your BIS application based on the selected product, Indian Standard, and applicable certification scheme.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = cat === 'All'
              ? documents.length
              : documents.filter(d => d.category.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-bis-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === cat ? 'bg-bis-800 text-amber-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Document Items List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              No verified document requirements were found in the available BIS evidence for this standard.
            </p>
            <p className="text-xs text-slate-400">
              Only statutory requirements verified against official BIS Product Manuals and documentation are displayed.
            </p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <p className="text-sm text-slate-600">
              No verified documents in category "{selectedCategory}".
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-5 rounded-2xl border bg-white border-slate-200 hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {doc.title}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded">
                    {doc.category}
                  </span>
                  {doc.required ? (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 rounded">
                      Mandatory
                    </span>
                  ) : doc.requiredStatus ? (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 rounded">
                      {doc.requiredStatus}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {doc.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500">
                  {doc.responsibleParty && (
                    <span><strong>Party: </strong>{doc.responsibleParty}</span>
                  )}
                  {doc.applicableWhen && (
                    <span><strong>Applicable: </strong>{doc.applicableWhen}</span>
                  )}
                  {doc.sourceUrl && (
                    <a
                      href={doc.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-bis-700 hover:text-bis-900 font-bold"
                    >
                      <span>Official Format</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ask AI Helper */}
      {onAskAI && (
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-600">
            Have questions about Form-V, machinery schedules, or NABL calibration certificates?
          </p>
          <button
            type="button"
            onClick={() =>
              onAskAI(
                productName
                  ? `What statutory documents, calibration certificates, and layout plans are required for ${productName}?`
                  : 'What statutory documents, calibration certificates, and layout plans are required for BIS certification?'
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bis-900 hover:text-bis-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Ask Manak Setu AI about Documents
          </button>
        </div>
      )}

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
    </div>
  );
};
