import type { Metadata } from "next";
import { LearningEngine } from "@/components/learning-engine/LearningEngine";

export const metadata: Metadata = {
  title: "מנוע למידה | AMIRNET",
  description: "למד אסטרטגיות מבחן אמירנט — טיפ אחד בכל פעם",
};

export default function LearningEnginePage() {
  return <LearningEngine />;
}
