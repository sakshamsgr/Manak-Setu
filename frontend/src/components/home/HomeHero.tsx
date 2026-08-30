import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Paperclip, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowRight, 
  X, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  BookOpen, 
  FlaskConical, 
  Calculator,
  Award,
  Zap,
  Droplets,
  Radio,
  Loader2
} from 'lucide-react';
import { MainNavTab } from '../layout/Header';

interface HomeHeroProps {
  onSubmitQuery: (query: string, file?: File) => void;
  onSelectNavTab: (tab: MainNavTab) => void;
  isLoading: boolean;
}

const SAMPLE_PRODUCT_PROMPTS = [
  {
    icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
    label: 'Electric Kettles & Appliances',
    prompt: 'I manufacture electric kettles. What BIS standards, QCO orders, and testing requirements do I need to follow?',
  },
  {
    icon: <Droplets className="w-3.5 h-3.5 text-bis-500" />,
    label: 'Packaged Drinking Water',
    prompt: 'What are the mandatory licensing steps and chemical testing parameters for Packaged Drinking Water under IS 10500?',
  },
  {
    icon: <Radio className="w-3.5 h-3.5 text-purple-500" />,
    label: 'PVC Cables & Wires',
    prompt: 'Is ISI mark mandatory for PVC insulated building wires under IS 694? What is the factory audit protocol?',
  },
  {
    icon: <Award className="w-3.5 h-3.5 text-emerald-500" />,
    label: 'Lithium-ion Batteries (CRS)',
    prompt: 'What are the Scheme-II Compulsory Registration (CRS) requirements and lab test reports for secondary lithium batteries under IS 16046?',
  },
];

export const HomeHero: React.FC<HomeHeroProps> = ({
  onSubmitQuery,
  onSelectNavTab,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!query.trim() && !selectedFile) || isLoading) return;
    onSubmitQuery(query.trim(), selectedFile || undefined);
  };

  const handleQuickPromptClick = (promptText: string) => {
    setQuery(promptText);
    onSubmitQuery(promptText);
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background National Graphic Element */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-bis-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 -mb-12 -ml-12 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Value Proposition Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bis-50 border border-bis-200 text-bis-900 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-bis-700" />
            <span>National Standards Compliance Gateway • SIH 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Your Guide to <span className="text-bis-800">BIS Standards</span> & <span className="text-amber-600">Certification</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Find applicable Indian Standards, verify Quality Control Orders (QCOs), understand testing requirements, and access verified official BIS source citations — all in one place.
          </p>
        </div>

        {/* Primary Interactive Consultation Card */}
        <div className="bg-white rounded-3xl shadow-card border-2 border-slate-200/90 p-4 sm:p-6 transition-all hover:border-bis-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Tell us about your product or compliance requirement:</span>
              </label>

              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Natural Language • Multimodal RAG
              </span>
            </div>

            {/* Selected Attachment Pill */}
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-bis-50 border border-bis-200 text-xs text-bis-900 animate-fade-in w-fit">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-bis-600" />
                ) : (
                  <FileText className="w-4 h-4 text-bis-600" />
                )}
                <span className="font-semibold max-w-[200px] truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-500">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 hover:bg-bis-200/60 rounded-md text-bis-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Text Input Area */}
            <div className="relative rounded-2xl bg-slate-50 border border-slate-300 focus-within:border-bis-700 focus-within:ring-2 focus-within:ring-bis-100 p-3 transition-all">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isRecording
                    ? 'Listening to your voice query...'
                    : 'Example: I manufacture electric kettles. What BIS standards, QCO mandates, and testing requirements do I need to follow?'
                }
                rows={3}
                disabled={isLoading}
                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm sm:text-base text-slate-900 placeholder:text-slate-400 resize-none font-medium custom-scrollbar"
              />

              {/* Action Toolbar Inside Box */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                <div className="flex items-center gap-1.5">
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-bis-900 hover:bg-slate-200/70 transition-colors"
                    title="Upload product photo, label, or technical specification sheet"
                  >
                    <Paperclip className="w-4 h-4 text-bis-700" />
                    <span className="hidden sm:inline">Attach Product Photo / Spec</span>
                    <span className="sm:hidden">Attach</span>
                  </button>

                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-slate-600 hover:text-bis-900 hover:bg-slate-200/70'
                    }`}
                    title={isRecording ? 'Listening... click to stop' : 'Speak your query'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-bis-700" />}
                    <span className="hidden sm:inline">{isRecording ? 'Listening...' : 'Voice Query'}</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={(!query.trim() && !selectedFile) || isLoading}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
                    (query.trim() || selectedFile) && !isLoading
                      ? 'bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white shadow-bis-900/20 transform active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Analyzing Standards...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Generate Compliance Dossier</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Starting Product Queries */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Explore Common Product Journeys:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SAMPLE_PRODUCT_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPromptClick(item.prompt)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-bis-50 border border-slate-200 hover:border-bis-300 text-left transition-all group"
                >
                  <div className="p-1 rounded-lg bg-white group-hover:bg-bis-100 transition-colors shrink-0 shadow-2xs">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-bis-900 truncate">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Core Starting Action Buttons (Actual User Needs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectNavTab('standards')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-bis-300 shadow-sm text-left transition-all group space-y-1.5"
          >
            <div className="p-2 rounded-xl bg-bis-50 text-bis-800 w-fit group-hover:bg-bis-800 group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
              Find Applicable Standard
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Search official IS catalog & QCO orders
            </p>
          </button>

          <button
            onClick={() => onSelectNavTab('certification')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-bis-300 shadow-sm text-left transition-all group space-y-1.5"
          >
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 w-fit group-hover:bg-amber-500 group-hover:text-bis-950 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
              Certification Roadmap
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Scheme-I, CRS, and Hallmarking steps
            </p>
          </button>

          <button
            onClick={() => onSelectNavTab('labs')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-bis-300 shadow-sm text-left transition-all group space-y-1.5"
          >
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
              Testing & Laboratories
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Locate BIS Apex & recognized test centers
            </p>
          </button>

          <button
            onClick={() => onSelectNavTab('estimator')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-bis-300 shadow-sm text-left transition-all group space-y-1.5"
          >
            <div className="p-2 rounded-xl bg-purple-50 text-purple-800 w-fit group-hover:bg-purple-700 group-hover:text-white transition-colors">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center justify-between">
              <span>Fee & Concession</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded">
                50% MSME
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Statutory tariff & startup incentives
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
