import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full">Mock Admin</span>
        <h1 className="text-2xl font-bold mt-2">Admin Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: "/admin/vocab", label: "Vocab Admin", desc: "Review, edit, and enrich vocabulary items." },
          { href: "/admin/questions", label: "Question Admin", desc: "Manage practice questions and explanations." },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href} className="rounded-xl border border-orange-200 dark:border-orange-900 p-5 hover:border-orange-400 transition-all">
            <h2 className="font-semibold text-orange-700 dark:text-orange-400 mb-1">{label}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
