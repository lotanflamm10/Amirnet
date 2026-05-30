"use client";
/**
 * Centralized Lucide icon wrappers for the app.
 *
 * All icon sizing is done via the `size` prop (default 18).
 * Color defaults to "currentColor" so it inherits from the parent text color.
 *
 * PlanIcon maps DailyPlanItem.icon string keys → Lucide component.
 * AchievementIcon maps Achievement.icon string keys → Lucide component.
 */
import {
  LayoutDashboard,
  PenLine,
  MonitorPlay,
  BookOpen,
  RotateCcw,
  Zap,
  Tag,
  User,
  ShieldCheck,
  Lightbulb,
  Sun,
  Moon,
  Monitor,
  Globe,
  Flame,
  Target,
  BarChart2,
  BookMarked,
  Headphones,
  FileText,
  Repeat2,
  Link2,
  GraduationCap,
  Brain,
  CheckCircle2,
  Award,
  Activity,
  TrendingUp,
  CircleDot,
  Settings,
  Languages,
  HelpCircle,
  Library,
  MessagesSquare,
  ChevronDown,
  Inbox,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

// ─── Shared icon type ─────────────────────────────────────────────────────────
type LucideIcon = ComponentType<LucideProps>;

// ─── Navigation icons ─────────────────────────────────────────────────────────
export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard:      LayoutDashboard,
  practice:       PenLine,
  simulation:     MonitorPlay,
  vocab:          BookOpen,
  review:         RotateCcw,
  challenge:      Zap,
  pricing:        Tag,
  account:        User,
  admin:          ShieldCheck,
  learningEngine: Lightbulb,
  settings:       Settings,
};

// ─── Theme icons ──────────────────────────────────────────────────────────────
export const ThemeIcon = { dark: Moon, light: Sun, system: Monitor };
export { Sun, Moon, Monitor, Globe, Flame, Target, BarChart2, CheckCircle2, Award, Activity, TrendingUp, CircleDot, Settings, Languages, Lightbulb, HelpCircle, BookOpen, Library, MessagesSquare, ChevronDown, Inbox };

// ─── Plan item icons (keyed by DailyPlanItem.icon string) ────────────────────
const PLAN_ICON_MAP: Record<string, LucideIcon> = {
  vocab:                BookOpen,
  sentenceCompletion:   PenLine,
  restatements:         Repeat2,
  grammar:              FileText,
  wordFormation:        BookMarked,
  reading:              BookOpen,
  lectureQuestions:     Headphones,
  textCompletion:       FileText,
  mixed:                Zap,
  review:               RotateCcw,
  vocabularyInContext:   BookMarked,
  restatementMini:      Repeat2,
  connectorPractice:    Link2,
  synonymRecognition:   Repeat2,
  academicPhrase:       GraduationCap,
  sentenceLogic:        Brain,
  booster:              Activity,
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export function PlanIcon({ name, size = 16, className, color }: IconProps) {
  const Icon = PLAN_ICON_MAP[name] ?? CircleDot;
  return <Icon size={size} className={className} color={color} strokeWidth={2} />;
}

// ─── Achievement icons (keyed by Achievement.icon string) ─────────────────────
const ACHIEVEMENT_ICON_MAP: Record<string, LucideIcon> = {
  diagnostic:         Activity,
  streak_3:           Flame,
  streak_7:           Flame,
  questions_100:      CheckCircle2,
  questions_500:      TrendingUp,
  vocab_100:          BookOpen,
  simulation:         MonitorPlay,
  first_day:          Target,
  restatement_master: Repeat2,
  grammar_master:     FileText,
};

export function AchievementIcon({ name, size = 16, className, color }: IconProps) {
  const Icon = ACHIEVEMENT_ICON_MAP[name] ?? Award;
  return <Icon size={size} className={className} color={color} strokeWidth={2} />;
}

// ─── Generic nav icon component ───────────────────────────────────────────────
export function NavIcon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const Icon = NAV_ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} color={color ?? "currentColor"} strokeWidth={2} />;
}
