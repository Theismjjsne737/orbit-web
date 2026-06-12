'use client';

import { useState } from 'react';
import { AI_TOOLS, CATEGORIES, GOALS, TRIAL_TOOLS, UserRole, AiLevel, UserNeed, getSuggestedToolIds } from '@/app/data/tools';
import { AiTool, FREE_LIMIT, Goal, OrbitUser, UserSubscription } from '@/app/lib/types';
import { saveData, completeOnboarding } from '@/app/lib/storage';
import { OrbitWordmark } from '@/app/components/OrbitLogo';
import AnimatedBackground from '@/app/components/AnimatedBackground';

interface Props {
  user: OrbitUser;
  onComplete: () => void;
  onUpgrade?: () => void;
}

type Step = 'entry-mode' | 'goal' | 'tools' | 'profile' | 'pricing';

export default function Onboarding({ user, onComplete, onUpgrade }: Props) {
  const limit = user.plan === 'free' ? FREE_LIMIT : Infinity;

  const [step, setStep] = useState<Step>('entry-mode');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [renewalDates, setRenewalDates] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [customTools, setCustomTools] = useState<AiTool[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customErrors, setCustomErrors] = useState<{ price?: string; url?: string }>({});

  // Profile step state
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<AiLevel | null>(null);
  const [selectedNeeds, setSelectedNeeds] = useState<Set<UserNeed>>(new Set());

  const allTools = [...AI_TOOLS, ...customTools];

  function toggleTool(tool: AiTool) {
    const next = new Set(selectedToolIds);
    if (next.has(tool.id)) {
      next.delete(tool.id);
      setShowUpgradeHint(false);
    } else {
      if (next.size >= limit) { setShowUpgradeHint(true); return; }
      next.add(tool.id);
      if (!prices[tool.id]) setPrices(p => ({ ...p, [tool.id]: tool.defaultPrice }));
    }
    setSelectedToolIds(next);
  }

  function addCustomTool() {
    const name = customName.trim();
    if (!name) return;
    const parsedPrice = parseFloat(customPrice);
    const url = customUrl.trim();
    const errors: { price?: string; url?: string } = {};
    if (isNaN(parsedPrice) || parsedPrice < 0) errors.price = 'Enter a valid price (0 or more)';
    if (url && !url.startsWith('https://')) errors.url = 'URL must start with https://';
    if (Object.keys(errors).length > 0) { setCustomErrors(errors); return; }
    setCustomErrors({});
    const price = parsedPrice || 0;
    const id = `custom_${name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
    const tool: AiTool = { id, name, category: 'other', defaultPrice: price, url: url || '', description: 'Custom subscription' };
    setCustomTools(prev => [...prev, tool]);
    setPrices(p => ({ ...p, [id]: price }));
    if (selectedToolIds.size < limit) setSelectedToolIds(prev => new Set([...prev, id]));
    setCustomName(''); setCustomPrice(''); setCustomUrl(''); setSearch(''); setAddingCustom(false);
  }

  const [saveError, setSaveError] = useState('');

  function handleFinish() {
    const subscriptions: UserSubscription[] = Array.from(selectedToolIds).map(id => {
      const rawDate = renewalDates[id];
      return {
        toolId: id,
        monthlyPrice: prices[id] ?? allTools.find(t => t.id === id)?.defaultPrice ?? 0,
        addedAt: new Date().toISOString(),
        lastUsed: null,
        // Append local-time suffix so date inputs aren't parsed as UTC midnight
        renewsOn: rawDate ? rawDate + 'T00:00:00' : null,
      };
    });
    try {
      saveData({ goal: selectedGoal, subscriptions, onboardingComplete: true, user, customTools });
      completeOnboarding();
      onComplete();
    } catch {
      setSaveError('Failed to save your data. Storage may be full or unavailable.');
    }
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

  const steps: Step[] = ['goal', 'tools', 'profile', 'pricing'];
  const stepIndex = steps.indexOf(step); // -1 when on entry-mode (progress dots hidden)

  const GOAL_DESCRIPTIONS: Record<string, string> = {
    'learn-to-code': 'Build real projects with AI pair programming',
    'build-a-product': 'Ship faster with AI throughout your stack',
    'get-promoted': 'Stand out with AI-powered productivity',
    'automate-work': 'Eliminate repetitive tasks with smart workflows',
    'creative-projects': 'Expand your creative output with AI tools',
    'just-exploring': 'Discover what AI can do for you',
  };

  return (
    <div className="relative min-h-screen text-white flex flex-col">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <OrbitWordmark size="md" />
          {/* Progress dots — hidden on entry-mode pre-step */}
          {step !== 'entry-mode' && (
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={`rounded-full transition-all duration-400 ${
                    i < stepIndex ? 'w-5 h-1 bg-violet-500/55' :
                    s === step   ? 'w-7 h-1 bg-violet-500' :
                    'w-5 h-1 bg-white/10'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 flex-1 px-6 py-10 max-w-2xl mx-auto w-full">

        {/* ── Entry mode: bank vs manual ── */}
        {step === 'entry-mode' && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <h1 className="text-[2.5rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                How would you like<br />to track subscriptions?
              </h1>
              <p className="mt-3 text-[14px] text-white/38 leading-relaxed max-w-md">
                Connect your bank to auto-detect AI charges, or add your tools manually.
              </p>
            </div>

            <div className="space-y-3">
              {/* Bank connection — Coming Soon */}
              <div className="relative p-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/8 flex items-center justify-center shrink-0 text-[22px]">
                    🏦
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[15px] text-white/70">Connect Bank</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 font-semibold uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[13px] text-white/28 leading-relaxed">
                      Automatically detect all AI subscriptions in your bank statements. No manual entry needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual entry — active */}
              <button
                type="button"
                onClick={() => setStep('goal')}
                className="w-full p-5 rounded-2xl card-glass hover:border-white/14 text-left transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/25 flex items-center justify-center shrink-0 text-[22px] group-hover:bg-violet-600/28 transition-colors">
                    ✏️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[15px] text-white/85 group-hover:text-white transition-colors">Add Manually</span>
                      <span className="text-white/28 group-hover:text-white/55 transition-colors text-[18px]">→</span>
                    </div>
                    <p className="text-[13px] text-white/38 leading-relaxed">
                      Choose from 100+ AI tools and set your own prices. Takes about 2 minutes.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center text-white/20 text-[12px]">
              Your data stays on your device. No account required.
            </p>
          </div>
        )}

        {/* ── Step 1: Goal ── */}
        {step === 'goal' && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-[0.2em] mb-2">Step 1 of 3</p>
              <h1 className="text-[2.5rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                What are you building<br />with AI?
              </h1>
              <p className="mt-3 text-[14px] text-white/38 leading-relaxed max-w-md">
                We'll surface which tools match your focus — and flag the ones wasting your money.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(goal => {
                const selected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id as Goal)}
                    className={`relative p-5 rounded-2xl text-left transition-all duration-200 group ${
                      selected ? 'card-selected' : 'card-glass hover:border-white/14'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`text-[28px] mb-3 transition-transform duration-200 ${!selected ? 'group-hover:scale-110' : ''}`}>
                      {goal.emoji}
                    </div>
                    <div className={`font-semibold text-[14px] leading-snug ${selected ? 'text-violet-200' : 'text-white/75'}`}>
                      {goal.label}
                    </div>
                    <div className={`text-[11px] mt-1 leading-relaxed ${selected ? 'text-violet-400/60' : 'text-white/28'}`}>
                      {GOAL_DESCRIPTIONS[goal.id] ?? ''}
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
              <h1 className="text-[2.5rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
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
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <div className={`flex items-center gap-1.5 flex-1 bg-white/[0.03] rounded-lg px-3 py-2 border ${customErrors.price ? 'border-red-500/50' : 'border-white/8'}`}>
                            <span className="text-white/28 text-[13px]">$</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={customPrice}
                              onChange={e => { setCustomPrice(e.target.value); setCustomErrors(prev => ({ ...prev, price: undefined })); }}
                              className="flex-1 bg-transparent text-[13px] text-white placeholder-white/25 outline-none"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && addCustomTool()}
                            />
                            <span className="text-white/28 text-[13px]">/mo</span>
                          </div>
                          <button type="button" onClick={addCustomTool} className="px-4 py-2 rounded-lg text-[12px] font-semibold btn-glow text-white">Add</button>
                          <button type="button" onClick={() => { setAddingCustom(false); setCustomErrors({}); }} className="px-3 py-2 rounded-lg text-[12px] text-white/30 hover:text-white/55 card-glass transition-all">Cancel</button>
                        </div>
                        {customErrors.price && <p className="text-red-400 text-[11px] px-1">{customErrors.price}</p>}
                        <div className={`flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border ${customErrors.url ? 'border-red-500/50' : 'border-white/8'}`}>
                          <span className="text-white/28 text-[11px] shrink-0">URL</span>
                          <input
                            type="text"
                            placeholder="https://example.com (optional)"
                            value={customUrl}
                            onChange={e => { setCustomUrl(e.target.value); setCustomErrors(prev => ({ ...prev, url: undefined })); }}
                            className="flex-1 bg-transparent text-[12px] text-white placeholder-white/20 outline-none"
                          />
                        </div>
                        {customErrors.url && <p className="text-red-400 text-[11px] px-1">{customErrors.url}</p>}
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
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-8 bg-gradient-to-t from-[#040407] via-[#040407]/95 to-transparent z-20">
              <div className="max-w-2xl mx-auto space-y-3">
                {showUpgradeHint && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-violet-950/60 border border-violet-500/22 animate-scale-in">
                    <p className="text-violet-300 text-[12px] font-medium">Free plan tracks up to {FREE_LIMIT} tools</p>
                    <button onClick={onUpgrade} className="text-[12px] text-violet-400 font-semibold hover:text-violet-300 underline underline-offset-2 transition-colors">
                      Upgrade →
                    </button>
                  </div>
                )}
                {selectedToolIds.size > 0 && !showUpgradeHint && (
                  <p className="text-center text-white/25 text-[12px]">
                    {selectedToolIds.size}{limit !== Infinity ? `/${limit}` : ''} tool{selectedToolIds.size !== 1 ? 's' : ''} selected
                    {totalPreview > 0 && <span className="text-violet-400/70"> · ${totalPreview.toFixed(0)}/mo</span>}
                  </p>
                )}
                <button
                  onClick={() => setStep('profile')}
                  disabled={selectedToolIds.size === 0}
                  className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white btn-glow disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  {selectedToolIds.size === 0 ? 'Select at least one tool' : `Continue →`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Profile ── */}
        {step === 'profile' && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-[0.2em] mb-2">Step 3 of 4</p>
              <h1 className="text-[2.5rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                Tell us about<br />yourself
              </h1>
              <p className="mt-3 text-[14px] text-white/38 leading-relaxed max-w-md">
                We'll personalize your recommendations and flag tools you might be missing.
              </p>
            </div>

            {/* Role */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">I work as a…</p>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'developer',    label: 'Developer',    emoji: '💻' },
                    { id: 'marketer',     label: 'Marketer',     emoji: '📣' },
                    { id: 'writer',       label: 'Writer',       emoji: '✍️' },
                    { id: 'student',      label: 'Student',      emoji: '🎓' },
                    { id: 'entrepreneur', label: 'Founder',      emoji: '🚀' },
                    { id: 'researcher',   label: 'Researcher',   emoji: '🔬' },
                    { id: 'creative',     label: 'Creative',     emoji: '🎨' },
                    { id: 'manager',      label: 'Manager',      emoji: '📋' },
                  ] as { id: UserRole; label: string; emoji: string }[]
                ).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-3 rounded-xl text-center transition-all duration-200 group ${
                      selectedRole === r.id ? 'card-selected' : 'card-glass hover:border-white/14'
                    }`}
                  >
                    <div className={`text-[20px] mb-1 transition-transform duration-200 ${selectedRole !== r.id ? 'group-hover:scale-110' : ''}`}>{r.emoji}</div>
                    <div className={`text-[11px] font-medium leading-tight ${selectedRole === r.id ? 'text-violet-200' : 'text-white/55'}`}>{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Level */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">My AI experience</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'beginner',     label: 'Just starting',  desc: 'New to AI tools' },
                    { id: 'intermediate', label: 'Getting serious', desc: 'Using a few tools' },
                    { id: 'power',        label: 'Power user',      desc: 'Deep in the stack' },
                  ] as { id: AiLevel; label: string; desc: string }[]
                ).map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLevel(l.id)}
                    className={`p-3.5 rounded-xl text-left transition-all duration-200 ${
                      selectedLevel === l.id ? 'card-selected' : 'card-glass hover:border-white/14'
                    }`}
                  >
                    <div className={`text-[13px] font-semibold leading-snug ${selectedLevel === l.id ? 'text-violet-200' : 'text-white/70'}`}>{l.label}</div>
                    <div className={`text-[11px] mt-0.5 ${selectedLevel === l.id ? 'text-violet-400/55' : 'text-white/28'}`}>{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Needs */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">I mainly use AI to… <span className="normal-case text-white/20">(pick all that apply)</span></p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'code',     label: 'Write code',     emoji: '⚡' },
                    { id: 'write',    label: 'Write content',  emoji: '📝' },
                    { id: 'research', label: 'Do research',    emoji: '🔍' },
                    { id: 'visuals',  label: 'Make visuals',   emoji: '🖼️' },
                    { id: 'tasks',    label: 'Automate tasks', emoji: '⚙️' },
                    { id: 'video',    label: 'Create video',   emoji: '🎬' },
                  ] as { id: UserNeed; label: string; emoji: string }[]
                ).map(n => {
                  const active = selectedNeeds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        const next = new Set(selectedNeeds);
                        if (active) next.delete(n.id); else next.add(n.id);
                        setSelectedNeeds(next);
                      }}
                      className={`p-3 rounded-xl text-left transition-all duration-200 group ${
                        active ? 'card-selected' : 'card-glass hover:border-white/14'
                      }`}
                    >
                      <div className={`text-[18px] mb-1 transition-transform duration-200 ${!active ? 'group-hover:scale-110' : ''}`}>{n.emoji}</div>
                      <div className={`text-[12px] font-medium ${active ? 'text-violet-200' : 'text-white/55'}`}>{n.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggestions panel */}
            {(selectedRole || selectedLevel || selectedNeeds.size > 0) && (() => {
              const suggested = getSuggestedToolIds(selectedRole, selectedLevel, Array.from(selectedNeeds));
              const missing = suggested.filter(id => !selectedToolIds.has(id));
              const available = missing.map(id => allTools.find(t => t.id === id)).filter(Boolean) as typeof allTools;
              if (available.length === 0) return null;
              return (
                <div className="p-4 rounded-2xl border border-violet-500/20 bg-violet-950/30 space-y-3 animate-scale-in">
                  <p className="text-[12px] font-semibold text-violet-300/80">Tools you might be missing</p>
                  <div className="flex flex-wrap gap-2">
                    {available.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/8 hover:border-violet-500/35 hover:bg-violet-500/10 transition-all text-[12px] text-white/60 hover:text-white/85"
                      >
                        <span className="text-violet-400/70">+</span>
                        {tool.name}
                        <span className="text-white/25">${tool.defaultPrice}/mo</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setStep('pricing')}
              className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white btn-glow"
            >
              {(selectedRole || selectedLevel || selectedNeeds.size > 0) ? 'Review costs →' : 'Skip for now →'}
            </button>
          </div>
        )}

        {/* ── Step 4: Pricing ── */}
        {step === 'pricing' && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-[0.2em] mb-2">Step 3 of 3</p>
              <h1 className="text-[2.5rem] font-black tracking-[-0.03em] leading-[1.06] text-gradient">
                Confirm your costs
              </h1>
              <p className="mt-3 text-[14px] text-white/38">Pre-filled with standard pricing — adjust anything that's different.</p>
            </div>

            <div className="space-y-1.5">
              {selectedTools.map(tool => (
                <div key={tool.id} className="p-4 rounded-xl card-glass space-y-2.5">
                  <div className="flex items-center justify-between">
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
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/28 shrink-0">Renewal date</span>
                    <input
                      type="date"
                      value={renewalDates[tool.id] ?? ''}
                      onChange={e => setRenewalDates(r => ({ ...r, [tool.id]: e.target.value }))}
                      className="flex-1 bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-1 text-[12px] text-white/60 outline-none focus:border-violet-500/40 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-5 border-t border-white/[0.06]">
              <p className="text-[12px] text-white/35 uppercase tracking-widest font-medium">Total monthly</p>
              <div className="flex items-end gap-1.5 leading-none">
                <span className="text-[44px] font-black tracking-[-0.04em] leading-none text-gradient-hero tabular-nums">
                  ${totalPreview.toFixed(0)}
                </span>
                <span className="text-white/25 text-[16px] font-normal pb-1">/mo</span>
              </div>
            </div>

            {user.plan === 'free' && onUpgrade && (
              <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-950/40" style={{ boxShadow: '0 0 32px rgba(139,92,246,0.12)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[13px] text-violet-200">Orbit Pro</div>
                    <div className="text-[11px] text-violet-400/60 mt-0.5">Unlimited tools · No limits</div>
                  </div>
                  <button
                    type="button"
                    onClick={onUpgrade}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold btn-glow text-white"
                  >
                    Unlock Pro
                  </button>
                </div>
              </div>
            )}

            {saveError && (
              <p className="text-red-400 text-[12px] text-center px-2">{saveError}</p>
            )}
            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white btn-glow"
            >
              {user.plan === 'pro' ? 'Start Tracking →' : 'Start Tracking Free →'}
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
