import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Terms of Use</h1>
      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
        <p>AMIRNET Trainer is an independent study tool. It is not affiliated with NITE or any official examination authority.</p>
        <p>All questions and vocabulary are original or user-contributed. No official NITE questions are reproduced. All content is for educational and practice purposes only.</p>
        <p>Scores, simulations, and predictions are unofficial. They are intended for self-assessment only and should not be used as indicators of official exam performance.</p>
        <p>The vocabulary deck is based on user-provided study material and original enrichment. It is not an official NITE word list.</p>
        <p>By using this tool, you agree to use it for personal, non-commercial study purposes only.</p>
      </div>
    </div>
  );
}
