'use client';

import { useState } from 'react';
import { saveUser } from '@/app/lib/storage';
import { OrbitUser } from '@/app/lib/types';

function OrbitMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <ellipse cx="11" cy="11" rx="9.5" ry="5" stroke="#8b5cf6" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.65"/>
      <circle cx="11" cy="11" r="3.2" fill="#a78bfa"/>
      <circle cx="19.6" cy="7.6" r="1.5" fill="#c4b5fd" opacity="0.9"/>
    </svg>
  );
}

function Check() {
  return (
    <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface Props {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    const user: OrbitUser = { email: trimmed, plan: 'free', signedInAt: new Date().toISOString() };
    setTimeout(() => { saveUser(user); setLoading(false); onSignIn(); }, 600);
  }

  return (
    <div className="min-h-screen bg-orbit text-white flex flex-col">
      {/* Nav */}
      <nav className="px-6 pt-6 pb-0">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <OrbitMark size={20} />
          <span className="text-[15px] font-semibold tracking-tight text-gradient-violet">Orbit</span>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px] space-y-9">

          {/* Badge */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-soft" />
              <span className="text-violet-300 text-[11px] font-medium tracking-wide">Free to get started</span>
            </div>
          </div>

          {/* Hero */}
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h1 className="text-[2.8rem] font-black tracking-[-0.035em] leading-[1.04] text-gradient">
              See everything<br />you pay for.
            </h1>
            <p className="text-[15px] text-white/42 leading-relaxed max-w-[300px]">
              Every AI subscription, in one place. Spot what you don't use. Stop paying for it.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 rounded-xl input-glass text-[14px] text-white"
                autoComplete="email"
                autoFocus
              />
              {error && <p className="text-red-400 text-[12px] px-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Getting started…
                </span>
              ) : 'Get started free →'}
            </button>
          </form>

          {/* Features */}
          <div className="space-y-3.5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            {[
              'See your total AI spend at a glance',
              'Flag idle tools draining your budget',
              'Data stays on your device — always private',
              'Free for 4 tools · Pro unlocks unlimited',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="mt-[3px] w-4 h-4 rounded-full border border-violet-500/35 bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Check />
                </div>
                <span className="text-[13px] text-white/38 leading-relaxed">{f}</span>
              </div>
            ))}
          </div>

          {/* Trust */}
          <p className="text-[11px] text-white/18 text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
            No credit card required · Cancel anytime · No upsells
          </p>
        </div>
      </main>
    </div>
  );
}
