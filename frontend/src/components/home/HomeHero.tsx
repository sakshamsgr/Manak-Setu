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
  Loader2,
  Gem,
  UserCheck,
  Building2,
  MapPin,
  Package,
  SlidersHorizontal,
  Bookmark,
  Trash2
} from 'lucide-react';
import { MainNavTab } from '../layout/Header';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';
import { ProductProfile } from '../../types/compliance';

interface HomeHeroProps {
  onSubmitQuery: (query: string, file?: File) => void;
  onSelectNavTab: (tab: MainNavTab) => void;
  isLoading: boolean;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onSubmitQuery,
  onSelectNavTab,
  isLoading,
}) => {
  const { t } = useLanguage();
  const { 
    productProfile, 
    updateProductProfile,
    savedGuides,
    loadSavedGuide,
    deleteSavedGuide
  } = useProductContext();

  const [query, setQuery] = useState('');
  const [productName, setProductName] = useState(productProfile.name || '');
  const [category, setCategory] = useState(productProfile.category || 'Electrical & Electronics');
  const [industryScale, setIndustryScale] = useState(productProfile.industryScale || 'micro');
  const [location, setLocation] = useState(productProfile.manufacturingLocation || 'Domestic Facility (India)');
  const [isForeign, setIsForeign] = useState(productProfile.isForeign || false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const sampleProductPrompts = [
    {
      icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
      label: 'Electric Iron (Dry / Steam)',
      prompt: 'I manufacture electric iron. What BIS standards, QCO orders, and testing requirements do I need to follow?',
      product: 'Electric Iron',
      cat: 'Electrical & Electronics',
    },
    {
      icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
      label: 'Electric Kettles & Geysers',
      prompt: 'What are the Scheme-I ISI marking requirements and dielectric safety tests for electric kettles under IS 302?',
      product: 'Electric Kettle',
      cat: 'Electrical & Electronics',
    },
    {
      icon: <Droplets className="w-3.5 h-3.5 text-bis-500" />,
      label: 'Packaged Drinking Water',
      prompt: 'What are the mandatory licensing steps and chemical testing parameters for Packaged Drinking Water under IS 10500?',
      product: 'Packaged Drinking Water',
      cat: 'Food & Agriculture',
    },
    {
      icon: <Radio className="w-3.5 h-3.5 text-purple-500" />,
      label: 'PVC Cables & Wires',
      prompt: 'Is ISI mark mandatory for PVC insulated building wires under IS 694? What is the factory audit protocol?',
      product: 'PVC Insulated Cables',
      cat: 'Electrical & Electronics',
    },
    {
      icon: <Gem className="w-3.5 h-3.5 text-amber-500" />,
      label: 'Gold Jewellery Hallmarking (HUID)',
      prompt: 'What are the mandatory BIS hallmarking guidelines, 6-digit HUID rules, and jeweller registration procedures?',
      product: 'Gold Jewellery Artefacts',
      cat: 'Hallmarking & Jewellery',
    },
    {
      icon: <Award className="w-3.5 h-3.5 text-emerald-500" />,
      label: 'Lithium-ion Batteries (CRS)',
      prompt: 'What are the Scheme-II Compulsory Registration (CRS) requirements and lab test reports for secondary lithium batteries under IS 16046?',
      product: 'Lithium-ion Battery Pack',
      cat: 'Electrical & Electronics',
    },
  ];

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    const effectiveQuery = query.trim() || (productName.trim() ? `Compliance requirements for ${productName.trim()}` : 'Compliance requirements for electrical appliances');

    // Persist all captured profile info to ProductContext so Step 1 has it pre-filled
    updateProductProfile({
      name: productName.trim() || query.trim().slice(0, 50) || 'Electrical Appliance',
      category,
      industryScale: industryScale as any,
      manufacturingLocation: location,
      isForeign,
    });

    onSubmitQuery(effectiveQuery, selectedFile || undefined);
  };

  const handleQuickPromptClick = (item: typeof sampleProductPrompts[0]) => {
    setQuery(item.prompt);
    setProductName(item.product);
    setCategory(item.cat);
    updateProductProfile({
      name: item.product,
      category: item.cat,
      industryScale: industryScale as any,
      manufacturingLocation: location,
      isForeign,
    });
    onSubmitQuery(item.prompt);
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Subtle Blobs */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-bis-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 -mb-12 -ml-12 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Official Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bis-50 border border-bis-200 text-bis-900 text-xs font-extrabold uppercase tracking-wider shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-bis-700" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t('hero.titlePrefix')} <span className="text-bis-800">{t('hero.titleStandards')}</span> {t('hero.titleAnd')} <span className="text-amber-600">{t('hero.titleCert')}</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Primary Interactive Product Profile & Consultation Card */}
        <div className="bg-white rounded-3xl shadow-card border-2 border-slate-200/90 p-4 sm:p-6 transition-all hover:border-bis-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t('hero.inputLabel')}</span>
              </label>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-bold text-bis-700 hover:text-bis-900 flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Hide Product Details' : 'Specify Product Parameters'}</span>
              </button>
            </div>

            {/* Main Text Input Area */}
            <div className="relative rounded-2xl bg-slate-50 border border-slate-300 focus-within:border-bis-700 focus-within:ring-2 focus-within:ring-bis-100 p-3 transition-all">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={isRecording ? t('hero.listening') : t('hero.inputPlaceholder')}
                rows={2}
                disabled={isLoading}
                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm md:text-base text-slate-900 placeholder:text-slate-400 resize-none font-medium custom-scrollbar"
              />

              {/* Selected Attachment Pill */}
              {selectedFile && (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-bis-50 border border-bis-200 text-xs text-bis-900 mb-2 w-fit">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-bis-600" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-bis-600" />
                  )}
                  <span className="font-semibold max-w-[180px] truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-0.5 hover:bg-bis-200 rounded text-bis-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Action Toolbar Inside Box */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-bis-900 hover:bg-slate-200/70 transition-colors"
                    title={t('hero.attachPhoto')}
                  >
                    <Paperclip className="w-4 h-4 text-bis-700" />
                    <span className="hidden sm:inline">{t('hero.attachPhoto')}</span>
                    <span className="sm:hidden">{t('hero.attachShort')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-slate-600 hover:text-bis-900 hover:bg-slate-200/70'
                    }`}
                    title={isRecording ? 'Listening... click to stop' : 'Speak your query'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-bis-700" />}
                    <span className="hidden sm:inline">{isRecording ? t('hero.listening') : t('hero.voiceQuery')}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                    isLoading
                      ? 'bg-blue-800 text-white cursor-wait opacity-90'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-900/20 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>{t('hero.analyzing') || 'Analyzing'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{t('hero.startGuide')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional / Expanded Product Parameter Fields */}
            {showAdvanced && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-bis-700" />
                    <span>{t('hero.productNameLabel')}</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t('hero.productNamePlaceholder')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">{t('hero.categoryLabel')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Food & Agriculture">Food & Agriculture</option>
                    <option value="Civil Engineering">Civil Engineering & Construction</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Chemical">Chemicals & Polymers</option>
                    <option value="Medical Equipment">Medical & Safety Equipment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>{t('hero.scaleLabel')}</span>
                    <span className="text-amber-700 font-bold">50% MSME</span>
                  </label>
                  <select
                    value={industryScale}
                    onChange={(e) => setIndustryScale(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="micro">{t('step1.microScale')}</option>
                    <option value="startup">{t('step1.startupScale')}</option>
                    <option value="small">{t('step1.smallScale')}</option>
                    <option value="medium">{t('step1.mediumScale')}</option>
                    <option value="large">{t('step1.largeScale')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-bis-700" />
                    <span>{t('hero.locationLabel')}</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('hero.locationPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="heroOrigin"
                      checked={!isForeign}
                      onChange={() => setIsForeign(false)}
                      className="text-bis-800"
                    />
                    <span>{t('hero.domesticLabel')}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="heroOrigin"
                      checked={isForeign}
                      onChange={() => setIsForeign(true)}
                      className="text-bis-800"
                    />
                    <span>{t('hero.foreignLabel')}</span>
                  </label>
                </div>
              </div>
            )}
          </form>

          {/* 2-Column Balanced Section: Explore Common Queries (LEFT) & Saved Product Details/Steps (RIGHT) */}
          <div className="mt-6 pt-6 border-t border-slate-200/80 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT SIDE: Explore Common Product Queries */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('hero.samplePrompts') || 'Explore Common Product Queries'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleProductPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPromptClick(item)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-bis-50 border border-slate-200 hover:border-bis-300 text-left transition-all group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-white group-hover:bg-bis-100 transition-colors shrink-0 shadow-2xs">
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-bis-900 truncate">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: Saved Product Details/Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <Bookmark className="w-3.5 h-3.5 text-bis-700" />
                  <span>Saved Product Details / Steps</span>
                </div>
                {savedGuides.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-bis-100 text-bis-900 font-mono">
                    {savedGuides.length} saved
                  </span>
                )}
              </div>

              {savedGuides.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                  {savedGuides.map((guide) => (
                    <div
                      key={guide.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-bis-300 transition-all shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div
                        onClick={() => loadSavedGuide(guide)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-bis-900 truncate">
                            {guide.product_name}
                          </h4>
                          {guide.standard_code && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-bis-100 text-bis-900 rounded shrink-0">
                              {guide.standard_code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-amber-700">
                            Step {guide.active_step || 1} of 6
                          </span>
                          <span>•</span>
                          <span className="truncate">Click to continue roadmap</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadSavedGuide(guide)}
                          className="px-2.5 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                          title="Resume this Product Guide"
                        >
                          <span>Resume</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedGuide(guide.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove saved guide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[155px] p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No Saved Product Guides Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Start a search above and click "Save Progress" inside the guide to resume your certification roadmap anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
