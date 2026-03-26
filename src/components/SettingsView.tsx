import React from 'react';
import { UserProfile } from '../types';
import { PRESET_DOMAINS } from '../constants';
import { Check, Trash2, Shield, Database, Info, Key, FileText, Rocket, Users, Globe, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function SettingsView({ profile, onUpdateProfile }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const [customDomain, setCustomDomain] = React.useState('');
  const [isBetaMode, setIsBetaMode] = React.useState(() => {
    return localStorage.getItem('lexigraph_beta_mode') !== 'false';
  });

  const toggleBetaMode = () => {
    const newMode = !isBetaMode;
    setIsBetaMode(newMode);
    localStorage.setItem('lexigraph_beta_mode', String(newMode));
  };

  const toggleDomain = (domain: string) => {
    const current = profile.selectedDomains || [];
    const next = current.includes(domain)
      ? current.filter(d => d !== domain)
      : [...current, domain].slice(0, 5); // Allow up to 5 domains
    
    onUpdateProfile({ ...profile, selectedDomains: next });
  };

  const addCustomDomain = () => {
    if (customDomain && !profile.selectedDomains?.includes(customDomain)) {
      onUpdateProfile({ 
        ...profile, 
        selectedDomains: [...(profile.selectedDomains || []), customDomain].slice(0, 5) 
      });
      setCustomDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    onUpdateProfile({ 
      ...profile, 
      selectedDomains: (profile.selectedDomains || []).filter(d => d !== domain) 
    });
  };

  const clearCache = () => {
    if (confirm('Are you sure you want to clear all cached dictionary results? This will not affect your history or graph.')) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('lexicache_')) {
          localStorage.removeItem(key);
        }
      });
      alert('Cache cleared successfully.');
    }
  };

  const resetAll = () => {
    if (confirm('DANGER: This will delete ALL your history, graph data, and settings. This cannot be undone. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
        <p className="text-stone-500">{t('settings.subtitle')}</p>
      </header>

      {/* Language Toggle */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-stone-900 font-semibold">
          <Globe size={20} className="text-indigo-600" />
          <h3>{t('settings.language')}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-stone-900">{t('settings.language')}</h4>
              <p className="text-sm text-stone-500">{t('settings.languageDesc')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  language === 'en'
                    ? "bg-indigo-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {t('settings.english')}
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  language === 'zh'
                    ? "bg-indigo-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {t('settings.chinese')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Research Domains */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-stone-900 font-semibold">
          <Database size={20} className="text-indigo-600" />
          <h3>{t('settings.researchDomains')}</h3>
        </div>
        <p className="text-sm text-stone-500">{t('settings.researchDomainsDesc')}</p>

        {/* Currently Selected (including custom) - Draggable */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.selectedDomains?.map((domain, index) => (
            <div
              key={domain}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                if (fromIndex !== toIndex && profile.selectedDomains) {
                  const newDomains = [...profile.selectedDomains];
                  const [removed] = newDomains.splice(fromIndex, 1);
                  newDomains.splice(toIndex, 0, removed);
                  onUpdateProfile({ ...profile, selectedDomains: newDomains });
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium cursor-grab active:cursor-grabbing",
                "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 transition-colors",
                index === 0 && "ring-2 ring-indigo-400 ring-offset-1"
              )}
            >
              {index === 0 && <span className="text-xs bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded mr-1">{t('settings.mainDomain')}</span>}
              <span>{domain}</span>
              <button
                onClick={() => removeDomain(domain)}
                className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors ml-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {(!profile.selectedDomains || profile.selectedDomains.length === 0) && (
            <p className="text-xs text-stone-400 italic">No domains selected. Using general academic context.</p>
          )}
        </div>
        <p className="text-xs text-stone-400">{t('settings.researchDomainsDesc')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESET_DOMAINS.map((domain) => {
            const isSelected = profile.selectedDomains?.includes(domain);
            return (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                  isSelected 
                    ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" 
                    : "bg-white border-stone-200 hover:border-stone-300"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-indigo-900" : "text-stone-600"
                )}>
                  {domain}
                </span>
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                  isSelected 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : "border-stone-300 group-hover:border-stone-400"
                )}>
                  {isSelected && <Check size={12} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder={t('settings.addCustomDomain')}
            className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addCustomDomain()}
          />
          <button 
            onClick={addCustomDomain}
            disabled={!customDomain || (profile.selectedDomains?.length || 0) >= 5}
            className="px-6 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {t('settings.add')}
          </button>
        </div>
      </section>

      {/* API Configuration */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-stone-900 font-semibold">
          <Key size={20} className="text-indigo-600" />
          <h3>{t('settings.apiConfig')}</h3>
        </div>

        {/* Beta/Public Mode Toggle */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isBetaMode ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {isBetaMode ? <Rocket size={20} /> : <Users size={20} />}
              </div>
              <div>
                <h4 className="font-medium text-stone-900">
                  {isBetaMode ? t('settings.betaMode') : t('settings.publicMode')}
                </h4>
                <p className="text-sm text-stone-500">
                  {isBetaMode
                    ? t('settings.betaDesc')
                    : t('settings.publicDesc')
                  }
                </p>
              </div>
            </div>
            <button
              onClick={toggleBetaMode}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                isBetaMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              {isBetaMode ? t('settings.switchToPublic') : t('settings.switchToBeta')}
            </button>
          </div>
        </div>

        {isBetaMode ? (
          /* Beta Mode - API Key Hidden */
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-3">
            <div className="flex items-start gap-3">
              <EyeOff size={20} className="text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-indigo-900">{t('settings.apiKeyProtected')}</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  {t('settings.apiKeyProtectedDesc')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Public Mode - Show Configuration Instructions */
          <>
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">{t('settings.configViaEnv')}</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Users need to configure their own API. Edit the <code className="px-1 py-0.5 bg-amber-100 rounded text-xs font-mono">.env</code> file in the project root.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
              <h4 className="font-medium text-stone-900">{t('settings.supportedProviders')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="font-medium text-stone-800">{t('settings.openaiCompatible')}</p>
                  <p className="text-xs text-stone-500 mt-1">{t('settings.openaiDesc')}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="font-medium text-stone-800">{t('settings.minimax')}</p>
                  <p className="text-xs text-stone-500 mt-1">{t('settings.minimaxDesc')}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="font-medium text-stone-800">{t('settings.gemini')}</p>
                  <p className="text-xs text-stone-500 mt-1">{t('settings.geminiDesc')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-3">
              <h4 className="font-medium text-stone-900">{t('settings.exampleEnv')}</h4>
              <pre className="bg-stone-900 text-stone-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`# OpenAI Compatible (recommended)
VITE_OPENAI_API_KEY="your-key"
VITE_OPENAI_API_ENDPOINT="https://api.openai.com/v1"
VITE_OPENAI_MODEL="gpt-4o-nano"`}</pre>
            </div>
          </>
        )}
      </section>

      {/* Data Management */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-stone-900 font-semibold">
          <Shield size={20} className="text-indigo-600" />
          <h3>{t('settings.dataPrivacy')}</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-stone-900">{t('settings.enableLexiStory')}</h4>
              <p className="text-sm text-stone-500">{t('settings.enableLexiStoryDesc')}</p>
            </div>
            <button
              onClick={() => {
                const current = localStorage.getItem('lexistories_enabled') === 'true';
                localStorage.setItem('lexistories_enabled', String(!current));
                onUpdateProfile({ ...profile });
              }}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                localStorage.getItem('lexistories_enabled') === 'true' ? "bg-indigo-600" : "bg-stone-300"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow",
                localStorage.getItem('lexistories_enabled') === 'true' ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-stone-900">{t('settings.clearCache')}</h4>
              <p className="text-sm text-stone-500">{t('settings.clearCacheDesc')}</p>
            </div>
            <button
              onClick={clearCache}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-xl border border-stone-200 transition-colors"
            >
              {t('settings.clearCache')}
            </button>
          </div>

          <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-red-900">{t('settings.resetAll')}</h4>
              <p className="text-sm text-red-600/70">{t('settings.resetAllDesc')}</p>
            </div>
            <button
              onClick={resetAll}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-200"
            >
              {t('settings.resetAll')}
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="pt-8 border-t border-stone-200">
        <div className="flex items-start gap-4 p-6 bg-stone-50 rounded-3xl text-stone-600">
          <Info size={20} className="mt-1 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm leading-relaxed">
              {t('settings.aboutDesc')}
            </p>
            <p className="text-xs text-stone-400">{t('settings.version')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
