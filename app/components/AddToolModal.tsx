'use client';

import { useEffect, useState } from 'react';
import { AiTool, FREE_LIMIT, OrbitData, OrbitUser, UserSubscription } from '@/app/lib/types';
import { CATEGORIES } from '@/app/data/tools';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  coding: 'Coding',
  writing: 'Writing',
  image: 'Image',
  research: 'Research',
  video: 'Video',
  productivity: 'Productivity',
  other: 'Other',
};

interface Props {
  data: OrbitData;
  user: OrbitUser;
  allTools: AiTool[];
  onAdd: (sub: UserSubscription) => void;
  onClose: () => void;
}

export default function AddToolModal({ data, user, allTools, onAdd, onClose }: Props) {
  const isPro = user.plan === 'pro';
  const atLimit = !isPro && data.subscriptions.length >= FREE_LIMIT;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<AiTool | null>(null);
  const [price, setPrice] = useState('');
  const [renewalDate, setRenewalDate] = useState('');

  const existingIds = new Set(data.subscriptions.map(s => s.toolId));
  const availableTools = allTools.filter(t => !existingIds.has(t.id));

  const filtered = availableTools.filter(t => {
    const matchesSearch = search.trim() === '' || t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Object.entries(CATEGORIES) as [string, string][];

  function handleSelect(tool: AiTool) {
    setSelectedTool(tool);
    setPrice(String(tool.defaultPrice));
  }

  function handleAdd() {
    if (!selectedTool) return;
    const parsedPrice = parseFloat(price);
    const sub: UserSubscription = {
      toolId: selectedTool.id,
      monthlyPrice: isNaN(parsedPrice) ? selectedTool.defaultPrice : parsedPrice,
      addedAt: new Date().toISOString(),
      lastUsed: null,
      renewsOn: renewalDate ? renewalDate + 'T00:00:00' : null,
    };
    onAdd(sub);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl card-glass p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="font-bold text-[16px] text-white/90">Add Subscription</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {atLimit ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-white/60 text-[14px] font-medium mb-1">Free plan limit reached</p>
            <p className="text-white/30 text-[13px]">Upgrade to Pro to add more tools</p>
          </div>
        ) : (
          <>
            <div className="relative mb-3 shrink-0">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tools…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl input-glass text-[13px] text-white"
                autoFocus
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
              {[['all', 'All'], ...categories].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    activeCategory === id
                      ? 'bg-violet-600/25 border border-violet-500/40 text-violet-300'
                      : 'bg-white/[0.04] border border-white/8 text-white/38 hover:text-white/60'
                  }`}
                >
                  {CATEGORY_LABELS[id] ?? label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-1 min-h-0">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-white/25 text-[13px]">No tools found</p>
              ) : (
                filtered.map(tool => {
                  const isSelected = selectedTool?.id === tool.id;
                  return (
                    <button
                      type="button"
                      key={tool.id}
                      onClick={() => handleSelect(tool)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-violet-600/15 border border-violet-500/30'
                          : 'hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[13px] font-bold text-violet-300">{tool.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-[13px] ${isSelected ? 'text-violet-200' : 'text-white/80'}`}>{tool.name}</div>
                        <div className="text-[11px] text-white/28 truncate">{tool.description}</div>
                      </div>
                      <span className="text-[12px] text-white/35 shrink-0">${tool.defaultPrice}/mo</span>
                    </button>
                  );
                })
              )}
            </div>

            {selectedTool && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 shrink-0">
                <p className="text-[12px] text-white/40 font-medium">{selectedTool.name}</p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-white/30 text-[13px]">$</span>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-16 bg-transparent text-[14px] font-bold text-white outline-none"
                    />
                    <span className="text-white/30 text-[13px]">/mo</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-[11px] text-white/30 shrink-0">Renewal</span>
                    <input
                      type="date"
                      value={renewalDate}
                      onChange={e => setRenewalDate(e.target.value)}
                      className="flex-1 bg-transparent text-[12px] text-white/60 outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full py-3 rounded-xl text-[13px] font-semibold btn-glow text-white"
                >
                  Add {selectedTool.name}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
