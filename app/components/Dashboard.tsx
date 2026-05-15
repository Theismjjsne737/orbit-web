'use client';

import { useState } from 'react';
import { AiTool, FREE_LIMIT, OrbitData, OrbitUser, UserSubscription } from '@/app/lib/types';
import { AI_TOOLS, GOALS } from '@/app/data/tools';
import { getTotalMonthlySpend, getIdleTools, markToolUsed, resetData, saveData, signOut } from '@/app/lib/storage';

interface Props {
  data: OrbitData;
  user: OrbitUser;
  onReset: () => void;
  onUpdate: (data: OrbitData) => void;
  onUpgrade: () => void;
}

export default function Dashboard({ data, user, onReset, onUpdate, onUpgrade }: Props) {
  const isPro = user.plan === 'pro';
  const limit = isPro ? Infinity : FREE_LIMIT;
  const nearLimit = !isPro && data.subscriptions.length >= FREE_LIMIT;
  const [showShareCard, setShowShareCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = getTotalMonthlySpend(data);
  const idleTools = getIdleTools(data);
  const goal = GOALS.find(g => g.id === data.goal);
  const yearlyTotal = total * 12;

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
    const updated = {
      ...data,
      subscriptions: data.subscriptions.filter(s => s.toolId !== toolId),
    };
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

  const grouped = categoryOrder.reduce((acc, cat) => {
    const tools = data.subscriptions
      .map(s => ({ sub: s, tool: getToolById(s.toolId) }))
      .filter(({ tool }) => tool?.category === cat);
    if (tools.length > 0) acc[cat] = tools;
    return acc;
  }, {} as Record<string, { sub: UserSubscription; tool: ReturnType<typeof getToolById> }[]>);

  const categoryLabels: Record<string, string> = {
    coding: 'Coding & Dev',
    writing: 'Writing',
    research: 'Research',
    productivity: 'Productivity',
    image: 'Image & Design',
    video: 'Video & Audio',
    other: 'Other',
  };

  const idleCost = idleTools.reduce((sum, s) => sum + s.monthlyPrice, 0);

  return (
    <div className="min-h-screen bg-orbit text-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gradient-violet">Orbit</span>
          </span>
          <div className="flex items-center gap-4">
            {!isPro && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/30 uppercase tracking-widest font-medium">
                Free
              </span>
            )}
            <span className="text-xs text-white/25 hidden sm:block">{user.email}</span>
            <button
              onClick={() => { signOut(); onReset(); }}
              className="text-xs text-white/20 hover:text-white/50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Hero: spend summary */}
        <div className="space-y-1">
          {goal && (
            <p className="text-white/30 text-xs font-medium uppercase tracking-widest mb-4">
              {goal.emoji} {goal.label}
            </p>
          )}
          <div className="flex items-end gap-2">
            <span className="text-7xl font-bold tracking-tighter text-gradient">
              ${total}
            </span>
            <span className="text-white/25 text-2xl font-normal mb-2">/mo</span>
          </div>
          <p className="text-white/35 text-sm">
            {data.subscriptions.length} AI subscription{data.subscriptions.length !== 1 ? 's' : ''}
            <span className="mx-2 text-white/15">·</span>
            <span className="text-white/25">${yearlyTotal.toLocaleString()}/year</span>
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex gap-3">
          <div className="flex-1 p-4 rounded-2xl card-glass">
            <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Active</p>
            <p className="text-2xl font-bold">{data.subscriptions.length - idleTools.length}</p>
            <p className="text-xs text-white/30 mt-0.5">tools used recently</p>
          </div>
          <div className={`flex-1 p-4 rounded-2xl ${idleTools.length > 0 ? 'bg-amber-500/8 border border-amber-500/20' : 'card-glass'}`}>
            <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Idle</p>
            <p className={`text-2xl font-bold ${idleTools.length > 0 ? 'text-amber-400' : ''}`}>{idleTools.length}</p>
            <p className="text-xs text-white/30 mt-0.5">${idleCost}/mo wasted</p>
          </div>
          <div className="flex-1 p-4 rounded-2xl card-glass">
            <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Yearly</p>
            <p className="text-2xl font-bold">${yearlyTotal > 999 ? (yearlyTotal / 1000).toFixed(1) + 'k' : yearlyTotal}</p>
            <p className="text-xs text-white/30 mt-0.5">total committed</p>
          </div>
        </div>

        {/* Free tier upgrade banner */}
        {nearLimit && (
          <div className="p-4 rounded-2xl bg-violet-500/8 border border-violet-500/20 flex items-center justify-between gap-4">
            <div>
              <p className="text-violet-300 font-semibold text-sm">You've reached the free limit</p>
              <p className="text-violet-400/50 text-xs mt-0.5">
                Free plan tracks up to {FREE_LIMIT} tools. Upgrade for unlimited.
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              Upgrade →
            </button>
          </div>
        )}

        {/* Idle warning banner */}
        {idleTools.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/6 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg mt-0.5">⚠</span>
              <div className="flex-1">
                <p className="text-amber-300 font-semibold text-sm">
                  ${idleCost}/mo going to waste
                </p>
                <p className="text-amber-400/50 text-xs mt-0.5">
                  {idleTools.length} tool{idleTools.length > 1 ? 's' : ''} you haven't used in 30+ days
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {idleTools.map(s => {
                    const tool = getToolById(s.toolId);
                    return tool ? (
                      <span key={s.toolId} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
          <div key={cat}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20 mb-3">
              {categoryLabels[cat]}
            </h3>
            <div className="space-y-2">
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

        {/* Share card */}
        <div className="pt-4 border-t border-white/[0.06]">
          {showShareCard ? (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl card-glass space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-purple-600/4 pointer-events-none" />
                <div className="text-[10px] text-white/25 uppercase tracking-widest">My AI Stack</div>
                <div>
                  <span className="text-5xl font-bold text-gradient">${total}</span>
                  <span className="text-white/25 text-xl font-normal">/mo</span>
                </div>
                <div className="text-white/40 text-sm">{data.subscriptions.length} tools in orbit</div>
                {goal && <div className="text-sm text-white/30">{goal.emoji} {goal.label}</div>}
                <div className="text-[10px] text-white/15 pt-2 font-medium tracking-widest uppercase">orbit.app</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyShare}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500 transition-all"
                >
                  {copied ? '✓ Copied!' : 'Copy text'}
                </button>
                <button
                  onClick={() => setShowShareCard(false)}
                  className="px-5 py-3 rounded-xl text-sm text-white/35 hover:text-white card-glass transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowShareCard(true)}
              className="w-full py-3.5 rounded-2xl card-glass text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200 font-medium"
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
  tool,
  sub,
  idle,
  onMarkUsed,
  onRemove,
}: {
  tool: AiTool;
  sub: UserSubscription;
  idle: boolean;
  onMarkUsed: () => void;
  onRemove: () => void;
}) {
  const [showRemove, setShowRemove] = useState(false);

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
        idle
          ? 'bg-amber-500/5 border border-amber-500/15'
          : 'card-glass'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{tool.name}</span>
          {idle && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-400 border border-amber-500/20 font-medium">
              idle
            </span>
          )}
        </div>
        <div className="text-xs text-white/25 mt-0.5 truncate">{tool.description}</div>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        <span className="text-sm font-semibold text-white/70">${sub.monthlyPrice}/mo</span>

        {idle ? (
          <button
            onClick={onMarkUsed}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 hover:text-violet-200 transition-all font-medium"
          >
            used today
          </button>
        ) : null}

        {showRemove ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRemove}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition-all font-medium"
            >
              Remove
            </button>
            <button
              onClick={() => setShowRemove(false)}
              className="text-xs px-2 py-1.5 rounded-lg text-white/25 hover:text-white/50 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRemove(true)}
            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 transition-all p-1 rounded"
            title="Remove subscription"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
