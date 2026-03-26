import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Network,
  History as HistoryIcon,
  Settings,
  BookOpen,
  ChevronRight,
  Plus,
  Loader2,
  X,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { UserProfile, LexemeData, KnowledgeGraph } from './types';
import { storageService } from './services/storageService';
import { cn } from './lib/utils';
import DomainSelector from './components/DomainSelector';
import WordLookup from './components/WordLookup';
import GraphView from './components/GraphView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import * as XLSX from 'xlsx';
import { useLanguage } from './hooks/useLanguage';

type View = 'lookup' | 'graph' | 'history' | 'settings';

export default function App() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(storageService.getProfile());
  const [currentView, setCurrentView] = useState<View>('lookup');
  const [selectedWord, setSelectedWord] = useState<LexemeData | null>(null);
  const [graph, setGraph] = useState<KnowledgeGraph>(storageService.getGraph());
  const [history, setHistory] = useState<LexemeData[]>(storageService.getHistory());
  const [importedWords, setImportedWords] = useState<string[]>([]);

  useEffect(() => {
    storageService.saveProfile(profile);
  }, [profile]);

  if (!profile.hasCompletedOnboarding) {
    return (
      <DomainSelector 
        onComplete={(domains) => {
          const newProfile = { selectedDomains: domains, hasCompletedOnboarding: true };
          setProfile(newProfile);
          storageService.saveProfile(newProfile);
        }} 
      />
    );
  }

  const handleAddToGraph = (lexeme: LexemeData) => {
    storageService.addToGraph(lexeme);
    setGraph(storageService.getGraph());
  };

  const handleHistoryItemClick = (lexeme: LexemeData) => {
    setSelectedWord(lexeme);
    setCurrentView('lookup');
  };

  const handleExport = () => {
    const data = JSON.stringify(graph, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexigraph_export.json';
    a.click();
  };

  const handleExportExcel = () => {
    // Prepare data from graph nodes
    const exportData = graph.nodes
      .filter(n => n.type === 'lexeme')
      .map(node => {
        const data = node.data as LexemeData;
        return {
          'Word': node.name,
          'Part of Speech': data?.pos || '',
          'IPA': data?.ipa || '',
          'Translation (Chinese)': (data?.translation_zh || []).join(', '),
          'Prefix': data?.morphology?.prefix || '',
          'Roots': (data?.morphology?.roots || []).map(r => `${r.text} (${r.meaning})`).join(', '),
          'Suffix': (data?.morphology?.suffix || []).join(', '),
          'Etymology Path': (data?.etymology?.path || []).join(' > '),
          'Etymology Explanations': (data?.etymology?.explanations || []).join('; '),
          'Story': data?.story?.text || '',
          'Story Notes': data?.story?.notes || '',
          'Domain Context': (data?.domain_context || []).map(d => d.domain).join(', '),
          'Academic Examples': (data?.domain_context || []).flatMap(d => d.examples || []).join(' | '),
          'Collocations': (data?.collocations || []).join(', '),
          'Root Family': (data?.root_family || []).map(r => `${r.word} (${r.translation})`).join(', '),
          'Relevance Score': typeof data?.relevance_score === 'string' ? data.relevance_score : `${data?.relevance_score || 0}%`,
          'Etymology Depth Score': typeof data?.etymological_depth_score === 'string' ? data.etymological_depth_score : `${data?.etymological_depth_score || 0}%`,
        };
      });

    if (exportData.length === 0) {
      alert('No words in graph to export');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LexiGraph Words');
    XLSX.writeFile(wb, 'lexigraph_vocabulary.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>, onImport: (words: string[]) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Get headers and find the Word column
        const headers = jsonData[0] || [];
        const wordIndex = headers.findIndex(h =>
          h === 'Word' || h === 'word' || h === '词汇' || h === '单词'
        );

        if (wordIndex === -1) {
          // If no header, assume first column contains words
          const words = jsonData.map(row => row[0]).filter(Boolean);
          onImport(words);
        } else {
          // Extract words from the Word column
          const words = jsonData.slice(1).map(row => row[wordIndex]).filter(Boolean);
          onImport(words);
        }

        alert('Words imported! Go to Lookup to analyze them.');
      } catch (err) {
        alert('Failed to read Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex h-screen bg-[#fafaf9] text-[#1c1917] font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <nav className="w-20 md:w-64 border-r border-stone-200 bg-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Network size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight hidden md:block">LexiGraph</h1>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-1">
          <NavItem 
            active={currentView === 'lookup'} 
            onClick={() => {
              setCurrentView('lookup');
              setSelectedWord(null);
            }}
            icon={<Search size={20} />}
            label={t('nav.explore')}
          />
          <NavItem
            active={currentView === 'graph'}
            onClick={() => {
              if (currentView === 'lookup') window.dispatchEvent(new Event('lexigraph:clear-explore'));
              setCurrentView('graph');
            }}
            icon={<Network size={20} />}
            label={t('nav.graph')}
          />
          <NavItem
            active={currentView === 'history'}
            onClick={() => {
              if (currentView === 'lookup') window.dispatchEvent(new Event('lexigraph:clear-explore'));
              setCurrentView('history');
            }}
            icon={<HistoryIcon size={20} />}
            label={t('nav.history')}
          />
        </div>

        <div className="px-3 py-4 border-t border-stone-100">
          <button
            onClick={() => {
              if (currentView === 'lookup') window.dispatchEvent(new Event('lexigraph:clear-explore'));
              setCurrentView('settings');
            }}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group text-left",
              currentView === 'settings' ? "bg-indigo-50 text-indigo-700" : "hover:bg-stone-50 text-stone-500"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              currentView === 'settings' ? "bg-indigo-100 text-indigo-600" : "bg-stone-100 text-stone-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
            )}>
              <Settings size={18} />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{t('nav.settings')}</p>
              <p className="text-xs text-stone-400">{t('settings.languageDesc')}</p>
            </div>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* WordLookup always mounted so results persist across tab switches */}
        <div className={cn("h-full overflow-y-auto p-8", currentView !== 'lookup' && 'hidden')}>
          <WordLookup
            key={(profile.selectedDomains || []).sort().join('_') || 'default'}
            domains={profile.selectedDomains}
            onAddToGraph={handleAddToGraph}
            onHistoryUpdate={() => setHistory(storageService.getHistory())}
            initialWord={selectedWord}
            importedWords={importedWords}
            onImportedWordsConsumed={() => setImportedWords([])}
          />
        </div>

        <AnimatePresence mode="wait">
          {currentView === 'graph' && (
            <motion.div
              key="graph"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full relative"
            >
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
                >
                  <Download size={16} /> JSON
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm cursor-pointer">
                  <Upload size={16} /> Import
                  <input type="file" className="hidden" onChange={(e) => handleImportExcel(e, (words) => {
                    setImportedWords(words);
                    setCurrentView('lookup');
                  })} accept=".xlsx,.xls,.csv" />
                </label>
                <button
                  onClick={() => {
                    if (confirm('Delete all words from graph?')) {
                      storageService.saveGraph({ nodes: [], links: [] });
                      setGraph({ nodes: [], links: [] });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                >
                  <X size={16} /> {t('graph.clearAll')}
                </button>
              </div>
              <GraphView
                graph={graph}
                primaryDomain={profile.selectedDomains?.[0] || 'My Research'}
                onDeleteNode={(nodeId) => {
                  const newGraph = {
                    nodes: graph.nodes.filter(n => n.id !== nodeId),
                    links: graph.links.filter(l => {
                      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                      return sId !== nodeId && tId !== nodeId;
                    })
                  };
                  storageService.saveGraph(newGraph);
                  setGraph(newGraph);
                }}
                onViewWord={(lexemeData: LexemeData) => {
                  setSelectedWord(lexemeData);
                  setCurrentView('lookup');
                }}
              />
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-8"
            >
              <HistoryView 
                history={history} 
                onAddToGraph={handleAddToGraph}
                onItemClick={handleHistoryItemClick}
              />
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-8"
            >
              <SettingsView 
                profile={profile} 
                onUpdateProfile={setProfile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-indigo-50 text-indigo-700 font-medium" 
          : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
      )}
    >
      <div className={cn(
        "transition-colors",
        active ? "text-indigo-600" : "text-stone-400 group-hover:text-stone-600"
      )}>
        {icon}
      </div>
      <span className="hidden md:block text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 hidden md:block" />}
    </button>
  );
}
