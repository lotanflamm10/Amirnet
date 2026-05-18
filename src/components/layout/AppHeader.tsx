import Link from "next/link";
import { MainNav } from "./MainNav";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-blue-600 dark:text-blue-400 shrink-0">
          AMIRNET Trainer
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
