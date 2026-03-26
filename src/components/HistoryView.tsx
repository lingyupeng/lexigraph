import React, { useState } from 'react';
import { LexemeData } from '../types';
import { Search, Plus, Trash2, ChevronRight, Clock, History as HistoryIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { storageService } from '../services/storageService';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
  history: LexemeData[];
  onAddToGraph: (lexeme: LexemeData) => void;
  onItemClick: (lexeme: LexemeData) => void;
}

export default function HistoryView({ history, onAddToGraph, onItemClick }: Props) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [localHistory, setLocalHistory] = useState(history);

  const filtered = localHistory.filter(h => {
    if (!h || !h.lexeme) return false;
    const search = searchTerm.toLowerCase();
    return h.lexeme.toLowerCase().includes(search) ||
      (Array.isArray(h.translation_zh) ? h.translation_zh : []).some(t => t.includes(searchTerm))
  });

  const handleDelete = (lexeme: string) => {
    const updated = localHistory.filter(h => h.lexeme !== lexeme);
    storageService.saveHistory(updated);
    setLocalHistory(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('history.title')}</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all w-64"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div 
              key={item.lexeme}
              onClick={() => onItemClick(item)}
              className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between group hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900">{item.lexeme}</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded uppercase">{item.pos}</span>
                  </div>
                  <p className="text-xs text-stone-400">{(Array.isArray(item.translation_zh) ? item.translation_zh : []).join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToGraph(item);
                  }}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Add to Graph"
                >
                  <Plus size={20} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.lexeme);
                  }}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete from History"
                >
                  <Trash2 size={20} />
                </button>
                <div className="w-px h-4 bg-stone-200 mx-1" />
                <ChevronRight size={20} className="text-stone-300" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mx-auto mb-4">
              <HistoryIcon size={32} />
            </div>
            <p className="text-stone-400 font-medium">{t('history.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
