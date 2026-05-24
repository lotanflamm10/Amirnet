"use client";

import type { PlanId } from "@/lib/billing/types";
import { loadProgress } from "@/lib/progress/local-progress-store";
import { getPlanActivatedAt } from "@/lib/billing/mock-activate-plan";

export type QuotaPeriod = "month" | "pack" | "none";

export interface SimulationQuota {
  limit: number | null;
  periodLabel: QuotaPeriod;
}

const PACK_WINDOW_DAYS = 60;

export function getSimulationQuota(planId: PlanId): SimulationQuota {
  switch (planId) {
    case "guest":         return { limit: 0,    periodLabel: "none" };
    case "free":          return { limit: 2,    periodLabel: "month" };
    case "sim-pack":      return { limit: 3,    periodLabel: "pack" };
    case "pro":
    case "pro-3month":
    case "lifetime":
    case "admin":         return { limit: null, periodLabel: "none" };
  }
}

function startOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function endOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function getUsedThisPeriod(planId: PlanId, now: Date = new Date()): number {
  const quota = getSimulationQuota(planId);
  if (quota.periodLabel === "none") return 0;

  const history = loadProgress().simulationHistory ?? [];
  const counted = history.filter(
    (h) => h.status === "completed" || h.status === "abandoned" || h.status === undefined
  );

  if (quota.periodLabel === "month") {
    const lo = startOfMonth(now);
    const hi = endOfMonth(now);
    return counted.filter((h) => {
      const t = parseTime(h.completedAt);
      return t !== null && t >= lo && t < hi;
    }).length;
  }

  // pack: [activatedAt, activatedAt + PACK_WINDOW_DAYS)
  const activatedAt = parseTime(getPlanActivatedAt());
  if (activatedAt === null) return 0;
  const hi = activatedAt + PACK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return counted.filter((h) => {
    const t = parseTime(h.completedAt);
    return t !== null && t >= activatedAt && t < hi;
  }).length;
}

export function getRemainingSimulations(planId: PlanId, now: Date = new Date()): number | null {
  const quota = getSimulationQuota(planId);
  if (quota.limit === null) return null;
  const used = getUsedThisPeriod(planId, now);
  return Math.max(0, quota.limit - used);
}

export function canStartSimulation(planId: PlanId, now: Date = new Date()): boolean {
  const remaining = getRemainingSimulations(planId, now);
  if (remaining === null) return true;
  return remaining > 0;
}
