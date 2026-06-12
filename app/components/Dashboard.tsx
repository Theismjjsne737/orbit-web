'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AiTool, FREE_LIMIT, OrbitData, OrbitUser, UserSubscription } from '@/app/lib/types';
import { AI_TOOLS, GOALS } from '@/app/data/tools';
import { getTotalMonthlySpend, getIdleTools, markToolUsed, saveData, signOut as localSignOut, exportJSON, exportCSV } from '@/app/lib/storage';
import { signOut as oauthSignOut } from 'next-auth/react';
import { OrbitWordmark } from '@/app/components/OrbitLogo';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import AddToolModal from '@/app/components/AddToolModal';

/* Count-up hook — animates from 0 to target on mount / target change */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;

    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

interface Props {
  data: OrbitData;
  user: OrbitUser;
  onReset: () => void;
  onUpdate: (data: OrbitData) => void;
  onUpgrade: () => void;
}

export default function Dashboard({ data, user, onReset, onUpdate, onUpgrade }: Props) {
  const isPro = user.plan === 'pro';
  const nearLimit = !isPro && data.subscriptions.length >= FREE_LIMIT;
  const [showShareCard, setShowShareCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleCloseModal = useCallback(() => setShowAddModal(false), []);

  const toolNameMap: Record<string, string> = Object.fromEntries(
    [...AI_TOOLS, ...data.customTools].map(t => [t.id, t.name])
  );

  const total = getTotalMonthlySpend(data);
  const idleTools = getIdleTools(data);
  const goal = GOALS.find(g => g.id === data.goal);
  const yearlyTotal = total * 12;
  const idleCost = idleTools.reduce((sum, s) => sum + s.monthlyPrice, 0);

  const animatedTotal = useCountUp(total);
  const activeCount = useCountUp(data.subscriptions.length - idleTools.length);
  const idleCount = useCountUp(idleTools.length);

  const soonCount = data.subscriptions.filter(s => {
    if (!s.renewsOn) return false;
    const d = new Date(s.renewsOn.length === 10 ? s.renewsOn + 'T00:00:00' : s.renewsOn);
    if (isNaN(d.getTime())) return false;
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  }).length;
  const hasSoonRenewing = soonCount > 0;
  const animatedSoon = useCountUp(soonCount);

  function handleMarkUsed(toolId: string) {
    markToolUsed(toolId);
    const updated = {
      ...data,
      subscriptions: data.subscriptions.map(s =>
        s.toolId === toolId ? { ...s, lastUsed: new Date().toISOString() } : s
      ),
    };
    onUpdate(updated);
  }

  function handleRemove(toolId: string) {
    const updated = { ...data, subscriptions: data.subscriptions.filter(s => s.toolId !== toolId) };
    saveData(updated);
    onUpdate(updated);
  }

  function handlePriceChange(toolId: string, price: number) {
    const updated = {
      ...data,
      subscriptions: data.subscriptions.map(s =>
        s.toolId === toolId ? { ...s, monthlyPrice: price } : s
      ),
    };
    saveData(updated);
    onUpdate(updated);
  }

  function handleAddSubscription(sub: UserSubscription) {
    const updated = { ...data, subscriptions: [...data.subscriptions, sub] };
    saveData(updated);
    onUpdate(updated);
    setShowAddModal(false);
  }

  function handleCopyShare() {
    const text = `My AI stack: $${total}/month across ${data.subscriptions.length} tools — tracked with Orbit`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }

  const allTools = [...AI_TOOLS, ...(data.customTools ?? [])];

  function getToolById(id: string) {
    return allTools.find(t => t.id === id);
  }

  function isIdle(sub: UserSubscription): boolean {
    if (!sub.lastUsed) return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return new Date(sub.lastUsed) < cutoff;
  }

  const categoryOrder = ['coding', 'writing', 'research', 'productivity', 'image', 'video', 'other'];
  const categoryLabels: Record<string, string> = {
    coding: 'Coding & Dev', writing: 'Writing', research: 'Research',
    productivity: 'Productivity', image: 'Image & Design', video: 'Video & Audio', other: 'Other',
  };

  const grouped = categoryOrder.reduce((acc, cat) => {
    const tools = data.subscriptions
      .map(s => ({ sub: s, tool: getToolById(s.toolId) }))
      .filter(({ tool }) => tool?.category === cat);
    if (tools.length > 0) acc[cat] = tools;
    return acc;
  }, {} as Record<string, { sub: UserSubscription; tool: ReturnType<typeof getToolById> }[]>);

  /* Sidebar: spend by category */
  const categorySpend = categoryOrder
    .map(cat => ({
      cat,
      label: categoryLabels[cat],
      spend: data.subscriptions
        .filter(s => getToolById(s.toolId)?.category === cat)
        .reduce((sum, s) => sum + s.monthlyPrice, 0),
    }))
    .filter(c => c.spend > 0);
  const maxCategorySpend = Math.max(...categorySpend.map(c => c.spend), 1);

  /* Sidebar: renewing within 14 days */
  const soonTools = data.subscriptions
    .filter(s => {
      if (!s.renewsOn) return false;
      const d = new Date(s.renewsOn.length === 10 ? s.renewsOn + 'T00:00:00' : s.renewsOn);
      if (isNaN(d.getTime())) return false;
      const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 14;
    })
    .map(s => {
      const tool = getToolById(s.toolId);
      const d = new Date(s.renewsOn!.length === 10 ? s.renewsOn! + 'T00:00:00' : s.renewsOn!);
      const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
      return { s, tool, days };
    })
    .filter(x => x.tool !== undefined)
    .sort((a, b) => a.days - b.days);

  const showSoonPill = data.subscriptions.some(s => s.renewsOn);

  return (
    <div className="relative min-h-screen text-white flex flex-col">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <OrbitWordmark size="md" />
          <div className="flex items-center gap-3">
            {isPro ? (
              <span className="text-[9px] px-2 py-1 rounded-full bg-violet-500/12 border border-violet-500/22 text-violet-300 uppercase tracking-widest font-semibold">Pro</span>
            ) : (
              <span className="text-[9px] px-2 py-1 rounded-full border border-white/8 text-white/60 uppercase tracking-widest font-medium">Free</span>
            )}
            <span className="text-[12px] text-white/80 hidden sm:block">{user.email}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(v => !v)}
                className="text-[12px] text-white/80 hover:text-white/80 transition-colors"
              >
                Export ↓
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-6 z-50 w-36 rounded-xl card-glass border border-white/8 py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => { exportJSON(data); setShowExportMenu(false); }}
                      className="w-full text-left px-3 py-2 text-[12px] text-white/80 hover:text-white/85 hover:bg-white/[0.04] transition-colors"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => { exportCSV(data, toolNameMap); setShowExportMenu(false); }}
                      className="w-full text-left px-3 py-2 text-[12px] text-white/80 hover:text-white/85 hover:bg-white/[0.04] transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => { localSignOut(); oauthSignOut({ callbackUrl: '/' }); }}
              className="text-[12px] text-white/80 hover:text-white/80 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">

          {/* ── LEFT: Main content ── */}
          <div className="space-y-8 min-w-0">

            {/* Hero spend */}
            <div className="space-y-1 animate-fade-up">
              {goal && (
                <p className="text-[10px] text-white/85 font-medium uppercase tracking-[0.2em] mb-3">
                  {goal.emoji} {goal.label}
                </p>
              )}
              <div className="flex items-end gap-3 leading-none">
                <span className="text-[60px] sm:text-[92px] font-black tracking-[-0.046em] leading-none text-gradient-hero tabular-nums">
                  ${animatedTotal}
                </span>
                <span className="text-white/80 text-[22px] font-normal pb-4">/mo</span>
              </div>
              <p className="text-[13px] text-white/85 mt-2">
                {data.subscriptions.length} subscription{data.subscriptions.length !== 1 ? 's' : ''}
                <span className="mx-2 text-white/75">·</span>
                <span className="text-white/60">${yearlyTotal.toLocaleString()}/year</span>
              </p>
            </div>

            {/* Free tier banner */}
            {nearLimit && (
              <div className="p-4 rounded-2xl bg-violet-950/50 border border-violet-500/22 flex items-center justify-between gap-4 animate-scale-in">
                <div>
                  <p className="text-violet-200 font-semibold text-[13px]">Free limit reached</p>
                  <p className="text-violet-400/50 text-[12px] mt-0.5">Tracking {FREE_LIMIT} of {FREE_LIMIT} tools</p>
                </div>
                <button type="button" onClick={onUpgrade} className="shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold btn-glow text-white">
                  Upgrade →
                </button>
              </div>
            )}

            {/* Idle warning */}
            {idleTools.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-500/[0.05] border border-amber-500/[0.18] animate-scale-in">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 w-8 h-8 rounded-xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 text-[15px]">⚠</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-200 font-semibold text-[13px]">${idleCost}/mo going to waste</p>
                    <p className="text-amber-400/50 text-[12px] mt-0.5">
                      {idleTools.length} tool{idleTools.length > 1 ? 's' : ''} unused in 30+ days
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {idleTools.map(s => {
                        const tool = getToolById(s.toolId);
                        return tool ? (
                          <span key={s.toolId} className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/20 font-medium">
                            {tool.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {data.subscriptions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up space-y-4">
                <div className="text-[56px] leading-none">🛸</div>
                <div>
                  <p className="font-bold text-[18px] text-white/75">No tools tracked yet</p>
                  <p className="text-[13px] text-white/85 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Add your first AI subscription to start tracking your spend
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 px-6 py-3 rounded-xl text-[13px] font-semibold btn-glow text-white"
                >
                  + Add First Subscription
                </button>
              </div>
            )}

            {/* Tool list by category */}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    {categoryLabels[cat]}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <div className="space-y-1.5">
                  {items.map(({ sub, tool }) => {
                    if (!tool) return null;
                    const idle = isIdle(sub);
                    return (
                      <ToolCard
                        key={sub.toolId}
                        tool={tool}
                        sub={sub}
                        idle={idle}
                        onMarkUsed={() => handleMarkUsed(tool.id)}
                        onRemove={() => handleRemove(tool.id)}
                        onPriceChange={(price) => handlePriceChange(tool.id, price)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Add subscription button */}
            {data.subscriptions.length > 0 && (
              <div className="pt-2">
                {!isPro && data.subscriptions.length >= FREE_LIMIT ? (
                  <button
                    type="button"
                    onClick={onUpgrade}
                    className="w-full py-3.5 rounded-2xl card-glass text-[13px] text-violet-400/70 hover:text-violet-300 transition-all duration-200 font-medium border border-violet-500/15 hover:border-violet-500/30"
                  >
                    + Add Subscription (Upgrade to Pro)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-3.5 rounded-2xl text-[13px] font-semibold text-white btn-glow"
                  >
                    + Add Subscription
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="mt-8 lg:mt-0 space-y-5 lg:sticky lg:top-8 lg:self-start">

            {/* Stat pills — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl card-glass hover:scale-[1.03] transition-transform cursor-default">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2.5 font-medium">Active</p>
                <p className="text-[28px] font-bold tracking-tight leading-none text-white/90 tabular-nums">{activeCount}</p>
                <p className="text-[11px] text-white/85 mt-2">used recently</p>
              </div>
              <div className={`p-4 rounded-2xl hover:scale-[1.03] transition-all cursor-default ${
                idleTools.length > 0 ? 'bg-amber-500/[0.07] border border-amber-500/[0.18]' : 'card-glass'
              }`}>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2.5 font-medium">Idle</p>
                <p className={`text-[28px] font-bold tracking-tight leading-none tabular-nums ${idleTools.length > 0 ? 'text-amber-400' : 'text-white/90'}`}>
                  {idleCount}
                </p>
                <p className="text-[11px] text-white/85 mt-2">${idleCost}/mo wasted</p>
              </div>
              <div className="p-4 rounded-2xl card-glass hover:scale-[1.03] transition-transform cursor-default">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2.5 font-medium">Yearly</p>
                <p className="text-[28px] font-bold tracking-tight leading-none text-white/90 tabular-nums">
                  ${yearlyTotal > 999 ? (yearlyTotal / 1000).toFixed(1) + 'k' : yearlyTotal}
                </p>
                <p className="text-[11px] text-white/85 mt-2">committed</p>
              </div>
              {showSoonPill ? (
                <div className={`p-4 rounded-2xl hover:scale-[1.03] transition-all cursor-default ${
                  hasSoonRenewing ? 'bg-amber-500/[0.07] border border-amber-500/[0.18]' : 'card-glass'
                }`}>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2.5 font-medium">Soon</p>
                  <p className={`text-[28px] font-bold tracking-tight leading-none tabular-nums ${hasSoonRenewing ? 'text-amber-400' : 'text-white/90'}`}>
                    {animatedSoon}
                  </p>
                  <p className="text-[11px] text-white/85 mt-2">renewing soon</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl card-glass hover:scale-[1.03] transition-transform cursor-default">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mb-2.5 font-medium">Tools</p>
                  <p className="text-[28px] font-bold tracking-tight leading-none text-white/90 tabular-nums">
                    {data.subscriptions.length}
                  </p>
                  <p className="text-[11px] text-white/85 mt-2">tracked</p>
                </div>
              )}
            </div>

            {/* Spend by category */}
            {categorySpend.length > 0 && (
              <div className="p-5 rounded-2xl card-glass">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold mb-4">Spend by category</p>
                <div className="space-y-3.5">
                  {categorySpend.map(c => (
                    <div key={c.cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-white/75">{c.label}</span>
                        <span className="text-[12px] text-white/85 font-semibold tabular-nums">${c.spend}/mo</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600/70 to-violet-400/60 transition-all duration-700"
                          style={{ width: `${Math.round((c.spend / maxCategorySpend) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Renewing soon (within 14 days) */}
            {soonTools.length > 0 && (
              <div className="p-5 rounded-2xl card-glass">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold mb-4">Renewing soon</p>
                <div className="space-y-3">
                  {soonTools.map(({ s, tool, days }) => (
                    <div key={s.toolId} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${TOOL_COLORS[tool!.name.charCodeAt(0) % TOOL_COLORS.length]}`}>
                          {tool!.name[0]}
                        </div>
                        <span className="text-[12px] text-white/85 truncate">{tool!.name}</span>
                      </div>
                      <span className={`text-[11px] font-medium shrink-0 ${days <= 3 ? 'text-amber-400' : 'text-white/70'}`}>
                        {days === 0 ? 'today' : `${days}d`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share card */}
            <div>
              {showShareCard ? (
                <div className="space-y-3 animate-scale-in">
                  <div className="relative p-5 rounded-2xl card-glass overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-indigo-600/4 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/8 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="relative">
                      <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-medium mb-3">My AI Stack</p>
                      <div className="flex items-end gap-2 leading-none mb-1">
                        <span className="text-[40px] font-black tracking-[-0.04em] leading-none text-gradient-hero tabular-nums">${total}</span>
                        <span className="text-white/60 text-base font-normal pb-1.5">/mo</span>
                      </div>
                      <p className="text-white/70 text-[12px]">{data.subscriptions.length} tools in orbit</p>
                      {goal && <p className="text-[11px] text-white/60 mt-0.5">{goal.emoji} {goal.label}</p>}
                      <p className="text-[9px] text-white/50 mt-3 font-medium tracking-[0.18em] uppercase">orbit.app</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleCopyShare} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold btn-glow text-white">
                      {copied ? '✓ Copied!' : 'Copy text'}
                    </button>
                    <button type="button" onClick={() => setShowShareCard(false)} className="px-4 py-2.5 rounded-xl text-[12px] text-white/70 hover:text-white card-glass transition-all">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowShareCard(true)}
                  className="w-full py-3.5 rounded-2xl card-glass text-[12px] text-white/85 hover:text-white/60 transition-all duration-200 font-medium"
                >
                  Share my AI stack →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddToolModal
          data={data}
          user={user}
          allTools={allTools}
          onAdd={handleAddSubscription}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

/* ── Tool icon colors (stable per first char) ── */
const TOOL_COLORS = [
  'bg-violet-600/20 text-violet-300',
  'bg-blue-600/20 text-blue-300',
  'bg-emerald-600/20 text-emerald-300',
  'bg-rose-600/20 text-rose-300',
  'bg-amber-600/20 text-amber-300',
  'bg-cyan-600/20 text-cyan-300',
  'bg-indigo-600/20 text-indigo-300',
  'bg-pink-600/20 text-pink-300',
];

function getLastUsedLabel(lastUsed: string | null): { text: string; className: string } {
  if (!lastUsed) return { text: 'Never used', className: 'text-red-400/70' };
  const days = Math.floor((Date.now() - new Date(lastUsed).getTime()) / 86400000);
  if (days === 0) return { text: 'Used today', className: 'text-emerald-400/70' };
  if (days === 1) return { text: 'Used yesterday', className: 'text-white/85' };
  if (days <= 30) return { text: `Used ${days} days ago`, className: 'text-white/85' };
  return { text: `Used ${days} days ago`, className: 'text-amber-400/60' };
}

/* ── RenewalBadge ── */

function RenewalBadge({ renewsOn }: { renewsOn: string }) {
  const ms = new Date(renewsOn).getTime() - Date.now();
  if (isNaN(ms)) return null;
  const days = Math.ceil(ms / 86400000);

  if (days <= 0) {
    return (
      <span className="text-[11px] text-red-400 font-medium">
        {days === 0 ? 'Renews today' : 'Due for renewal'}
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="text-[11px] text-amber-400 font-medium">
        Renews in {days} day{days !== 1 ? 's' : ''}
      </span>
    );
  }

  const date = new Date(renewsOn);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <span className="text-[11px] text-white/85">
      Renews {formatted}
    </span>
  );
}

/* ── ToolCard ── */

function ToolCard({
  tool, sub, idle, onMarkUsed, onRemove, onPriceChange,
}: {
  tool: AiTool;
  sub: UserSubscription;
  idle: boolean;
  onMarkUsed: () => void;
  onRemove: () => void;
  onPriceChange: (price: number) => void;
}) {
  const [showRemove, setShowRemove] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(sub.monthlyPrice));
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  function commitPrice() {
    const parsed = parseFloat(priceInput);
    setEditingPrice(false);
    if (!isNaN(parsed) && parsed >= 0) {
      onPriceChange(parsed);
      setSavedFlash(true);
      flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1500);
    } else {
      setPriceInput(String(sub.monthlyPrice));
    }
  }

  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitPrice();
    if (e.key === 'Escape') {
      setPriceInput(String(sub.monthlyPrice));
      setEditingPrice(false);
    }
  }

  const toolColor = TOOL_COLORS[tool.name.charCodeAt(0) % TOOL_COLORS.length];
  const lastUsedLabel = getLastUsedLabel(sub.lastUsed);

  return (
    <div className={`group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 ${
      idle ? 'bg-amber-500/[0.04] border border-amber-500/[0.12]' : 'card-glass'
    }`}>
      {idle && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-amber-400/45 rounded-full" />}

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold ${toolColor}`}>
        {tool.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] text-white/85">{tool.name}</span>
          {idle && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400/75 border border-amber-500/15 font-semibold tracking-wide uppercase">
              idle
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[11px] ${lastUsedLabel.className}`}>{lastUsedLabel.text}</span>
          {sub.renewsOn && <RenewalBadge renewsOn={sub.renewsOn} />}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {savedFlash ? (
          <span className="text-[12px] text-violet-400 font-medium">Saved ✓</span>
        ) : editingPrice ? (
          <div className="flex items-center gap-1 bg-white/[0.06] border border-violet-500/35 rounded-lg px-2 py-1">
            <span className="text-white/72 text-[12px]">$</span>
            <input
              type="number"
              min={0}
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={handlePriceKeyDown}
              className="w-14 bg-transparent text-right text-[13px] font-bold text-white outline-none"
              autoFocus
            />
            <span className="text-white/72 text-[12px]">/mo</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setPriceInput(String(sub.monthlyPrice)); setEditingPrice(true); }}
            className="text-[14px] font-semibold text-white/80 hover:text-white/85 transition-colors cursor-pointer"
            title="Click to edit price"
          >
            ${sub.monthlyPrice}/mo
          </button>
        )}

        <button
          type="button"
          onClick={onMarkUsed}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-all font-medium ${
            idle
              ? 'bg-violet-600/15 border border-violet-500/22 text-violet-300 hover:bg-violet-600/28 hover:text-violet-200'
              : 'opacity-0 group-hover:opacity-100 bg-white/[0.04] border border-white/10 text-white/70 hover:text-white/85 hover:bg-white/[0.07]'
          }`}
        >
          ✓ Used Today
        </button>

        {showRemove ? (
          <div className="flex items-center gap-1">
            <button type="button" onClick={onRemove} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/12 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-medium">
              Remove
            </button>
            <button type="button" onClick={() => setShowRemove(false)} className="text-[11px] px-2 py-1.5 text-white/60 hover:text-white/50 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRemove(true)}
            className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white/50 transition-all p-1.5 rounded-lg hover:bg-white/5"
            title="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
