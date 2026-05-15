'use client';

import { useState } from 'react';
import { OrbitUser } from '@/app/lib/types';

interface Props {
  user: OrbitUser;
  onUpgrade: (user: OrbitUser) => void;
  onBack: () => void;
}

const PRO_FEATURES = [
  { icon: '∞', label: 'Unlimited subscriptions' },
  { icon: '📧', label: 'Email receipt scanning (coming soon)' },
  { icon: '🔔', label: 'Renewal reminders' },
  { icon: '📊', label: 'Spending trends over time' },
  { icon: '✂️', label: 'One-tap cancellation links' },
  { icon: '📤', label: 'Export your data anytime' },
];

export default function Upgrade({ user, onUpgrade, onBack }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const { url, error } = await res.json();
      if (error || !url) throw new Error(error || 'No checkout URL');
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orbit text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-gradient-violet">Orbit</span>
          <button
            onClick={onBack}
            className="text-sm text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-8">

          {/* Headline */}
          <div className="text-center space-y-2">
            <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest">Orbit Pro</p>
            <h1 className="text-4xl font-bold tracking-tight text-gradient">Upgrade your orbit</h1>
            <p className="text-white/40 text-sm">Track every tool you pay for. Not just four.</p>
          </div>

          {/* Pricing card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-600/15 to-purple-600/8 border border-violet-500/25 space-y-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

            <div className="space-y-1">
              <div className="flex items-end gap-1">
                <span className="text-5xl font-bold text-gradient">$8</span>
                <span className="text-white/30 text-lg mb-1.5">/month</span>
              </div>
              <p className="text-white/30 text-xs">Billed monthly · Cancel anytime in two clicks</p>
            </div>

            <div className="space-y-2.5">
              {PRO_FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-3 text-sm">
                  <span className="text-base w-5 text-center shrink-0">{f.icon}</span>
                  <span className="text-white/70">{f.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Upgrading…
                </span>
              ) : 'Upgrade to Pro →'}
            </button>
          </div>

          {/* Free tier reminder */}
          <div className="p-4 rounded-xl card-glass space-y-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">You're on Free</p>
            <div className="space-y-2">
              {[
                { label: 'Track up to 4 subscriptions', included: true },
                { label: 'Idle tool alerts', included: true },
                { label: 'Share your AI stack', included: true },
                { label: 'Unlimited subscriptions', included: false },
                { label: 'Renewal reminders', included: false },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5 text-sm">
                  <span className={item.included ? 'text-emerald-400' : 'text-white/15'}>
                    {item.included ? '✓' : '×'}
                  </span>
                  <span className={item.included ? 'text-white/60' : 'text-white/25'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* No BS promise */}
          <div className="text-center space-y-1">
            <p className="text-white/25 text-xs">No annual lock-in. No hidden fees. No upsells.</p>
            <p className="text-white/15 text-xs">To cancel: go to Settings → Billing → Cancel. Takes 10 seconds.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
