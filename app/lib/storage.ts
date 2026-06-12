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

function migrateData(data: OrbitData): OrbitData {
  return {
    ...data,
    subscriptions: (Array.isArray(data.subscriptions) ? data.subscriptions : []).map(s => ({
      ...s,
      renewsOn: s.renewsOn !== undefined ? s.renewsOn : null,
    })),
  };
}

export function loadData(): OrbitData {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData;
    const parsed: OrbitData = { ...defaultData, ...JSON.parse(raw) };
    return migrateData(parsed);
  } catch (err) {
    console.error('Failed to load data from localStorage:', err);
    return defaultData;
  }
}

export function saveData(data: OrbitData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
    throw err;
  }
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
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
    throw err;
  }
  const data = loadData();
  saveData({ ...data, user });
}

export function loadUser(): OrbitUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrbitUser;
  } catch (err) {
    console.error('Failed to load user from localStorage:', err);
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

export function updateSubscriptionPrice(toolId: string, price: number): void {
  const data = loadData();
  const subscriptions = data.subscriptions.map(s =>
    s.toolId === toolId ? { ...s, monthlyPrice: price } : s
  );
  saveData({ ...data, subscriptions });
}

export function addSubscription(sub: UserSubscription): void {
  const data = loadData();
  saveData({ ...data, subscriptions: [...data.subscriptions, sub] });
}

export function getTotalMonthlySpend(data: OrbitData): number {
  return data.subscriptions.reduce((sum, s) => sum + s.monthlyPrice, 0);
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function exportJSON(data: OrbitData): void {
  const filename = `orbit-export-${new Date().toISOString().split('T')[0]}.json`;
  triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function exportCSV(data: OrbitData, toolNameMap: Record<string, string>): void {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows: string[][] = [
    ['Tool', 'Monthly Price', 'Yearly Price', 'Added At', 'Last Used', 'Renews On'],
    ...data.subscriptions.map(s => [
      toolNameMap[s.toolId] ?? s.toolId,
      String(s.monthlyPrice),
      String(s.monthlyPrice * 12),
      s.addedAt,
      s.lastUsed ?? '',
      s.renewsOn ?? '',
    ]),
  ];
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const filename = `orbit-export-${new Date().toISOString().split('T')[0]}.csv`;
  triggerDownload(csv, filename, 'text/csv');
}

export function getIdleTools(data: OrbitData, thresholdDays = 30): UserSubscription[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);
  return data.subscriptions.filter(s => {
    if (!s.lastUsed) return true;
    return new Date(s.lastUsed) < cutoff;
  });
}
