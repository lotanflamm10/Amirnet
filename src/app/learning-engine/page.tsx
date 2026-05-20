import type { Metadata } from "next";
import { LearningEngine } from "@/components/learning-engine/LearningEngine";

export const metadata: Metadata = {
  title: "Learning Engine | AMIRNET",
  description: "Learn AMIRNET test strategies — one tip at a time",
};

export default function LearningEnginePage() {
  return <LearningEngine />;
}
