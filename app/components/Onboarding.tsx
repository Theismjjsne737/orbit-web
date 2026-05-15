'use client';

import { useState } from 'react';
import { AI_TOOLS, CATEGORIES, GOALS } from '@/app/data/tools';
import { AiTool, FREE_LIMIT, Goal, OrbitUser, UserSubscription } from '@/app/lib/types';
import { saveData, completeOnboarding } from '@/app/lib/storage';

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
      if (!prices[tool.id]) {
        setPrices(p => ({ ...p, [tool.id]: tool.defaultPrice }));
      }
    }
    setSelectedToolIds(next);
  }

  function addCustomTool() {
    const name = customName.trim();
    if (!name) return;
    const id = `custom_${name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
    const price = parseFloat(customPrice) || 0;
    const tool: AiTool = {
      id,
      name,
      category: 'other',
      defaultPrice: price,
      url: '',
      description: 'Custom subscription',
    };
    setCustomTools(prev => [...prev, tool]);
    setPrices(p => ({ ...p, [id]: price }));
    if (selectedToolIds.size < limit) {
      setSelectedToolIds(prev => new Set([...prev, id]));
    }
    setCustomName('');
    setCustomPrice('');
    setSearch('');
    setAddingCustom(false);
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
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-gradient-violet">Orbit</span>
          <div className="flex gap-2 items-center">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i < stepIndex
                    ? 'w-6 bg-violet-400/60'
                    : s === step
                    ? 'w-8 bg-violet-500'
                    : 'w-6 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">

        {/* Step 1: Goal */}
        {step === 'goal' && (
          <div className="space-y-8">
            <div>
              <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">Step 1 of 3</p>
              <h1 className="text-4xl font-bold tracking-tight text-gradient">What are you trying to do with AI?</h1>
              <p className="mt-3 text-white/40">We'll flag which tools actually match your goal — and which ones are a waste.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id as Goal)}
                  className={`p-5 rounded-2xl text-left transition-all duration-200 ${
                    selectedGoal === goal.id ? 'card-selected' : 'card-glass hover:bg-white/5'
                  }`}
                >
                  <div className="text-2xl mb-3">{goal.emoji}</div>
                  <div className={`font-semibold text-sm ${selectedGoal === goal.id ? 'text-violet-200' : 'text-white/80'}`}>
                    {goal.label}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('tools')}
              disabled={!selectedGoal}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Pick tools */}
        {step === 'tools' && (
          <div className="space-y-6">
            <div>
              <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">Step 2 of 3</p>
              <h1 className="text-4xl font-bold tracking-tight text-gradient">Which AI tools are you paying for?</h1>
              <p className="mt-3 text-white/40">Select everything you're currently subscribed to.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search any AI tool..."
                value={search}
                onChange={e => { setSearch(e.target.value); setAddingCustom(false); }}
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-all"
              />
              {search && (
                <button onClick={() => { setSearch(''); setAddingCustom(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  ✕
                </button>
              )}
            </div>

            {/* Search results */}
            {filteredTools !== null && (
              <div className="space-y-3">
                {filteredTools.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTools.map(tool => {
                      const selected = selectedToolIds.has(tool.id);
                      return (
                        <ToolButton key={tool.id} tool={tool} selected={selected} onToggle={() => toggleTool(tool)} />
                      );
                    })}
                  </div>
                )}

                {/* Add custom tool CTA */}
                {!hasExactMatch && trimmedSearch && (
                  <div>
                    {addingCustom ? (
                      <div className="p-4 rounded-xl card-glass space-y-3">
                        <p className="text-sm font-medium text-white/70">Add "{trimmedSearch}" as a custom tool</p>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-white/30 text-sm">$</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Monthly price"
                              value={customPrice}
                              onChange={e => setCustomPrice(e.target.value)}
                              className="flex-1 bg-transparent text-sm border-b border-white/15 focus:border-violet-500/60 outline-none py-1 text-white placeholder-white/25"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && addCustomTool()}
                            />
                            <span className="text-white/30 text-sm">/mo</span>
                          </div>
                          <button
                            onClick={addCustomTool}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setAddingCustom(false)}
                            className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 card-glass transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setCustomName(trimmedSearch); setAddingCustom(true); }}
                        className="w-full py-3 rounded-xl card-glass text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="text-white/20">+</span>
                        Add "{trimmedSearch}" as custom tool
                      </button>
                    )}
                  </div>
                )}

                {filteredTools.length === 0 && !trimmedSearch && (
                  <p className="text-center py-8 text-white/25 text-sm">No results.</p>
                )}
              </div>
            )}

            {/* Category browsing */}
            {filteredTools === null && categories.map(([catId, catLabel]) => {
              const tools = allTools.filter(t => t.category === catId);
              return (
                <div key={catId}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-3">{catLabel}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map(tool => {
                      const selected = selectedToolIds.has(tool.id);
                      return <ToolButton key={tool.id} tool={tool} selected={selected} onToggle={() => toggleTool(tool)} />;
                    })}
                  </div>
                </div>
              );
            })}

            <div className="h-32" />

            <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#060608] via-[#060608]/95 to-transparent">
              <div className="max-w-2xl mx-auto space-y-3">
                {showUpgradeHint && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
                    <p className="text-violet-300 text-xs font-medium">
                      Free plan tracks up to {FREE_LIMIT} tools
                    </p>
                    <button
                      onClick={onUpgrade}
                      className="text-xs text-violet-400 font-semibold underline underline-offset-2 hover:text-violet-300"
                    >
                      Upgrade →
                    </button>
                  </div>
                )}
                {selectedToolIds.size > 0 && !showUpgradeHint && (
                  <p className="text-center text-white/30 text-xs">
                    {selectedToolIds.size}{limit !== Infinity ? `/${limit}` : ''} tool{selectedToolIds.size !== 1 ? 's' : ''} selected
                  </p>
                )}
                <button
                  onClick={() => setStep('pricing')}
                  disabled={selectedToolIds.size === 0}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500"
                >
                  {selectedToolIds.size === 0 ? 'Select at least one tool' : 'Continue →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm pricing */}
        {step === 'pricing' && (
          <div className="space-y-6">
            <div>
              <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">Step 3 of 3</p>
              <h1 className="text-4xl font-bold tracking-tight text-gradient">Confirm your costs</h1>
              <p className="mt-3 text-white/40">Pre-filled with standard pricing — update anything that's different for your plan.</p>
            </div>

            <div className="space-y-2">
              {selectedTools.map(tool => (
                <div key={tool.id} className="flex items-center justify-between p-4 rounded-xl card-glass">
                  <div>
                    <div className="font-semibold text-sm">{tool.name}</div>
                    <div className="text-xs text-white/30 mt-0.5">{tool.description}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <span className="text-white/30 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={prices[tool.id] ?? tool.defaultPrice}
                      onChange={e => setPrices(p => ({ ...p, [tool.id]: parseFloat(e.target.value) || 0 }))}
                      className="w-16 bg-transparent text-right text-sm font-bold border-b border-white/15 focus:border-violet-500/60 outline-none py-0.5 transition-colors"
                    />
                    <span className="text-white/30 text-sm">/mo</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between py-4 border-t border-white/[0.06]">
              <span className="text-white/40 text-sm">Total monthly spend</span>
              <div>
                <span className="text-3xl font-bold text-gradient">${totalPreview.toFixed(0)}</span>
                <span className="text-white/30 text-sm font-normal">/mo</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500"
            >
              See my Orbit →
            </button>

            <p className="text-center text-white/20 text-xs">
              Your data stays on your device. No account required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({ tool, selected, onToggle }: { tool: AiTool; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`p-3.5 rounded-xl text-left transition-all duration-200 w-full ${
        selected ? 'card-selected' : 'card-glass hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`font-medium text-sm truncate ${selected ? 'text-violet-200' : ''}`}>{tool.name}</span>
        {selected && (
          <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <div className="text-xs text-white/35 mt-0.5">${tool.defaultPrice}/mo</div>
    </button>
  );
}
