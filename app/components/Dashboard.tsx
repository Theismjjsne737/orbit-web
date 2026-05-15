'use client';

import { useState } from 'react';
import { AiTool, FREE_LIMIT, OrbitData, OrbitUser, UserSubscription } from '@/app/lib/types';
import { AI_TOOLS, GOALS } from '@/app/data/tools';
import { getTotalMonthlySpend, getIdleTools, markToolUsed, resetData, saveData, signOut } from '@/app/lib/storage';

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

  const total = getTotalMonthlySpend(data);
  const idleTools = getIdleTools(data);
  const goal = GOALS.find(g => g.id === data.goal);
  const yearlyTotal = total * 12;
  const idleCost = idleTools.reduce((sum, s) => sum + s.monthlyPrice, 0);

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

  function handleCopyShare() {
    const text = `My AI stack: $${total}/month across ${data.subscriptions.length} tools — tracked with Orbit`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="min-h-screen bg-orbit text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <OrbitMark size={18} />
            <span className="text-[15px] font-semibold tracking-tight text-gradient-violet">Orbit</span>
          </div>
          <div className="flex items-center gap-3">
            {isPro ? (
              <span className="text-[9px] px-2 py-1 rounded-full bg-violet-500/12 border border-violet-500/22 text-violet-300 uppercase tracking-widest font-semibold">
                Pro
              </span>
            ) : (
              <span className="text-[9px] px-2 py-1 rounded-full border border-white/8 text-white/22 uppercase tracking-widest font-medium">
                Free
              </span>
            )}
            <span className="text-[12px] text-white/20 hidden sm:block">{user.email}</span>
            <button
              onClick={() => { signOut(); onReset(); }}
              className="text-[12px] text-white/20 hover:text-white/50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Hero: spend */}
        <div className="space-y-1 animate-fade-up">
          {goal && (
            <p className="text-[10px] text-white/28 font-medium uppercase tracking-[0.2em] mb-3">
              {goal.emoji} {goal.label}
            </p>
          )}
          <div className="flex items-end gap-3 leading-none">
            <span className="text-[88px] font-black tracking-[-0.045em] leading-none text-gradient-hero">
              ${total}
            </span>
            <span className="text-white/20 text-[22px] font-normal pb-4">/mo</span>
          </div>
          <p className="text-[13px] text-white/30 mt-2">
            {data.subscriptions.length} subscription{data.subscriptions.length !== 1 ? 's' : ''}
            <span className="mx-2 text-white/12">·</span>
            <span className="text-white/22">${yearlyTotal.toLocaleString()}/year</span>
          </p>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="p-4 rounded-2xl card-glass">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/22 mb-2.5 font-medium">Active</p>
            <p className="text-[28px] font-bold tracking-tight leading-none text-white/90">
              {data.subscriptions.length - idleTools.length}
            </p>
            <p className="text-[11px] text-white/28 mt-2">used recently</p>
          </div>
          <div className={`p-4 rounded-2xl transition-colors ${
            idleTools.length > 0
              ? 'bg-amber-500/[0.07] border border-amber-500/[0.18]'
              : 'card-glass'
          }`}>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/22 mb-2.5 font-medium">Idle</p>
            <p className={`text-[28px] font-bold tracking-tight leading-none ${idleTools.length > 0 ? 'text-amber-400' : 'text-white/90'}`}>
              {idleTools.length}
            </p>
            <p className="text-[11px] text-white/28 mt-2">${idleCost}/mo wasted</p>
          </div>
          <div className="p-4 rounded-2xl card-glass">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/22 mb-2.5 font-medium">Yearly</p>
            <p className="text-[28px] font-bold tracking-tight leading-none text-white/90">
              ${yearlyTotal > 999 ? (yearlyTotal / 1000).toFixed(1) + 'k' : yearlyTotal}
            </p>
            <p className="text-[11px] text-white/28 mt-2">committed</p>
          </div>
        </div>

        {/* Free tier banner */}
        {nearLimit && (
          <div className="p-4 rounded-2xl bg-violet-950/50 border border-violet-500/22 flex items-center justify-between gap-4 animate-scale-in">
            <div>
              <p className="text-violet-200 font-semibold text-[13px]">Free limit reached</p>
              <p className="text-violet-400/50 text-[12px] mt-0.5">
                Tracking {FREE_LIMIT} of {FREE_LIMIT} tools on the free plan
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold btn-glow text-white"
            >
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
                <p className="text-amber-200 font-semibold text-[13px]">
                  ${idleCost}/mo going to waste
                </p>
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

        {/* Tool list by category */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">
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
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Share */}
        <div className="pt-4 border-t border-white/[0.05]">
          {showShareCard ? (
            <div className="space-y-4 animate-scale-in">
              <div className="relative p-6 rounded-2xl card-glass overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-indigo-600/4 pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/8 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="relative">
                  <p className="text-[10px] text-white/22 uppercase tracking-[0.2em] font-medium mb-4">My AI Stack</p>
                  <div className="flex items-end gap-2 leading-none mb-2">
                    <span className="text-[52px] font-black tracking-[-0.04em] leading-none text-gradient-hero">${total}</span>
                    <span className="text-white/25 text-lg font-normal pb-2">/mo</span>
                  </div>
                  <p className="text-white/35 text-[13px]">{data.subscriptions.length} tools in orbit</p>
                  {goal && <p className="text-[12px] text-white/25 mt-1">{goal.emoji} {goal.label}</p>}
                  <p className="text-[10px] text-white/15 mt-4 font-medium tracking-[0.18em] uppercase">orbit.app</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyShare}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold btn-glow text-white transition-all"
                >
                  {copied ? '✓ Copied!' : 'Copy text'}
                </button>
                <button
                  onClick={() => setShowShareCard(false)}
                  className="px-5 py-3 rounded-xl text-[13px] text-white/35 hover:text-white card-glass transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowShareCard(true)}
              className="w-full py-3.5 rounded-2xl card-glass text-[13px] text-white/35 hover:text-white/65 transition-all duration-200 font-medium"
            >
              Share my AI stack →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  tool, sub, idle, onMarkUsed, onRemove,
}: {
  tool: AiTool;
  sub: UserSubscription;
  idle: boolean;
  onMarkUsed: () => void;
  onRemove: () => void;
}) {
  const [showRemove, setShowRemove] = useState(false);

  return (
    <div className={`group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
      idle
        ? 'bg-amber-500/[0.04] border border-amber-500/[0.12]'
        : 'card-glass'
    }`}>
      {idle && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-amber-400/45 rounded-full" />
      )}

      <div className="flex-1 min-w-0 pl-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] text-white/85">{tool.name}</span>
          {idle && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400/75 border border-amber-500/15 font-semibold tracking-wide uppercase">
              idle
            </span>
          )}
        </div>
        <div className="text-[12px] text-white/25 mt-0.5 truncate">{tool.description}</div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[14px] font-semibold text-white/55">${sub.monthlyPrice}/mo</span>

        {idle && (
          <button
            onClick={onMarkUsed}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/22 text-violet-300 hover:bg-violet-600/25 hover:text-violet-200 transition-all font-medium"
          >
            used today
          </button>
        )}

        {showRemove ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onRemove}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/12 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-medium"
            >
              Remove
            </button>
            <button
              onClick={() => setShowRemove(false)}
              className="text-[11px] px-2 py-1.5 text-white/25 hover:text-white/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRemove(true)}
            className="opacity-0 group-hover:opacity-100 text-white/22 hover:text-white/50 transition-all p-1.5 rounded-lg hover:bg-white/5"
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
