'use client';

import { useState } from 'react';
import { OrbitUser } from '@/app/lib/types';

function OrbitMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <ellipse cx="11" cy="11" rx="9.5" ry="5" stroke="#8b5cf6" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.65"/>
      <circle cx="11" cy="11" r="3.2" fill="#a78bfa"/>
      <circle cx="19.6" cy="7.6" r="1.5" fill="#c4b5fd" opacity="0.9"/>
    </svg>
  );
}

const FEATURES = [
  { label: 'Unlimited subscriptions tracked' },
  { label: 'Email receipt scanning', note: 'coming soon' },
  { label: 'Renewal reminders' },
  { label: 'Spending trends over time' },
  { label: 'One-tap cancellation links' },
  { label: 'Export your data anytime' },
];

interface Props {
  user: OrbitUser;
  onUpgrade: (user: OrbitUser) => void;
  onBack: () => void;
}

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
      <header className="px-6 py-4 border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <OrbitMark size={18} />
            <span className="text-[15px] font-semibold tracking-tight text-gradient-violet">Orbit</span>
          </div>
          <button
            onClick={onBack}
            className="text-[13px] text-white/28 hover:text-white/60 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-14">
        <div className="w-full max-w-[380px] space-y-8">

          {/* Hero */}
          <div className="text-center space-y-2 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-soft" />
              <span className="text-violet-300 text-[11px] font-medium tracking-wide">Orbit Pro</span>
            </div>
            <h1 className="text-[2.5rem] font-black tracking-[-0.035em] leading-[1.06] text-gradient">
              Upgrade your<br />orbit
            </h1>
            <p className="text-[14px] text-white/40">Track every tool you pay for. Not just four.</p>
          </div>

          {/* Pricing card */}
          <div className="relative rounded-2xl card-elevated overflow-hidden animate-fade-up" style={{ animationDelay: '0.06s' }}>
            {/* Glow blob */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-500/12 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-500/8 rounded-full blur-2xl pointer-events-none" />

            <div className="relative p-6 space-y-6">
              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-end gap-2 leading-none">
                  <span className="text-[64px] font-black tracking-[-0.04em] leading-none text-gradient-violet">$8</span>
                  <span className="text-white/28 text-[18px] font-normal pb-3">/month</span>
                </div>
                <p className="text-[12px] text-white/28">Billed monthly · Cancel in two clicks</p>
              </div>

              {/* Feature list */}
              <div className="space-y-3">
                {FEATURES.map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-violet-500/18 border border-violet-500/35 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[13px] text-white/65">{f.label}</span>
                    {f.note && (
                      <span className="text-[10px] text-white/25 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-md font-medium">
                        {f.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting to Stripe…
                  </span>
                ) : 'Upgrade to Pro →'}
              </button>
            </div>
          </div>

          {/* Comparison */}
          <div className="card-glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <div className="grid grid-cols-3 text-center border-b border-white/[0.06]">
              <div className="py-3 text-[10px] text-white/28 font-semibold uppercase tracking-widest">Feature</div>
              <div className="py-3 text-[10px] text-white/28 font-semibold uppercase tracking-widest border-l border-white/[0.05]">Free</div>
              <div className="py-3 text-[10px] text-violet-400/70 font-semibold uppercase tracking-widest border-l border-white/[0.05]">Pro</div>
            </div>
            {[
              { label: 'Subscriptions', free: 'Up to 4', pro: 'Unlimited' },
              { label: 'Idle alerts', free: '✓', pro: '✓' },
              { label: 'Share stack', free: '✓', pro: '✓' },
              { label: 'Renewal reminders', free: '—', pro: '✓' },
              { label: 'Data export', free: '—', pro: '✓' },
            ].map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 text-center ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                <div className="py-3 px-2 text-[12px] text-white/40 text-left px-4">{row.label}</div>
                <div className="py-3 text-[12px] text-white/30 border-l border-white/[0.05]">{row.free}</div>
                <div className={`py-3 text-[12px] border-l border-white/[0.05] font-medium ${
                  row.pro === '✓' || row.pro === 'Unlimited' ? 'text-violet-400' : 'text-white/30'
                }`}>{row.pro}</div>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div className="text-center space-y-1.5 animate-fade-up" style={{ animationDelay: '0.16s' }}>
            <p className="text-[12px] text-white/22">No annual lock-in. No hidden fees. No upsells.</p>
            <p className="text-[11px] text-white/14">
              To cancel: Settings → Billing → Cancel. Takes 10 seconds.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
