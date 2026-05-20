"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUserId, migrateLegacyToUserOnce } from "@/lib/storage/user-storage";

export interface ActiveUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "student";
}

interface UserContextValue {
  user: ActiveUser | null;
  /** True while the initial /api/me fetch is in flight. */
  loading: boolean;
  /** Force a refresh of the cached active user. */
  refresh: () => Promise<void>;
  /** POST /api/logout, then clear in-memory state. Does not erase progress. */
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * Provides the active user object to client components.
 *
 * Hydration flow:
 *   1. On mount, read the synchronous `amirnet-user` cookie. If present,
 *      run the legacy-storage migration for admin (idempotent).
 *   2. Asynchronously fetch /api/me to get the verified display name + role.
 *   3. If /api/me returns 401, treat as logged out (provider returns null).
 *
 * Pages already protected by the middleware should never see `user === null`
 * after `loading === false` unless the server cookie was cleared.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ActiveUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/me", { method: "GET", credentials: "same-origin", cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { ok: boolean; user: ActiveUser | null };
      setUser(data.user);
      if (data.user?.id) {
        migrateLegacyToUserOnce(data.user.id);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync hint from cookie so storage keys are correct immediately.
    const cookieUid = getCurrentUserId();
    if (cookieUid) migrateLegacyToUserOnce(cookieUid);
    void refresh();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin", cache: "no-store" });
    } catch {
      /* network — fall through and redirect anyway */
    }
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, refresh, logout }}>{children}</UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      refresh: async () => {},
      logout: async () => {},
    };
  }
  return ctx;
}
