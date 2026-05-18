"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/simulation", label: "Simulation" },
  { href: "/vocab", label: "Vocab" },
  { href: "/review", label: "Review" },
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
];

const ADMIN_ITEMS = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/vocab", label: "Vocab Admin" },
  { href: "/admin/questions", label: "Question Admin" },
];

const IS_MOCK_ADMIN = true;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-blue-600 text-white"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {label}
        </Link>
      ))}
      {IS_MOCK_ADMIN && (
        <>
          <span className="mx-1 text-slate-300 dark:text-slate-700 select-none">|</span>
          {ADMIN_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-orange-500 text-white"
                  : "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
              )}
            >
              {label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
