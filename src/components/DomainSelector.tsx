import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Plus, ArrowRight } from 'lucide-react';
import { PRESET_DOMAINS } from '../constants';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
  onComplete: (domains: string[]) => void;
}

export default function DomainSelector({ onComplete }: Props) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string[]>([]);
  const [customDomain, setCustomDomain] = useState('');

  const toggleDomain = (domain: string) => {
    if (selected.includes(domain)) {
      setSelected(selected.filter(d => d !== domain));
    } else if (selected.length < 5) {
      setSelected([...selected, domain]);
    }
  };

  const handleAddCustom = () => {
    if (customDomain && !selected.includes(customDomain) && selected.length < 5) {
      setSelected([...selected, customDomain]);
      setCustomDomain('');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 md:p-12"
      >
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200">
            <Plus size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-3">{t('onboarding.welcome')}</h2>
          <p className="text-stone-500 max-w-md mx-auto">
            {t('onboarding.selectDomains')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {PRESET_DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => toggleDomain(domain)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 group",
                selected.includes(domain)
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-600/10"
                  : "bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
              )}
            >
              <div className={cn(
                "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                selected.includes(domain)
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-stone-300 bg-white group-hover:border-stone-400"
              )}>
                {selected.includes(domain) && <Check size={12} />}
              </div>
              <span className="text-sm font-medium leading-tight">{domain}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-10">
          <input 
            type="text" 
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder={t('onboarding.addCustomDomain')}
            className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          />
          <button 
            onClick={handleAddCustom}
            disabled={!customDomain || selected.length >= 3}
            className="px-6 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('onboarding.add')}
          </button>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-stone-100">
          <p className="text-sm text-stone-400">
            {selected.length} {t('onboarding.of5Selected')}
          </p>
          <button
            onClick={() => onComplete(selected)}
            disabled={selected.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            {t('onboarding.startExploring')} <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
