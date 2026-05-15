import { OrbitData, OrbitUser, UserSubscription, Goal } from './types';

const KEY = 'orbit-data';
const USER_KEY = 'orbit-user';

const defaultData: OrbitData = {
  goal: null,
  subscriptions: [],
  onboardingComplete: false,
  user: null,
  customTools: [],
};

export function loadData(): OrbitData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData;
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return defaultData;
  }
}

export function saveData(data: OrbitData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function setGoal(goal: Goal): void {
  const data = loadData();
  saveData({ ...data, goal });
}

export function setSubscriptions(subscriptions: UserSubscription[]): void {
  const data = loadData();
  saveData({ ...data, subscriptions });
}

export function completeOnboarding(): void {
  const data = loadData();
  saveData({ ...data, onboardingComplete: true });
}

export function markToolUsed(toolId: string): void {
  const data = loadData();
  const subscriptions = data.subscriptions.map(s =>
    s.toolId === toolId ? { ...s, lastUsed: new Date().toISOString() } : s
  );
  saveData({ ...data, subscriptions });
}

export function resetData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveUser(user: OrbitUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const data = loadData();
  saveData({ ...data, user });
}

export function loadUser(): OrbitUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrbitUser;
  } catch {
    return null;
  }
}

export function signOut(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

export function upgradeToPro(email: string): void {
  const user: OrbitUser = {
    email,
    plan: 'pro',
    signedInAt: new Date().toISOString(),
  };
  saveUser(user);
}

export function getTotalMonthlySpend(data: OrbitData): number {
  return data.subscriptions.reduce((sum, s) => sum + s.monthlyPrice, 0);
}

export function getIdleTools(data: OrbitData, thresholdDays = 30): UserSubscription[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);
  return data.subscriptions.filter(s => {
    if (!s.lastUsed) return true;
    return new Date(s.lastUsed) < cutoff;
  });
}
