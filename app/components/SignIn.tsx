'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { saveUser } from '@/app/lib/storage';
import { FREE_LIMIT, OrbitUser } from '@/app/lib/types';
import { OrbitWordmark } from '@/app/components/OrbitLogo';
import AnimatedBackground from '@/app/components/AnimatedBackground';

interface Props {
  onSignIn: () => void;
}

/* ── Icons ──────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.29.07 2.18.74 2.93.8.93-.19 1.82-.91 3.21-.87 1.62.06 2.82.84 3.53 2.14-3.27 2.06-2.49 6.21.49 7.46-.61 1.58-1.37 3.09-2.16 3.33zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}


function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────── */

export default function SignIn({ onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const anyLoading = emailLoading || googleLoading || appleLoading;

  function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setEmailLoading(true);
    setError('');
    const user: OrbitUser = { email: trimmed, plan: 'free', signedInAt: new Date().toISOString() };
    setTimeout(() => { saveUser(user); setEmailLoading(false); onSignIn(); }, 600);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError('Sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signIn('apple', { callbackUrl: '/' });
    } catch (err) {
      console.error('Apple sign-in failed:', err);
      setError('Sign-in failed. Please try again.');
      setAppleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen text-white flex flex-col overflow-hidden">
      <AnimatedBackground />

      {/* Nav */}
      <nav className="relative z-10 px-6 pt-6">
        <div className="max-w-2xl mx-auto">
          <OrbitWordmark size="sm" />
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px] flex flex-col items-center gap-8">

          {/* Wordmark + tagline */}
          <div className="text-center animate-fade-up">
            <OrbitWordmark size="hero" animated />
            <p
              className="mt-5 text-[22px] sm:text-[26px] font-bold leading-tight text-gradient-hero max-w-[320px] mx-auto"
              style={{ animationDelay: '0.08s' }}
            >
              Track every AI subscription.<br />Cancel what you don&apos;t use.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="w-full space-y-2.5 animate-fade-up" style={{ animationDelay: '0.14s' }}>
            {[
              { icon: '⚡', text: 'See your real monthly AI spend at a glance' },
              { icon: '🎯', text: 'Spot idle tools before they drain your budget' },
              { icon: '🔒', text: 'Private — your data never leaves your device' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-[16px] shrink-0">{icon}</span>
                <span className="text-[13px] text-white/42 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {/* OAuth buttons */}
          <div className="w-full space-y-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-[14px] text-white btn-glow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? <Spinner /> : <GoogleIcon />}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {/* Apple */}
            <button
              onClick={handleApple}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-[14px] text-white btn-glow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {appleLoading ? <Spinner /> : <AppleIcon />}
              {appleLoading ? 'Redirecting…' : 'Continue with Apple'}
            </button>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 animate-fade-up" style={{ animationDelay: '0.26s' }}>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[12px] text-white/25 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Email form */}
          <form
            onSubmit={handleEmail}
            className="w-full space-y-3 animate-fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 rounded-xl input-glass text-[14px] text-white"
                autoComplete="email"
                disabled={anyLoading}
              />
              {error && <p className="text-red-400 text-[12px] px-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={anyLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {emailLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Getting started…
                </span>
              ) : 'Get started free →'}
            </button>
          </form>

          <p className="text-[11px] text-white/18 text-center animate-fade-up" style={{ animationDelay: '0.34s' }}>
            No credit card required · Free forever for up to {FREE_LIMIT} tools

          </p>
        </div>
      </main>
    </div>
  );
}
