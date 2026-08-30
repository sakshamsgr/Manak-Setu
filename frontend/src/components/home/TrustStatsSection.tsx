import React from 'react';
import { BookOpen, ShieldCheck, Award, Building, CheckCircle2 } from 'lucide-react';

export const TrustStatsSection: React.FC = () => {
  const stats = [
    {
      value: '22,000+',
      label: 'Indian Standards (IS)',
      subtext: 'Published across 15 Division Councils',
      icon: <BookOpen className="w-5 h-5 text-bis-700" />,
    },
    {
      value: '40,000+',
      label: 'Active ISI Licences',
      subtext: 'Across Indian & foreign factories',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      value: '500+',
      label: 'Mandatory QCO Products',
      subtext: 'Notified by Government Gazette',
      icon: <Award className="w-5 h-5 text-amber-500" />,
    },
    {
      value: '1,000+',
      label: 'Testing Laboratories',
      subtext: 'Apex Central & LIMS recognized',
      icon: <Building className="w-5 h-5 text-purple-600" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          India's National Quality & Standardization Infrastructure
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Empowering Indian manufacturing, protecting consumer safety, and facilitating Ease of Doing Business under the BIS Act 2016.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">{item.icon}</div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-60" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {item.value}
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-800">{item.label}</div>
            <p className="text-[11px] text-slate-500 leading-tight">{item.subtext}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
