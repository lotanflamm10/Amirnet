import type { LearningTip } from "@/types/learning";

export const learningTips: LearningTip[] = [
  // ─── Sentence Completion ─────────────────────────────────────────
  {
    id: "tip-process-before-answers",
    title: "קודם מבינים, אחר כך מסתכלים על התשובות",
    category: "sentence_completion",
    difficulty: "beginner",
    shortText:
      "אל תקפוץ ישר לארבע התשובות. קרא את המשפט, עצור רגע, ונסה להבין איזה סוג משמעות חסר. רק אחר כך עבור לתשובות.",
    example: {
      title: "דוגמה",
      content:
        "Albert Einstein never became president of Israel ___ David Ben Gurion asked him to be president in 1952.",
      explanation:
        "יש כאן ניגוד: הוא לא היה נשיא למרות שביקשו ממנו. לכן נחפש מילת ניגוד כמו although.",
    },
    action: { label: "תרגל השלמת משפטים", route: "/practice/sentenceCompletion" },
    visualType: "text",
    tags: ["strategy", "sentence_completion"],
  },
  {
    id: "tip-predict-before-choosing",
    title: "נסה לנחש לפני שאתה בוחר",
    category: "sentence_completion",
    difficulty: "beginner",
    shortText:
      "לפני שמסתכלים על התשובות, נסה להמציא את המילה החסרה בעצמך. אם התשובה שלך מופיעה ברשימה — זו כנראה התשובה הנכונה.",
    example: {
      title: "דוגמה",
      content:
        "The discovery was so ___ that it changed everything we knew about biology.",
      explanation:
        "לפני הסתכלות על התשובות: 'משהו שמשנה הכל — כנראה significant או revolutionary'. חפש תשובה עם אותה משמעות.",
    },
    action: { label: "תרגל השלמת משפטים", route: "/practice/sentenceCompletion" },
    visualType: "text",
    tags: ["strategy", "prediction"],
  },
  {
    id: "tip-identify-part-of-speech",
    title: "זהה איזו חלק דיבור חסר",
    category: "sentence_completion",
    difficulty: "intermediate",
    shortText:
      "לפני שבוחרים תשובה, שאל את עצמך: מה המשפט צריך? שם עצם? פועל? תואר שם? תואר הפועל? זה מצמצם את האפשרויות מיד.",
    example: {
      title: "דוגמה",
      content: "The scientist's ___ approach led to a groundbreaking discovery.",
      explanation:
        "המשפט צריך תואר שם (adjective) שמתאר את ה-approach. אפשרויות כמו 'methodical', 'innovative' — לא פועל ולא שם עצם.",
    },
    action: { label: "תרגל השלמת משפטים", route: "/practice/sentenceCompletion" },
    visualType: "text",
    tags: ["grammar", "part-of-speech"],
  },

  // ─── Connectors ────────────────────────────────────────────────
  {
    id: "tip-connectors-overview",
    title: "מילות קישור = המפתח לפתרון שאלות",
    category: "connectors",
    difficulty: "beginner",
    shortText:
      "מילות קישור מגדירות את הקשר הלוגי בין חלקי המשפט. זיהוי נכון שלהן עוזר לפתור שאלות השלמת משפטים וניסוח מחדש.",
    example: {
      title: "4 סוגי קשרים עיקריים",
      content:
        "Cause: because / since / as / due to\nContrast: although / however / despite\nResult: therefore / consequently / thus\nAddition: moreover / furthermore / in addition",
      explanation: "כל קשר לוגי מכתיב איזו מילת קישור תתאים — ואיזו לא.",
    },
    visualType: "connector_compare",
    tags: ["connectors", "logic"],
  },
  {
    id: "tip-because-since-cause",
    title: "Because ו-Since = סיבה",
    category: "connectors",
    difficulty: "beginner",
    shortText:
      "כשאתה רואה because או since, המשמעות היא שחלק אחד במשפט מסביר את הסיבה לחלק השני. בניסוח מחדש: שמור על קשר סיבה-תוצאה.",
    example: {
      title: "השוואה",
      content:
        "He stayed home because he was sick.\n→ He stayed home since he was ill. ✓\n→ He stayed home although he was sick. ✗",
      explanation:
        "since ו-because הם מילים נרדפות (גם שתיהן = סיבה). although משנה את הקשר לניגוד — שגוי!",
    },
    action: { label: "תרגל ניסוח מחדש", route: "/practice/restatements" },
    visualType: "connector_compare",
    tags: ["cause", "connectors"],
  },
  {
    id: "tip-although-however-contrast",
    title: "Although ו-However = ניגוד",
    category: "connectors",
    difficulty: "beginner",
    shortText:
      "כשיש ניגוד בין שני חלקי המשפט, נשתמש במילות ניגוד. בניסוח מחדש — תשובה שמחליפה מילת ניגוד במילת סיבה נפסלת.",
    example: {
      title: "השוואה",
      content:
        "Although the koala is not a bear, it is often called one.\n→ While the koala is not a bear, it is often called one. ✓\n→ Because the koala is not a bear, it is often called one. ✗",
      explanation: "while ו-although שניהם = ניגוד. because הופך לסיבה — שינוי משמעות!",
    },
    action: { label: "תרגל ניסוח מחדש", route: "/practice/restatements" },
    visualType: "connector_compare",
    tags: ["contrast", "connectors"],
  },
  {
    id: "tip-therefore-result",
    title: "Therefore ו-Consequently = תוצאה",
    category: "connectors",
    difficulty: "beginner",
    shortText:
      "כשהמשפט מציג תוצאה של מצב קודם, תראה מילים כמו therefore, consequently, thus, as a result. שמור עליהן בניסוח מחדש.",
    example: {
      title: "דוגמה",
      content:
        "Hard work is often the result of success.\n→ Hard work is often the cause of success. ✓\n→ Hard work is often unrelated to success. ✗",
      explanation: "'result of' ו-'cause of' שניהם שומרים על קשר סיבה-תוצאה. המשמעות נשמרת.",
    },
    action: { label: "תרגל ניסוח מחדש", route: "/practice/restatements" },
    visualType: "connector_compare",
    tags: ["result", "connectors"],
  },
  {
    id: "tip-moreover-addition",
    title: "Moreover ו-Furthermore = הוספה",
    category: "connectors",
    difficulty: "beginner",
    shortText:
      "מילות הוספה מראות שהכותב מוסיף מידע על מה שנאמר. הן לא מציגות ניגוד — הן ממשיכות באותו כיוון.",
    example: {
      title: "דוגמה",
      content:
        "The new policy saves money. Moreover, it improves efficiency.\n= The new policy saves money. In addition, it improves efficiency. ✓",
      explanation: "moreover, furthermore, in addition, besides — כולם = הוספה. ניתן להחליף ביניהם.",
    },
    visualType: "text",
    tags: ["addition", "connectors"],
  },

  // ─── Restatements ─────────────────────────────────────────────
  {
    id: "tip-restatements-preserve-logic",
    title: "בניסוח מחדש — שמור על הקשר הלוגי",
    category: "restatements",
    difficulty: "beginner",
    shortText:
      "התשובה הנכונה בשאלת ניסוח מחדש חייבת לשמור על אותו קשר לוגי כמו המשפט המקורי: סיבה, ניגוד, תוצאה, השוואה. שינוי הקשר = פסילה.",
    example: {
      title: "שלבי הפתרון",
      content:
        "1. Read the sentence.\n2. Identify the main structure (connector / comparison / quantity).\n3. Eliminate answers that change that structure.\n4. Choose the one that preserves the meaning.",
      explanation: "אם מצאת מילת סיבה במקור — פסול כל תשובה שמחליפה אותה במילת ניגוד.",
    },
    action: { label: "תרגל ניסוח מחדש", route: "/practice/restatements" },
    visualType: "checklist",
    tags: ["restatements", "strategy"],
  },
  {
    id: "tip-restatements-no-new-info",
    title: "פסול תשובות שמוסיפות מידע חדש",
    category: "restatements",
    difficulty: "intermediate",
    shortText:
      "תשובה שמוסיפה עובדה שלא מוזכרת במשפט המקורי — נפסלת. גם אם זה נשמע הגיוני על בסיס ידע כללי, המשפט המקורי הוא הסמכות היחידה.",
    example: {
      title: "דוגמה",
      content:
        "If a food contains a lot of sugar, it is generally not healthy.\n→ If a food does not contain sugar, it is generally healthy. ✗",
      explanation:
        "המשפט המקורי מדבר על אוכל עם הרבה סוכר. התשובה מדברת על אוכל ללא סוכר — זה מידע חדש שלא קיים במקור.",
    },
    action: { label: "תרגל ניסוח מחדש", route: "/practice/restatements" },
    visualType: "text",
    tags: ["restatements", "elimination"],
  },

  // ─── Reading ──────────────────────────────────────────────────
  {
    id: "tip-reading-main-idea",
    title: "עיקר מול טפל — לא כל מילה שווה",
    category: "reading",
    difficulty: "beginner",
    shortText:
      "קטעי קריאה עמוסים במילים, אבל לא כולן חשובות. התמקד ברעיון המרכזי, במטרת הפסקה, ובמילות הקישור — לא בכל פרט.",
    example: {
      title: "טיפ מעשי",
      content:
        "Paragraph opening: 'However, recent studies suggest...'\n→ This paragraph probably introduces a contrast to what was said before.",
      explanation: "מילת הפתיחה של הפסקה — however, therefore, in addition — מגלה את כוונת הפסקה לפני שקראת אותה.",
    },
    action: { label: "תרגל קריאה", route: "/practice/reading" },
    visualType: "text",
    tags: ["reading", "strategy"],
  },
  {
    id: "tip-reading-strategic-questions",
    title: "קרא את השאלות לפני הקטע",
    category: "reading",
    difficulty: "intermediate",
    shortText:
      "לפני שקוראים את כל הקטע, קרא את השאלות. כך תדע מה לחפש, ותחסוך זמן בחיפוש מידע רלוונטי.",
    example: {
      title: "גישה מומלצת",
      content:
        "Step 1: Read all questions.\nStep 2: Scan the passage for relevant sections.\nStep 3: Answer each question from the passage.",
      explanation: "שאלות בנושא 'reading comprehension' מסודרות לפי סדר הפסקות — כשאלה 3 מתייחסת לפסקה 3.",
    },
    action: { label: "תרגל קריאה", route: "/practice/reading" },
    visualType: "checklist",
    tags: ["reading", "time"],
  },
  {
    id: "tip-reading-paragraph-openers",
    title: "פתיחת פסקה = מפתח להבנה",
    category: "reading",
    difficulty: "intermediate",
    shortText:
      "המשפט הראשון של כל פסקה בדרך כלל מסכם את הרעיון המרכזי שלה. קרא אותו תמיד — גם אם אתה מדלג על שאר הפסקה.",
    example: {
      title: "דוגמה",
      content:
        "First sentence: 'Critics argue that the policy has had unintended consequences.'\n→ The paragraph will list negative outcomes of the policy.",
      explanation: "כשאתה יודע את הרעיון המרכזי של הפסקה, קל יותר למצוא תשובות לשאלות ספציפיות.",
    },
    action: { label: "תרגל קריאה", route: "/practice/reading" },
    visualType: "text",
    tags: ["reading", "comprehension"],
  },
  {
    id: "tip-reading-skip-unknown-words",
    title: "אל תיתקע על כל מילה לא מוכרת",
    category: "reading",
    difficulty: "beginner",
    shortText:
      "בקטע קריאה יהיו מילים שלא תכיר. זה בסדר — אל תעצור. המשך לקרוא, ולרוב ההקשר יסביר את המשמעות.",
    example: {
      title: "דוגמה",
      content:
        "The scientists discovered a new species of bioluminescent organisms in the deep ocean.",
      explanation:
        "'bioluminescent' — אולי לא מכיר, אבל ההקשר מרמז שזה תכונה של יצורים. זה מספיק לענות על רוב השאלות.",
    },
    action: { label: "תרגל קריאה", route: "/practice/reading" },
    visualType: "text",
    tags: ["reading", "vocabulary"],
  },

  // ─── Vocabulary ────────────────────────────────────────────────
  {
    id: "tip-unknown-word",
    title: "מילה לא מוכרת לא עוצרת אותך",
    category: "vocabulary",
    difficulty: "intermediate",
    shortText:
      "במבחן יהיו מילים שלא תכיר. זה חלק מהעניין. השתמש בהקשר — הטון של המשפט, המילים שסביב — כדי לנחש את המשמעות.",
    example: {
      title: "דוגמה",
      content: "I was so famished I could eat a horse.",
      explanation:
        "גם בלי לדעת את famished, הביטוי 'could eat a horse' מרמז שמדובר ברעב מאוד. זה מספיק לבחור תשובה נכונה.",
    },
    action: { label: "תרגל אוצר מילים", route: "/vocab/swipe" },
    visualType: "text",
    tags: ["context", "vocabulary"],
  },
  {
    id: "tip-word-families",
    title: "למד משפחות מילים, לא מילים בודדות",
    category: "vocabulary",
    difficulty: "intermediate",
    shortText:
      "כשלומדים מילה חדשה, למד גם את הצורות הקשורות שלה: שם עצם, פועל, תואר שם, תואר פועל. כך מכסים יותר שאלות עם פחות שינון.",
    example: {
      title: "משפחת מילים",
      content:
        "Root: explain\n→ Noun: explanation\n→ Verb: explain\n→ Adjective: explanatory\n→ Adverb: (no standard form)",
      explanation: "שינון משפחת מילים מכין אותך לשאלות השלמת משפטים ויצירת מילה גם יחד.",
    },
    action: { label: "תרגל אוצר מילים", route: "/vocab/swipe" },
    visualType: "checklist",
    tags: ["vocabulary", "word_families"],
  },

  // ─── Word Formation ────────────────────────────────────────────
  {
    id: "tip-word-formation-pos",
    title: "מה המשפט צריך? שם עצם? פועל?",
    category: "word_formation",
    difficulty: "beginner",
    shortText:
      "לפני שמשנים את שורש המילה, שאל: איזה חלק דיבור המשפט צריך? שם עצם (noun), פועל (verb), תואר שם (adjective), או תואר פועל (adverb)?",
    example: {
      title: "דוגמה",
      content: "The ___ of the new policy surprised everyone. (BASE WORD: introduce)",
      explanation:
        "המשפט צריך שם עצם אחרי 'The'. הצורה הנכונה: introduction (לא introduce, לא introduced).",
    },
    action: { label: "תרגל יצירת מילה", route: "/practice/wordFormation" },
    visualType: "text",
    tags: ["word_formation", "grammar"],
  },
  {
    id: "tip-word-formation-root-only",
    title: "שנה רק את הסיומת — לא את השורש",
    category: "word_formation",
    difficulty: "beginner",
    shortText:
      "בשאלות יצירת מילה, שורש המילה נשאר. רק הסיומת (suffix) משתנה. הוסף -tion, -ment, -ness, -ly, -ful, -less לפי הצורך.",
    example: {
      title: "דוגמה",
      content:
        "BASE: happy\n→ Noun: happiness\n→ Adverb: happily\n→ Antonym adj: unhappy",
      explanation: "שים לב: גם קידומת (prefix) כמו un-, dis-, in- יכולה להשתנות — לא רק הסיומת.",
    },
    action: { label: "תרגל יצירת מילה", route: "/practice/wordFormation" },
    visualType: "checklist",
    tags: ["word_formation", "suffixes"],
  },
  {
    id: "tip-word-formation-agreement",
    title: "בדוק יחיד/רבים ונקביות",
    category: "word_formation",
    difficulty: "intermediate",
    shortText:
      "אחרי שבחרת את חלק הדיבור הנכון, ודא שהמילה מסכימה עם שאר המשפט: יחיד/רבים, גוף ראשון/שלישי, זמן המשפט.",
    example: {
      title: "דוגמה",
      content:
        "BASE: analyze → The team's ___ were thorough.\n→ analyses (plural noun) ✓\n→ analysis (singular) ✗ (were = plural verb)",
      explanation: "הפועל 'were' מרמז על רבים — לכן analyses ולא analysis.",
    },
    action: { label: "תרגל יצירת מילה", route: "/practice/wordFormation" },
    visualType: "text",
    tags: ["word_formation", "agreement"],
  },

  // ─── Grammar ──────────────────────────────────────────────────
  {
    id: "tip-grammar-subject-verb",
    title: "נושא הפועל קובע את הצורה",
    category: "grammar",
    difficulty: "intermediate",
    shortText:
      "ודא שהפועל מסכים עם הנושא — לא עם המילה הקרובה אליו. נושא ביחיד דורש פועל ביחיד; נושא ברבים דורש פועל ברבים.",
    example: {
      title: "דוגמה — מלכודת נפוצה",
      content:
        "The results of the experiment was surprising. ✗\nThe results of the experiment were surprising. ✓",
      explanation:
        "'Results' הוא הנושא האמיתי (ברבים) — לא 'experiment'. לכן הפועל חייב להיות 'were'.",
    },
    action: { label: "תרגל דקדוק", route: "/practice/grammar" },
    visualType: "text",
    tags: ["grammar", "subject_verb"],
  },
  {
    id: "tip-grammar-tense-clues",
    title: "רמזי זמן בסביבת המשפט",
    category: "grammar",
    difficulty: "intermediate",
    shortText:
      "המשפט עצמו נותן רמזים לזמן הפועל הנכון: yesterday, currently, by next year, since 2010. שים לב לרמזים אלו לפני בחירת הצורה.",
    example: {
      title: "דוגמה",
      content:
        "By the time she arrives, he ___ already. (leave)\n→ will have left (future perfect) ✓\n→ left ✗ (wrong tense)",
      explanation: "'By the time' + עתיד = Future Perfect (will have + past participle).",
    },
    action: { label: "תרגל דקדוק", route: "/practice/grammar" },
    visualType: "text",
    tags: ["grammar", "tense"],
  },

  // ─── Listening ────────────────────────────────────────────────
  {
    id: "tip-listening-context-first",
    title: "קרא את המשפט ההקשרי לפני ההאזנה",
    category: "listening",
    difficulty: "beginner",
    shortText:
      "לפני שמתחיל השמע, יש לך זמן קצר לקרוא את המשפט שמופיע בשאלה. עשה זאת — ההקשר יעזור לך להבין מה לחפש.",
    example: {
      title: "גישה",
      content:
        "Before audio: 'The speaker believes that modern cities should ___'\n→ You now know to listen for an opinion about cities.",
      explanation: "ידיעת ההקשר מראש מפחיתה עומס על הזיכרון — אתה מחפש נקודה ספציפית ולא מנסה לזכור הכל.",
    },
    action: { label: "תרגל שאלות האזנה", route: "/practice/lectureQuestions" },
    visualType: "text",
    tags: ["listening", "strategy"],
  },
  {
    id: "tip-listening-main-idea",
    title: "לא כל מילה — חפש את הרעיון המרכזי",
    category: "listening",
    difficulty: "beginner",
    shortText:
      "אל תנסה לרשום כל מילה. המוח לא מסוגל לרשום ולהקשיב בו-זמנית. התמקד: מי מדבר? על מה? מה העמדה שלו?",
    example: {
      title: "מה לשים לב אליו",
      content:
        "Key phrases to catch:\n'The main reason is...'\n'What I mean is...'\n'In conclusion...'\n'The most important thing...'",
      explanation: "ביטויים אלו מסמנים את נקודות המפתח בהרצאה — שם הרעיון המרכזי.",
    },
    action: { label: "תרגל שאלות האזנה", route: "/practice/lectureQuestions" },
    visualType: "checklist",
    tags: ["listening", "comprehension"],
  },
  {
    id: "tip-listening-short-notes",
    title: "רשום מילות מפתח — לא משפטים שלמים",
    category: "listening",
    difficulty: "intermediate",
    shortText:
      "אם כותבים הערות, כתבו רק מילות מפתח קצרות. משפטים שלמים יגרמו לך לפספס את ממשך ההקלטה.",
    example: {
      title: "דוגמה",
      content:
        "Heard: 'The professor argued that climate change affects agricultural productivity in developing nations.'\nGood notes: climate → agriculture → developing countries\nBad notes: trying to write the whole sentence.",
      explanation: "3-4 מילות מפתח מספיקות לזכור את הרעיון כשנגיע לשאלה.",
    },
    visualType: "text",
    tags: ["listening", "notes"],
  },

  // ─── Writing ──────────────────────────────────────────────────
  {
    id: "tip-writing-word-count",
    title: "שמור על 90–120 מילים",
    category: "writing",
    difficulty: "beginner",
    shortText:
      "מטלת הכתיבה מוגבלת ל-90 עד 120 מילים. מתחת לגבול = לא מספיק תוכן. מעל הגבול = סיכון לירידת ניקוד. ספור מילים תוך כדי כתיבה.",
    example: {
      title: "טיפ לספירה",
      content:
        "Write one sentence ≈ 10–15 words.\n90 words ≈ 6–7 sentences.\nPlan: intro (1) + reason 1 (2) + reason 2 (2) + conclusion (1) = 6 sentences.",
      explanation: "תכנון מוקדם של מספר המשפטים מונע כתיבה ארוכה מדי או קצרה מדי.",
    },
    action: { label: "תרגל כתיבה", route: "/practice/writingTask" },
    visualType: "text",
    tags: ["writing", "structure"],
  },
  {
    id: "tip-writing-structure",
    title: "מבנה פשוט: עמדה → נימוק → סיכום",
    category: "writing",
    difficulty: "beginner",
    shortText:
      "אל תכתוב בצורה חופשית. השתמש במבנה קצר: עמדה ברורה, נימוק ראשון, נימוק שני (או דוגמה), וסיכום בקצרה.",
    example: {
      title: "תבנית",
      content:
        "I believe that...\nFirst, ...\nIn addition, ...\nFor these reasons, ...",
      explanation: "מבנה כזה מבטיח: קשר לוגי, כיוון ברור, ושימוש במילות קישור — כולם קריטריוני ניקוד.",
    },
    action: { label: "תרגל כתיבה", route: "/practice/writingTask" },
    visualType: "checklist",
    tags: ["writing", "structure"],
  },
  {
    id: "tip-writing-connectors",
    title: "חבר רעיונות עם מילות קישור",
    category: "writing",
    difficulty: "intermediate",
    shortText:
      "מילות קישור הופכות כתיבה בודדת למאמר קוהרנטי. השתמש בהן לחיבור בין משפטים ובין פסקאות.",
    example: {
      title: "מילות קישור לכתיבה",
      content:
        "Opinion: I believe / In my view / I think\nAddition: Furthermore / In addition / Moreover\nContrast: However / On the other hand\nConclusion: Therefore / For these reasons / In conclusion",
      explanation: "אחת הדרישות בחיבור היא coherence — קשר לוגי ברור. מילות קישור הן הכלי הקל ביותר להשיג זאת.",
    },
    action: { label: "תרגל כתיבה", route: "/practice/writingTask" },
    visualType: "connector_compare",
    tags: ["writing", "connectors"],
  },

  // ─── Exam Interface ────────────────────────────────────────────
  {
    id: "tip-exam-answer-all",
    title: "ענה על הכל — אין עונש על טעות",
    category: "exam_interface",
    difficulty: "beginner",
    shortText:
      "במבחן האמירנט אין ניקוד שלילי על תשובה שגויה. לכן: תמיד ענה. אם לא בטוח — נחש. לא לוותר על שאלה ריקה.",
    visualType: "video_style",
    tags: ["exam", "strategy"],
  },
  {
    id: "tip-exam-no-return",
    title: "לא חוזרים לפרק קודם",
    category: "exam_interface",
    difficulty: "beginner",
    shortText:
      "ברגע שמסיים פרק ועובר לפרק הבא — אי אפשר לחזור. הזמן שנותר בפרק הנוכחי לא עובר הלאה. נצל את הזמן היטב בתוך כל פרק.",
    example: {
      title: "נוהל מומלץ",
      content:
        "1. Answer all questions in current section.\n2. Use remaining time to review in this section only.\n3. When time is up — move forward, no going back.",
      explanation: "ניהול זמן נכון בתוך הפרק חשוב יותר מהכנסת זמן לפרק אחר.",
    },
    visualType: "checklist",
    tags: ["exam", "interface"],
  },

  // ─── Test Day ─────────────────────────────────────────────────
  {
    id: "tip-test-day-arrive-early",
    title: "הגע מוקדם ובא מוכן",
    category: "test_day",
    difficulty: "beginner",
    shortText:
      "הגע לבחינה לפחות 20 דקות לפני. הבא תעודת זהות. אין אפשרות להיכנס עם טלפון, מחשב, או חומרי עזר. אין ניחוש בריא שמחליף הכנה.",
    example: {
      title: "רשימת בדיקה ליום הבחינה",
      content:
        "✓ ID card / passport\n✓ Exam confirmation slip\n✓ Pencil (usually provided)\n✓ No phone in room\n✓ Arrive 20 min early",
      explanation: "לחץ מיותר ביום הבחינה פוגע בביצועים. הכנה לוגיסטית פשוטה מונעת אותו.",
    },
    visualType: "checklist",
    tags: ["test_day", "preparation"],
  },

  // ─── Study Order / Method ─────────────────────────────────────
  {
    id: "tip-study-vocab-daily",
    title: "10–20 מילים ביום — לא יותר",
    category: "vocabulary",
    difficulty: "beginner",
    shortText:
      "למידה אפקטיבית של מילים היא מצטברת, לא מרוכזת. למד בין 10 ל-20 מילים ביום בקביעות. שינון של 100 מילים ביום אחד כמעט לא נשמר בזיכרון.",
    example: {
      title: "סדר יומי מומלץ",
      content:
        "Morning: 15–20 min vocabulary review\nAfternoon: topic practice (questions)\nEvening: 15 min reading",
      explanation: "קצב קבוע של 15–30 דקות ביום עדיף על שעות רצופות לפני הבחינה.",
    },
    action: { label: "תרגל אוצר מילים", route: "/vocab/swipe" },
    visualType: "checklist",
    tags: ["vocabulary", "study_habits"],
  },
  {
    id: "tip-debrief-your-mistakes",
    title: "תחקור שגיאות — חלק בלתי נפרד מהתרגול",
    category: "general",
    difficulty: "intermediate",
    shortText:
      "אחרי כל מקבץ שאלות, חזור על השגיאות ושאל: למה פסלתי את התשובה הנכונה? למה לא פסלתי את השגויה? בלי תחקור — התרגול שווה פחות.",
    example: {
      title: "שאלות לתחקור",
      content:
        "1. Why did I reject the correct answer?\n2. What made the wrong answer look attractive?\n3. Was it a vocabulary gap or a logic error?\n4. What strategy would have helped?",
      explanation: "תחקור יפחית את אותן טעויות בתרגול הבא — לא רק ידע, גם מיומנות.",
    },
    action: { label: "סקור שגיאות", route: "/review" },
    visualType: "checklist",
    tags: ["strategy", "review"],
  },
  {
    id: "tip-simulation-after-topic",
    title: "סימולציה מלאה אחרי כל נושא",
    category: "general",
    difficulty: "intermediate",
    shortText:
      "אחרי שתרגלת נושא מסוים מספר פעמים, בצע סימולציה מלאה. ביצועים בסימולציה משקפים את ההתקדמות האמיתית שלך ומכינים אותך לתנאי הלחץ.",
    example: {
      title: "ניתוח לאחר סימולציה",
      content:
        "After each simulation, check:\n• Which section had the most errors?\n• Was time a problem?\n• Which question type needs more work?",
      explanation: "הסימולציה היא לא רק מבחן — היא גם כלי אבחון לתכנון הלמידה הבאה.",
    },
    action: { label: "הפעל סימולציה", route: "/simulation" },
    visualType: "checklist",
    tags: ["simulation", "review"],
  },
  {
    id: "tip-read-english-daily",
    title: "קרא אנגלית 15 דקות ביום",
    category: "reading",
    difficulty: "beginner",
    shortText:
      "קריאה יומית של טקסטים אנגליים בנושאים שמעניינים אותך משפרת מהירות קריאה, אוצר מילים, ותחושת שפה — בלי תרגול ישיר. זה הכי יעיל לטווח ארוך.",
    example: {
      title: "אתרים מומלצים לקריאה",
      content:
        "• sciencedaily.com — science articles\n• jpost.com — Israeli English news\n• nytimes.com/section/magazine — varied topics",
      explanation: "בחר נושאים שמעניינים אותך — קריאה שנהנים ממנה נזכרת טוב יותר.",
    },
    visualType: "checklist",
    tags: ["reading", "habits"],
  },
  {
    id: "tip-study-short-sessions",
    title: "למד בפרקי זמן קצרים — לא מרתונים",
    category: "time_management",
    difficulty: "beginner",
    shortText:
      "מחקרי למידה מראים: שינון של יותר מחצי שעה ברצף אינו אפקטיבי. עדיף להפסיק אחרי 30 דקות, לנוח, ולחזור מאוחר יותר.",
    example: {
      title: "טיפ מדעי",
      content:
        "Study 25–30 min → Short break → Resume.\nThis is the 'Pomodoro' technique — proven to improve retention.",
      explanation: "מידע חדש מתגבש במוח גם בזמן המנוחה — ההפסקה היא חלק מהלמידה.",
    },
    visualType: "video_style",
    tags: ["time_management", "habits"],
  },
  {
    id: "tip-focus-on-weak-areas",
    title: "תרכז את הזמן על נקודות החולשה",
    category: "general",
    difficulty: "intermediate",
    shortText:
      "אחרי כמה תרגולים, תדע איזה סוג שאלות קשה לך יותר. תרגל אותו יותר. לא כדאי לבזבז זמן על מה שכבר שולטים בו.",
    example: {
      title: "איך לזהות חולשות",
      content:
        "After 3+ practice sessions:\n• Restatements: 55% accuracy → spend more time here\n• Sentence Completion: 80% → maintain, don't over-practice",
      explanation: "הזמן הוא משאב מוגבל. השקע אותו היכן שהוא יניב את השיפור הגדול ביותר.",
    },
    action: { label: "בדוק ביצועים", route: "/review" },
    visualType: "text",
    tags: ["strategy", "review"],
  },

  // ─── General ──────────────────────────────────────────────────
  {
    id: "tip-time-management-sections",
    title: "זמן הפרק לא עובר לפרק הבא",
    category: "time_management",
    difficulty: "beginner",
    shortText:
      "אם סיימת פרק מוקדם — הזמן הנותר לא מצטבר לפרק הבא. לכן: אל תמהר. השתמש בכל הזמן הזמין לחזרה ובדיקה בתוך הפרק.",
    action: { label: "נסה הדמיה מלאה", route: "/simulation" },
    visualType: "video_style",
    tags: ["time", "exam"],
  },
  {
    id: "tip-general-four-principles",
    title: "4 עקרונות על — הבסיס לכל שאלה",
    category: "general",
    difficulty: "beginner",
    shortText:
      "כל שאלה באמירנט נפתרת טוב יותר עם 4 עקרונות: (1) הבחן עיקר מטפל. (2) פצה על פערי ידע בחשיבה. (3) התמקד במבנים לוגיים. (4) עבד את השאלה לפני התשובות.",
    example: {
      title: "הסדר הנכון",
      content:
        "Read sentence → Understand structure → Predict answer → Check choices → Eliminate wrong → Choose best.",
      explanation: "עבודה שיטתית לפי הסדר הזה מפחיתה טעויות, גם כשהמילות לא מוכרות.",
    },
    visualType: "checklist",
    tags: ["strategy", "general"],
  },
];
