import ChallengeSession from "@/components/challenge/ChallengeSession";

export const metadata = { title: "Challenge | AMIRNET Trainer" };

export default function ChallengePage() {
  return (
    <main className="px-4 py-6" style={{ maxWidth: 680, margin: "0 auto" }}>
      <ChallengeSession />
    </main>
  );
}
