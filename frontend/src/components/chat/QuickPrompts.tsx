import React from 'react';
import { Sparkles, HelpCircle, ShieldCheck, Zap, Droplets, Award } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  {
    icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
    label: 'Electrical Safety (IS 302)',
    prompt: 'What are the essential safety and testing requirements under IS 302 for electrical appliances?',
  },
  {
    icon: <Droplets className="w-3.5 h-3.5 text-bis-500" />,
    label: 'Drinking Water (IS 10500)',
    prompt: 'What are the mandatory chemical and microbiological parameters for drinking water under IS 10500?',
  },
  {
    icon: <Award className="w-3.5 h-3.5 text-emerald-500" />,
    label: 'MSME 50% Concession',
    prompt: 'How do Micro Enterprises and DPIIT startups get the 50% concession on BIS application and marking fees?',
  },
  {
    icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />,
    label: 'Scheme-I vs Scheme-II (CRS)',
    prompt: 'Explain the difference between Scheme-I (ISI Mark Certification) and Scheme-II (Compulsory Registration Scheme - CRS).',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200/80">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Suggested Consultation Topics:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-2 p-2.5 rounded-xl bg-white hover:bg-bis-50/60 border border-slate-200 hover:border-bis-300 text-left transition-all group shadow-sm hover:shadow"
          >
            <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-bis-100 transition-colors shrink-0 mt-0.5">
              {item.icon}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-bis-900 transition-colors">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1">
                {item.prompt}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
