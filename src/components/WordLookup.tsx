import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Plus, Info, BookOpen, Globe, History, Sparkles, ChevronDown, ChevronUp, Database, AlertCircle } from 'lucide-react';
import { LexemeData } from '../types';
import { analyzeWord } from '../services/aiService';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';
import { ACADEMIC_DICTIONARY } from '../data/dictionary';
import { fetchDictionaryData, fetchSpellSuggestion } from '../services/dictionaryService';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
  domains: string[];
  onAddToGraph: (lexeme: LexemeData) => void;
  onHistoryUpdate: () => void;
  initialWord?: LexemeData | null;
  importedWords?: string[];
  onImportedWordsConsumed?: () => void;
}

interface SpellSuggestion {
  original: string;
  corrected: string;
}

export default function WordLookup({ domains, onAddToGraph, onHistoryUpdate, initialWord, importedWords, onImportedWordsConsumed }: Props) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LexemeData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [spellSuggestion, setSpellSuggestion] = useState<SpellSuggestion | null>(null);
  const [autoCorrected, setAutoCorrected] = useState<{ from: string; to: string } | null>(null);

  // Clear results when user leaves the Explore tab
  React.useEffect(() => {
    const handler = () => {
      setResults([]);
      setExpandedId(null);
    };
    window.addEventListener('lexigraph:clear-explore', handler);
    return () => window.removeEventListener('lexigraph:clear-explore', handler);
  }, []);

  React.useEffect(() => {
    if (initialWord) {
      setResults(prev => {
        const exists = prev.find(r => r.lexeme === initialWord.lexeme);
        if (exists) {
          setExpandedId(initialWord.lexeme);
          return prev;
        }
        setExpandedId(initialWord.lexeme);
        return [initialWord, ...prev];
      });
    }
  }, [initialWord]);

  // Handle imported words from Excel
  React.useEffect(() => {
    if (importedWords && importedWords.length > 0) {
      const wordsText = importedWords.join('\n');
      setInput(wordsText);
      // Trigger search after setting input
      setTimeout(() => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          const event = new Event('change', { bubbles: true });
          Object.defineProperty(event, 'target', { value: textarea });
          textarea.value = wordsText;
        }
      }, 100);
      onImportedWordsConsumed?.();
    }
  }, [importedWords]);

  const getCacheKey = (word: string, domains: string[]) => {
    if (!word || !domains || domains.length === 0) return `lexicache_${word.toLowerCase()}_unknown`;
    const domainKey = [...domains].sort().join('_').toLowerCase();
    return `lexicache_${word.toLowerCase()}_${domainKey}`;
  };

  const handleSearch = async () => {
    if (!input.trim()) return;
    setAutoCorrected(null); // Clear previous correction notification
    setIsLoading(true);
    
    const words = input.split('\n').filter(w => w.trim());
    const primaryDomain = domains[0] || 'General';

    try {
      for (const wordText of words) {
        const word = wordText.trim();
        const cacheKey = getCacheKey(word, domains);
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const data = JSON.parse(cached);
            setResults(prev => {
              const exists = prev.find(r => r.lexeme === data.lexeme);
              if (exists) return prev;
              return [data, ...prev];
            });
            setExpandedId(data.lexeme);
            continue;
          } catch (e) {
            console.error("Failed to parse cached data:", e);
            localStorage.removeItem(cacheKey);
          }
        }

        // Step 1: Check local dictionary for instant feedback
        let baseData = ACADEMIC_DICTIONARY[word.toLowerCase()];
        let correctedWord: string | null = null;
        let wasAutoCorrected = false;

        // Step 2: If not in local dictionary, try external mature dictionary API
        if (!baseData) {
          const extData = await fetchDictionaryData(word);
          if (extData && extData.word) {
            // Check if dictionary returned a different word (potential misspelling)
            const dictWord = extData.word.toLowerCase();
            const inputWord = word.toLowerCase();
            // Only auto-correct if the difference is small (likely typo)
            if (dictWord !== inputWord && dictWord.length > 2 && inputWord.length > 2) {
              const diff = Math.abs(dictWord.length - inputWord.length);
              if (diff <= 2) {
                // Small difference - likely typo, auto-correct
                correctedWord = extData.word;
                wasAutoCorrected = true;
                setAutoCorrected({ from: word, to: extData.word });
              }
            }

            baseData = {
              lexeme: correctedWord || extData.word || word,
              pos: extData.meanings?.[0]?.partOfSpeech || 'unknown',
              ipa: extData.phonetic || extData.phonetics?.find(p => p.text)?.text || '—',
              syllables: [], // API doesn't provide this easily
              translation_zh: [], // API is English-only
              morphology: { prefix: null, roots: [], suffix: [] },
              etymology: { path: [], certainty: 'uncertain' },
              root_family: []
            };
          } else {
            // Dictionary found nothing — try spell check (Datamuse)
            const suggestion = await fetchSpellSuggestion(word);
            if (suggestion) {
              correctedWord = suggestion;
              wasAutoCorrected = true;
              setAutoCorrected({ from: word, to: suggestion });
              // Try dictionary again with corrected word
              const correctedData = await fetchDictionaryData(suggestion);
              if (correctedData && correctedData.word) {
                baseData = {
                  lexeme: correctedData.word,
                  pos: correctedData.meanings?.[0]?.partOfSpeech || 'unknown',
                  ipa: correctedData.phonetic || correctedData.phonetics?.find(p => p.text)?.text || '—',
                  syllables: [],
                  translation_zh: [],
                  morphology: { prefix: null, roots: [], suffix: [] },
                  etymology: { path: [], certainty: 'uncertain' },
                  root_family: []
                };
              }
            }
          }
        }

        let currentData: LexemeData;

        if (baseData) {
          // Show base data immediately
          currentData = {
            ...baseData,
            story: { text: 'Generating story...', is_analogy: false },
            domain_context: [{ domain: primaryDomain, typical_scenes: ['Analyzing...'], examples: ['Generating academic example...'] }],
            collocations: [],
            relevance_score: 50,
            etymological_depth_score: 50,
            suggested_edges: []
          } as LexemeData;
          
          setResults(prev => [currentData, ...prev]);
          setExpandedId(currentData.lexeme);
        }

        // Step 2: Call AI for dynamic content
        try {
          // Use corrected word if available
          const wordToAnalyze = correctedWord || word;
          const aiData = await analyzeWord(wordToAnalyze, domains);

          // Merge or replace
          const finalData = baseData ? { ...baseData, ...aiData } : aiData;

          // Cache it
          const correctedCacheKey = correctedWord ? getCacheKey(correctedWord, domains) : cacheKey;
          localStorage.setItem(correctedCacheKey, JSON.stringify(finalData));

          setResults(prev => {
            const index = prev.findIndex(r => r.lexeme === wordToAnalyze);
            if (index !== -1) {
              const newResults = [...prev];
              newResults[index] = finalData;
              return newResults;
            }
            return [finalData, ...prev];
          });
          
          storageService.addToHistory(finalData);
          if (!expandedId) setExpandedId(finalData.lexeme);
        } catch (err) {
          console.error(`AI Analysis failed for ${word}:`, err);
          if (!baseData) throw err; // Only throw if we have no base data at all
        }
      }
      
      onHistoryUpdate();
      setInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to analyze. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('lookup.title')}</h2>
        <p className="text-stone-500">{t('lookup.subtitle')}</p>
      </header>

      {/* Auto-correction notification */}
      <AnimatePresence>
        {autoCorrected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-blue-600 shrink-0" />
            <p className="text-sm text-blue-700">
              自动纠正: "<span className="font-medium line-through">{autoCorrected.from}</span>" → "<span className="font-medium">{autoCorrected.to}</span>"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 ml-1">{t('lookup.wordsToAnalyze')}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('lookup.placeholder')}
            className="w-full min-h-[100px] p-4 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all resize-none font-mono text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSearch}
            disabled={isLoading || !input.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {t('lookup.analyze')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {results.map((result) => (
            <LexemeCard 
              key={result.lexeme} 
              data={result} 
              isExpanded={expandedId === result.lexeme}
              onToggle={() => setExpandedId(expandedId === result.lexeme ? null : result.lexeme)}
              onAdd={() => onAddToGraph(result)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LexemeCard({ data, isExpanded, onToggle, onAdd }: { data: LexemeData, isExpanded: boolean, onToggle: () => void, onAdd: () => void }) {
  const { t } = useLanguage();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd();
    setIsAdded(true);
  };

  const isFromDictionary = !!ACADEMIC_DICTIONARY[data.lexeme.toLowerCase()];
  const isFromExternal = !isFromDictionary && !!data.ipa && data.ipa !== '—';
  const isPendingAI = isExpanded && (isFromDictionary || isFromExternal) && (!data.story || data.story.text.includes('Generating'));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div 
        className="p-6 cursor-pointer flex items-center justify-between group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl transition-colors",
            isFromDictionary ? "bg-emerald-50 text-emerald-600" : 
            isFromExternal ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
          )}>
            {isFromDictionary ? <Database size={24} /> : 
             isFromExternal ? <BookOpen size={24} /> : (data.lexeme?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-stone-900">{data.lexeme}</h3>
              <span className="text-xs font-medium px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full uppercase">{data.pos}</span>
              {isFromDictionary && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase tracking-tighter">{t('lookup.verifiedBase')}</span>}
              {isFromExternal && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase tracking-tighter">{t('lookup.dictionaryApi')}</span>}
            </div>
            <p className="text-sm text-stone-400 font-mono">{data.ipa} • {(Array.isArray(data.syllables) ? data.syllables : []).join('·') || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAdd}
            disabled={isAdded}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              isAdded 
                ? "bg-emerald-50 text-emerald-600 cursor-default" 
                : "bg-stone-900 text-white hover:bg-stone-800"
            )}
          >
            {isAdded ? t('lookup.added') : <><Plus size={16} /> {t('lookup.addToGraph')}</>}
          </button>
          <div className="text-stone-300 group-hover:text-stone-500 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-stone-100"
          >
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Globe size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-wider">{t('lookup.translationMeaning')}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(data.translation_zh) ? data.translation_zh : []).map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">{t}</span>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <BookOpen size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-wider">{t('lookup.morphologyRoots')}</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-stone-50 rounded-xl">
                        <p className="text-[10px] text-stone-400 uppercase font-bold">{t('lookup.prefix')}</p>
                        <p className="text-xs font-medium text-left">{data.morphology?.prefix || '—'}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-500 uppercase font-bold">{t('lookup.roots')}</p>
                        <div className="flex flex-col gap-2 text-left">
                          {(Array.isArray(data.morphology?.roots) ? data.morphology.roots : []).map((r, i) => (
                            <div key={i} className="text-left">
                              <span className="text-xs font-bold text-emerald-700">{r.text}</span>
                              {r.meaning && (
                                <p className="text-[10px] text-stone-500 leading-relaxed">{r.meaning}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-2 bg-stone-50 rounded-xl">
                        <p className="text-[10px] text-stone-400 uppercase font-bold">{t('lookup.suffix')}</p>
                        <p className="text-xs font-medium text-left">{(Array.isArray(data.morphology?.suffix) ? data.morphology.suffix : []).join(', ') || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-stone-50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-400 uppercase">{t('lookup.etymologyPath')}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                          data.etymology?.certainty === 'high' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {t(`common.${data.etymology?.certainty || 'uncertain'}`)} {t('lookup.certainty')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(Array.isArray(data.etymology?.path) ? data.etymology.path : []).map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-sm font-medium text-stone-500 shrink-0">{i + 1}.</span>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-stone-700">{step}</span>
                              {data.etymology?.explanations?.[i] && (
                                <p className="text-xs text-stone-500 mt-0.5">{data.etymology.explanations[i]}</p>
                              )}
                            </div>
                            {i < (Array.isArray(data.etymology?.path) ? data.etymology.path : []).length - 1 && (
                              <span className="text-stone-300">↓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-stone-400 uppercase">{t('lookup.rootFamily')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(data.root_family) ? data.root_family : []).map((item, i) => (
                          <div key={i} className="flex flex-col p-2 bg-stone-50 rounded-xl border border-stone-100 min-w-[80px]">
                            <span className="text-sm font-bold text-stone-900">#{item.word}</span>
                            <span className="text-[10px] text-stone-500">{item.translation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {localStorage.getItem('lexistories_enabled') === 'true' && (
                  <section className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3 relative overflow-hidden">
                    {isPendingAI && (
                      <div className="absolute inset-0 bg-amber-50/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                          <Loader2 className="animate-spin" size={16} />
                          {t('lookup.aiCrafting')}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-amber-700">
                      <Sparkles size={18} />
                      <h4 className="text-sm font-bold uppercase tracking-wider">{t('lookup.lexiStory')}</h4>
                    </div>
                    <p className="text-stone-700 text-sm leading-relaxed italic">
                      "{data.story?.text || t('nodeDetail.noStory')}"
                    </p>
                    {data.story?.notes && (
                      <div className="flex items-start gap-2 p-3 bg-white/50 rounded-xl text-sm text-amber-700 font-medium border border-amber-200/50">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p>{data.story.notes}</p>
                      </div>
                    )}
                  </section>
                )}
              </div>

              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-pink-600">
                    <History size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-wider">{t('lookup.domainContext')}</h4>
                  </div>
                  
                  { (Array.isArray(data.domain_context) ? data.domain_context : []).map((ctx, i) => (
                    <div key={i} className="space-y-4">
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
                        <p className="text-xs font-bold text-stone-400 uppercase">{ctx.domain}</p>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-stone-400 uppercase">{t('lookup.academicExamples')}</p>
                          {(Array.isArray(ctx.examples) ? ctx.examples : (typeof ctx.examples === 'string' ? [ctx.examples] : [])).map((ex, j) => (
                            <div key={j} className="p-3 bg-white rounded-xl border border-stone-100 text-sm text-stone-800 leading-relaxed font-medium">
                              {ex}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-stone-400">{t('lookup.academicCollocations')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(data.collocations) ? data.collocations : []).map((c, i) => (
                      <span key={i} className="px-3 py-1 border border-stone-200 rounded-full text-xs text-stone-600">{c}</span>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
