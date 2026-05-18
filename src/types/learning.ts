export type LearningCategory =
  | "sentence_completion"
  | "restatements"
  | "reading"
  | "vocabulary"
  | "connectors"
  | "listening"
  | "grammar"
  | "word_formation"
  | "writing"
  | "time_management"
  | "exam_interface"
  | "test_day"
  | "general";

export type LearningDifficulty = "beginner" | "intermediate" | "advanced";

export type LearningVisualType = "text" | "connector_compare" | "checklist" | "video_style";

export interface LearningTip {
  id: string;
  title: string;
  category: LearningCategory;
  difficulty: LearningDifficulty;
  shortText: string;
  example?: {
    title?: string;
    content: string;
    explanation?: string;
  };
  action?: {
    label: string;
    route: string;
  };
  visualType: LearningVisualType;
  tags?: string[];
  media?: {
    type: "image" | "video" | "audio";
    src: string;
    alt?: string;
  };
}

export const CATEGORY_LABELS: Record<LearningCategory, string> = {
  sentence_completion: "השלמת משפטים",
  restatements: "ניסוח מחדש",
  reading: "קריאה",
  vocabulary: "אוצר מילים",
  connectors: "מילות קישור",
  listening: "האזנה",
  grammar: "דקדוק",
  word_formation: "יצירת מילה",
  writing: "כתיבה",
  time_management: "ניהול זמן",
  exam_interface: "ממשק המבחן",
  test_day: "יום המבחן",
  general: "כללי",
};

export const DIFFICULTY_LABELS: Record<LearningDifficulty, string> = {
  beginner: "מתחיל",
  intermediate: "בינוני",
  advanced: "מתקדם",
};

export const CATEGORY_EMOJIS: Record<LearningCategory, string> = {
  sentence_completion: "✏️",
  restatements: "🔄",
  reading: "📖",
  vocabulary: "💬",
  connectors: "🔗",
  listening: "🎙️",
  grammar: "🔤",
  word_formation: "🔧",
  writing: "✍️",
  time_management: "⏱️",
  exam_interface: "🖥️",
  test_day: "📋",
  general: "💡",
};
