'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { OrbitData, OrbitUser } from '@/app/lib/types';
import { loadData, loadUser, saveUser } from '@/app/lib/storage';
import SignIn from '@/app/components/SignIn';
import Onboarding from '@/app/components/Onboarding';
import Dashboard from '@/app/components/Dashboard';
import Upgrade from '@/app/components/Upgrade';

type View = 'loading' | 'signin' | 'onboarding' | 'dashboard' | 'upgrade';

export default function Home() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<OrbitData | null>(null);
  const [user, setUser] = useState<OrbitUser | null>(null);
  const [view, setView] = useState<View>('loading');
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  function refresh() {
    const d = loadData();
    const u = loadUser();
    setData(d);
    setUser(u);
    if (!u) { setView('signin'); return; }
    if (!d.onboardingComplete) { setView('onboarding'); return; }
    setView('dashboard');
  }

  // Prevent infinite loading if NextAuth never resolves
  useEffect(() => {
    const id = setTimeout(() => {
      if (view === 'loading') setView('signin');
    }, 8000);
    return () => clearTimeout(id);
  }, [view]);

  useEffect(() => {
    // Wait for NextAuth session to resolve before doing anything
    if (status === 'loading') return;

    // If signed in via OAuth and no local user yet, create one from OAuth data
    if (session?.user?.email) {
      const existing = loadUser();
      if (!existing) {
        const oauthUser: OrbitUser = {
          email: session.user.email,
          plan: 'free',
          signedInAt: new Date().toISOString(),
        };
        saveUser(oauthUser);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      window.history.replaceState({}, '', '/');
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(r => {
          if (!r.ok) { console.error('Upgrade verify returned', r.status); refresh(); return; }
          return r.json();
        })
        .then(result => {
          if (!result) return;
          const { email, plan } = result as { email?: string; plan?: string };
          if (plan === 'pro' && email) {
            const existing = loadUser();
            saveUser({ email, plan: 'pro', signedInAt: existing?.signedInAt ?? new Date().toISOString() });
          }
          refresh();
        })
        .catch((err) => {
          console.error('Upgrade verification failed:', err);
          setUpgradeError('Upgrade verification failed. Please contact support if your payment was charged.');
          refresh();
        });
      return;
    }

    refresh();
  }, [session, status]);

  if (view === 'loading') {
    return <div className="min-h-screen bg-[#040407]" />;
  }

  if (view === 'signin') {
    return <SignIn onSignIn={refresh} />;
  }

  if (view === 'onboarding' && user) {
    return (
      <Onboarding
        user={user}
        onComplete={refresh}
        onUpgrade={() => setView('upgrade')}
      />
    );
  }

  if (view === 'upgrade' && user) {
    return (
      <Upgrade
        user={user}
        onUpgrade={refresh}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'dashboard' && data && user) {
    return (
      <>
        {upgradeError && (
          <div className="fixed top-0 inset-x-0 z-50 bg-red-900/90 text-red-100 text-[13px] px-4 py-3 flex items-center justify-between">
            <span>{upgradeError}</span>
            <button onClick={() => setUpgradeError(null)} className="ml-4 text-red-200 hover:text-white font-bold">✕</button>
          </div>
        )}
        <Dashboard
          data={data}
          user={user}
          onReset={refresh}
          onUpdate={setData}
          onUpgrade={() => setView('upgrade')}
        />
      </>
    );
  }

  // view/data mismatch — show sign-in as recovery
  return <SignIn onSignIn={refresh} />;
}
