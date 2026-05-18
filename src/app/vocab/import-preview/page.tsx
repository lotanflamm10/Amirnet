import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vocab Import Preview" };

export default function VocabImportPreviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Vocab Import Preview</h1>
      <p className="text-xs text-slate-400">
        This vocabulary deck is based on user-provided study material and original enrichment. It is not an official NITE word list.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-400">
        Import report viewer — Milestone 4.
      </div>
    </div>
  );
}
