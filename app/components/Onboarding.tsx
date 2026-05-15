'use client';

import { useState } from 'react';
import { AI_TOOLS, CATEGORIES, GOALS } from '@/app/data/tools';
import { AiTool, FREE_LIMIT, Goal, OrbitUser, UserSubscription } from '@/app/lib/types';
import { saveData, completeOnboarding } from '@/app/lib/storage';

function OrbitMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <ellipse cx="11" cy="11" rx="9.5" ry="5" stroke="#8b5cf6" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.65"/>
      <circle cx="11" cy="11" r="3.2" fill="#a78bfa"/>
      <circle cx="19.6" cy="7.6" r="1.5" fill="#c4b5fd" opacity="0.9"/>
    </svg>
  );
}

interface Props {
  user: OrbitUser;
  onComplete: () => void;
  onUpgrade?: () => void;
}

type Step = 'goal' | 'tools' | 'pricing';

export default function Onboarding({ user, onComplete, onUpgrade }: Props) {
  const limit = user.plan === 'free' ? FREE_LIMIT : Infinity;

  const [step, setStep] = useState<Step>('goal');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [customTools, setCustomTools] = useState<AiTool[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const allTools = [...AI_TOOLS, ...customTools];

  function toggleTool(tool: AiTool) {
    const next = new Set(selectedToolIds);
    if (next.has(tool.id)) {
      next.delete(tool.id);
      setShowUpgradeHint(false);
    } else {
      if (next.size >= limit) {
        setShowUpgradeHint(true);
        return;
      }
      next.add(tool.id);
      if (!prices[tool.id]) setPrices(p => ({ ...p, [tool.id]: tool.defaultPrice }));
    }
    setSelectedToolIds(next);
  }

  function addCustomTool() {
    const name = customName.trim();
    if (!name) return;
    const id = `custom_${name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
    const price = parseFloat(customPrice) || 0;
    const tool: AiTool = { id, name, category: 'other', defaultPrice: price, url: '', description: 'Custom subscription' };
    setCustomTools(prev => [...prev, tool]);
    setPrices(p => ({ ...p, [id]: price }));
    if (selectedToolIds.size < limit) setSelectedToolIds(prev => new Set([...prev, id]));
    setCustomName(''); setCustomPrice(''); setSearch(''); setAddingCustom(false);
  }

  function handleFinish() {
    const subscriptions: UserSubscription[] = Array.from(selectedToolIds).map(id => ({
      toolId: id,
      monthlyPrice: prices[id] ?? allTools.find(t => t.id === id)?.defaultPrice ?? 0,
      addedAt: new Date().toISOString(),
      lastUsed: null,
    }));
    saveData({ goal: selectedGoal, subscriptions, onboardingComplete: true, user, customTools });
    completeOnboarding();
    onComplete();
  }

  const selectedTools = allTools.filter(t => selectedToolIds.has(t.id));
  const totalPreview = selectedTools.reduce((sum, t) => sum + (prices[t.id] ?? t.defaultPrice), 0);
  const categories = Object.entries(CATEGORIES) as [keyof typeof CATEGORIES, string][];

  const trimmedSearch = search.trim();
  const filteredTools = trimmedSearch
    ? allTools.filter(t => t.name.toLowerCase().includes(trimmedSearch.toLowerCase()))
    : null;
  const hasExactMatch = trimmedSearch
    ? allTools.some(t => t.name.toLowerCase() === trimmedSearch.toLowerCase())
    : false;

  const steps: Step[] = ['goal', 'tools', 'pricing'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-orbit text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <OrbitMark size={18} />
            <span className="text-[15px] font-semibold tracking-tight text-gradient-violet">Orbit</span>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-400 ${
                  i < stepIndex
                    ? 'w-5 h-1 bg-violet-500/50'
                    : s === step
                    ? 'w-7 h-1 bg-violet-500'
                    : 'w-5 h-1 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">

        {/* ── Step 1: Goal ── */}
        {step === 'goal' && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-[0.2em] mb-2">Step 1 of 3</p>
              <h1 className="text-[2.4rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                What are you building<br />with AI?
              </h1>
              <p className="mt-3 text-[14px] text-white/38 leading-relaxed max-w-md">
                We'll surface which tools match your focus — and flag the ones that are a waste.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(goal => {
                const selected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id as Goal)}
                    className={`p-5 rounded-2xl text-left transition-all duration-200 group ${
                      selected ? 'card-selected' : 'card-glass hover:border-white/14'
                    }`}
                  >
                    <div className={`text-[28px] mb-3 transition-transform duration-200 ${!selected ? 'group-hover:scale-110' : ''}`}>
                      {goal.emoji}
                    </div>
                    <div className={`font-semibold text-[14px] leading-snug ${selected ? 'text-violet-200' : 'text-white/75'}`}>
                      {goal.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep('tools')}
              disabled={!selectedGoal}
              className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white btn-glow disabled:opacity-25 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Tools ── */}
        {step === 'tools' && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-[0.2em] mb-2">Step 2 of 3</p>
              <h1 className="text-[2.4rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                Which AI tools are<br />you paying for?
              </h1>
              <p className="mt-3 text-[14px] text-white/38">Select everything you're currently subscribed to.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search any AI tool…"
                value={search}
                onChange={e => { setSearch(e.target.value); setAddingCustom(false); }}
                className="w-full pl-11 pr-10 py-3 rounded-xl input-glass text-[14px] text-white"
              />
              {search && (
                <button onClick={() => { setSearch(''); setAddingCustom(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/55 transition-colors p-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search results */}
            {filteredTools !== null && (
              <div className="space-y-4">
                {filteredTools.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTools.map(tool => (
                      <ToolChip key={tool.id} tool={tool} selected={selectedToolIds.has(tool.id)} onToggle={() => toggleTool(tool)} />
                    ))}
                  </div>
                )}

                {!hasExactMatch && trimmedSearch && (
                  addingCustom ? (
                    <div className="p-4 rounded-xl card-glass space-y-3 animate-scale-in">
                      <p className="text-[13px] font-medium text-white/65">
                        Add <span className="text-white">"{trimmedSearch}"</span> as a custom tool
                      </p>
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1.5 flex-1 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2">
                          <span className="text-white/28 text-[13px]">$</span>
                          <input
                            type="number"
                            min={0}
                            placeholder="Monthly price"
                            value={customPrice}
                            onChange={e => setCustomPrice(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 outline-none"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && addCustomTool()}
                          />
                          <span className="text-white/28 text-[13px]">/mo</span>
                        </div>
                        <button onClick={addCustomTool} className="px-4 py-2 rounded-lg text-[12px] font-semibold btn-glow text-white">
                          Add
                        </button>
                        <button onClick={() => setAddingCustom(false)} className="px-3 py-2 rounded-lg text-[12px] text-white/30 hover:text-white/55 card-glass transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setCustomName(trimmedSearch); setAddingCustom(true); }}
                      className="w-full py-3 rounded-xl card-glass text-[13px] text-white/38 hover:text-white/65 hover:border-white/14 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-white/22 text-lg leading-none">+</span>
                      Add "{trimmedSearch}" as custom tool
                    </button>
                  )
                )}

                {filteredTools.length === 0 && !trimmedSearch && (
                  <p className="text-center py-8 text-white/22 text-[13px]">No results.</p>
                )}
              </div>
            )}

            {/* Category browsing */}
            {filteredTools === null && (
              <div className="space-y-7">
                {categories.map(([catId, catLabel]) => {
                  const tools = allTools.filter(t => t.category === catId);
                  if (!tools.length) return null;
                  return (
                    <div key={catId}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/22">{catLabel}</span>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tools.map(tool => (
                          <ToolChip key={tool.id} tool={tool} selected={selectedToolIds.has(tool.id)} onToggle={() => toggleTool(tool)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-32" />

            {/* Fixed bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-8 bg-gradient-to-t from-[#040407] via-[#040407]/95 to-transparent">
              <div className="max-w-2xl mx-auto space-y-3">
                {showUpgradeHint && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-violet-950/60 border border-violet-500/22 animate-scale-in">
                    <p className="text-violet-300 text-[12px] font-medium">
                      Free plan tracks up to {FREE_LIMIT} tools
                    </p>
                    <button onClick={onUpgrade} className="text-[12px] text-violet-400 font-semibold hover:text-violet-300 underline underline-offset-2 transition-colors">
                      Upgrade →
                    </button>
                  </div>
                )}
                {selectedToolIds.size > 0 && !showUpgradeHint && (
                  <p className="text-center text-white/25 text-[12px]">
                    {selectedToolIds.size}{limit !== Infinity ? `/${limit}` : ''} tool{selectedToolIds.size !== 1 ? 's' : ''} selected
                  </p>
                )}
                <button
                  onClick={() => setStep('pricing')}
                  disabled={selectedToolIds.size === 0}
                  className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white btn-glow disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  {selectedToolIds.size === 0 ? 'Select at least one tool' : `Review ${selectedToolIds.size} tool${selectedToolIds.size !== 1 ? 's' : ''} →`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Pricing ── */}
        {step === 'pricing' && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-[0.2em] mb-2">Step 3 of 3</p>
              <h1 className="text-[2.4rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                Confirm your costs
              </h1>
              <p className="mt-3 text-[14px] text-white/38">Pre-filled with standard pricing — adjust anything that's different.</p>
            </div>

            <div className="space-y-1.5">
              {selectedTools.map(tool => (
                <div key={tool.id} className="flex items-center justify-between p-4 rounded-xl card-glass">
                  <div className="min-w-0">
                    <div className="font-medium text-[14px] text-white/85">{tool.name}</div>
                    <div className="text-[12px] text-white/28 mt-0.5 truncate">{tool.description}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-1.5">
                    <span className="text-white/30 text-[13px]">$</span>
                    <input
                      type="number"
                      min={0}
                      value={prices[tool.id] ?? tool.defaultPrice}
                      onChange={e => setPrices(p => ({ ...p, [tool.id]: parseFloat(e.target.value) || 0 }))}
                      className="w-14 bg-transparent text-right text-[14px] font-bold text-white outline-none"
                    />
                    <span className="text-white/30 text-[13px]">/mo</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-5 border-t border-white/[0.06]">
              <div>
                <p className="text-[12px] text-white/35 uppercase tracking-widest font-medium">Total monthly</p>
              </div>
              <div className="flex items-end gap-1.5 leading-none">
                <span className="text-[44px] font-black tracking-[-0.04em] leading-none text-gradient-hero">
                  ${totalPreview.toFixed(0)}
                </span>
                <span className="text-white/25 text-[16px] font-normal pb-1">/mo</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white btn-glow"
            >
              See my Orbit →
            </button>

            <p className="text-center text-white/20 text-[12px]">
              Your data stays on your device. No account required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolChip({ tool, selected, onToggle }: { tool: AiTool; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`p-3.5 rounded-xl text-left transition-all duration-180 w-full group ${
        selected ? 'card-selected' : 'card-glass hover:border-white/12'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`font-medium text-[13px] truncate leading-snug ${selected ? 'text-violet-200' : 'text-white/75 group-hover:text-white/90'}`}>
          {tool.name}
        </span>
        {selected && (
          <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className={`text-[11px] mt-0.5 ${selected ? 'text-violet-400/55' : 'text-white/28'}`}>
        ${tool.defaultPrice}/mo
      </div>
    </button>
  );
}
