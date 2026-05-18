import type { Metadata } from "next";
import VocabSwipeTrainer from "@/components/vocab/VocabSwipeTrainer";

export const metadata: Metadata = { title: "Vocab Swipe | AMIRNET" };

export default function VocabSwipePage() {
  return <VocabSwipeTrainer />;
}
