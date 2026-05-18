"use client";

const STORAGE_KEY = "amirnet-credits-v1";

interface CreditEntry {
  delta: number;
  reason: string;
  occurredAt: string;
}

interface CreditStore {
  balance: number;
  history: CreditEntry[];
}

function loadStore(): CreditStore {
  if (typeof window === "undefined") return { balance: 0, history: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { balance: 0, history: [] };
    return { balance: 0, history: [], ...JSON.parse(raw) as Partial<CreditStore> };
  } catch {
    return { balance: 0, history: [] };
  }
}

function saveStore(store: CreditStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function getCredits(): number {
  return loadStore().balance;
}

export function addCredits(amount: number, reason: string): void {
  const store = loadStore();
  store.balance = Math.max(0, store.balance + amount);
  store.history.unshift({
    delta: amount,
    reason,
    occurredAt: new Date().toISOString(),
  });
  // Keep last 100 entries
  if (store.history.length > 100) store.history.splice(100);
  saveStore(store);
}

export function consumeCredit(): boolean {
  const store = loadStore();
  if (store.balance <= 0) return false;
  store.balance -= 1;
  store.history.unshift({
    delta: -1,
    reason: "Consumed",
    occurredAt: new Date().toISOString(),
  });
  if (store.history.length > 100) store.history.splice(100);
  saveStore(store);
  return true;
}

export function getCreditHistory(): CreditEntry[] {
  return loadStore().history;
}
