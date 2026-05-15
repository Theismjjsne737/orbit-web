'use client';

import { useState } from 'react';
import { saveUser } from '@/app/lib/storage';
import { OrbitUser } from '@/app/lib/types';

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

    const user: OrbitUser = {
      email: trimmed,
      plan: 'free',
      signedInAt: new Date().toISOString(),
    };

    setTimeout(() => {
      saveUser(user);
      setLoading(false);
      onSignIn();
    }, 600);
  }

  return (
    <div className="min-h-screen bg-orbit text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <span className="text-lg font-bold tracking-tight text-gradient-violet">Orbit</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm space-y-8">

          {/* Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Free to get started
            </span>
          </div>

          {/* Headline */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-gradient leading-tight">
              Track your AI spend.<br />Cut what you don't use.
            </h1>
            <p className="text-white/40 text-sm leading-relaxed">
              The #1 subscription tracker for AI tools — see everything you're paying for in one place.
            </p>
          </div>

          {/* Sign-in form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/7 transition-all"
                autoComplete="email"
                autoFocus
              />
              {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-violet-600 to-purple-600 btn-glow hover:from-violet-500 hover:to-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Getting started...
                </span>
              ) : 'Get started free →'}
            </button>
          </form>

          {/* Feature list */}
          <div className="space-y-2.5 pt-2">
            {[
              { icon: '📊', text: 'See your total AI spend at a glance' },
              { icon: '⚠️', text: 'Catch idle tools draining your budget' },
              { icon: '✂️', text: 'Easy one-tap cancellation reminders' },
              { icon: '🔒', text: 'Private — your data stays on your device' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-white/40">
                <span className="text-base">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing note */}
          <div className="pt-2 border-t border-white/[0.06] text-center">
            <p className="text-white/25 text-xs">
              Free for up to 4 subscriptions · Pro plan unlocks unlimited
            </p>
            <p className="text-white/15 text-xs mt-1">
              Cancel anytime. No tricks. No upsells.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
