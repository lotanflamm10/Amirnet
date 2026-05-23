"use client";
import { useEffect, useState, useCallback } from "react";
import { userKey, safeGetItem, safeSetItem } from "@/lib/storage/user-storage";

const LEGACY_PREFS_KEY = "amirnet-practice-prefs-v1";
const prefsK = () => userKey(LEGACY_PREFS_KEY);

export interface PracticePrefs {
  /** Auto-expand the "Word translations" panel in the post-answer explanation. */
  autoGlossaryInExplanation: boolean;
}

const DEFAULT_PREFS: PracticePrefs = {
  autoGlossaryInExplanation: false,
};

function loadPrefs(): PracticePrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  const raw = safeGetItem(prefsK());
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<PracticePrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs: PracticePrefs): void {
  safeSetItem(prefsK(), JSON.stringify(prefs));
}

/**
 * Hook for the practice prefs. Reads from per-user namespaced localStorage
 * once on mount, then keeps the in-component state in sync. Caller-friendly
 * setter that persists immediately.
 */
export function usePracticePrefs() {
  const [prefs, setPrefs] = useState<PracticePrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<PracticePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  return { prefs, update, ready };
}
