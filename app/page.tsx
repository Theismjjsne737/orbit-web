'use client';

import { useEffect, useState } from 'react';
import { OrbitData, OrbitUser } from '@/app/lib/types';
import { loadData, loadUser, saveUser } from '@/app/lib/storage';
import SignIn from '@/app/components/SignIn';
import Onboarding from '@/app/components/Onboarding';
import Dashboard from '@/app/components/Dashboard';
import Upgrade from '@/app/components/Upgrade';

type View = 'loading' | 'signin' | 'onboarding' | 'dashboard' | 'upgrade';

export default function Home() {
  const [data, setData] = useState<OrbitData | null>(null);
  const [user, setUser] = useState<OrbitUser | null>(null);
  const [view, setView] = useState<View>('loading');

  function refresh() {
    const d = loadData();
    const u = loadUser();
    setData(d);
    setUser(u);
    if (!u) { setView('signin'); return; }
    if (!d.onboardingComplete) { setView('onboarding'); return; }
    setView('dashboard');
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      // Stripe returned after successful payment — verify and upgrade
      window.history.replaceState({}, '', '/');
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(({ email, plan }) => {
          if (plan === 'pro' && email) {
            const existing = loadUser();
            saveUser({ email, plan: 'pro', signedInAt: existing?.signedInAt ?? new Date().toISOString() });
          }
          refresh();
        })
        .catch(() => refresh());
      return;
    }

    refresh();
  }, []);

  if (view === 'loading') {
    return <div className="min-h-screen bg-[#060608]" />;
  }

  if (view === 'signin') {
    return (
      <SignIn
        onSignIn={() => refresh()}
      />
    );
  }

  if (view === 'onboarding' && user) {
    return (
      <Onboarding
        user={user}
        onComplete={() => refresh()}
        onUpgrade={() => setView('upgrade')}
      />
    );
  }

  if (view === 'upgrade' && user) {
    return (
      <Upgrade
        user={user}
        onUpgrade={() => refresh()}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'dashboard' && data && user) {
    return (
      <Dashboard
        data={data}
        user={user}
        onReset={() => refresh()}
        onUpdate={(updated) => setData(updated)}
        onUpgrade={() => setView('upgrade')}
      />
    );
  }

  return null;
}
