/**
 * Vocabulary card enrichment: Hebrew pronunciation + memory-method hint +
 * context sentence.
 *
 * Strategy:
 *   1. Hand-crafted hints live in HAND_CRAFTED_HINTS (small lookup table).
 *      These take priority because they're tuned per-word.
 *   2. Any other word gets a deterministic fallback: a Hebrew
 *      transliteration of the English word + a short memory-method prompt
 *      that combines sound + meaning + personal-context, which is the
 *      method this app encourages (see card UI).
 *
 * This is intentionally NOT a translation API — it produces something
 * meaningful and on-brand for EVERY visible card without external calls,
 * and lets us improve specific words later by adding entries to
 * HAND_CRAFTED_HINTS without touching code.
 */

import type { VocabItem } from "@/types/vocab";

export interface MemoryEnrichment {
  /** Hebrew letter pronunciation (e.g. "קְלִיר"). */
  pronunciation: string;
  /** Short Hebrew memory-method hint. */
  memoryHint: string;
  /** Short Hebrew context sentence that mixes the English word with Hebrew. */
  contextSentence: string;
}

// ─── Hand-crafted entries for common words ──────────────────────────────────
// Format: word (lowercased) → { p: pronunciation, h: hint, c: context }
// These are written in the spirit of: sound association + meaning + a
// personal sentence the learner can adapt. Keep each line short.
const HAND_CRAFTED_HINTS: Record<string, { p: string; h: string; c: string }> = {
  clear: {
    p: "קְלִיר",
    h: "שיטה לזכור: 'קליר' נשמע כמו 'בהיר'. חשוב על חלון נקי שהוא clear.",
    c: "ביום הראשון בעבודה לא היה לי clear מה צריך לעשות.",
  },
  achieve: {
    p: "אַצ'יב",
    h: "שיטה: 'אצ'יב' = להגיע ליעד. תאר רגע שבו הצלחת to achieve משהו אישי.",
    c: "המטרה שלי is to achieve ציון 134 באמירם.",
  },
  abandon: {
    p: "אֲבֶּנְדוֹן",
    h: "שיטה: לחבר 'אבנדון' למילה 'נטוש' — בית נטוש = abandoned house.",
    c: "החלטתי שלא לאבד את האימון ולא to abandon את התוכנית.",
  },
  appropriate: {
    p: "אֶפְּרוֹפְּרִיאֵט",
    h: "שיטה: 'מתאים, ראוי'. דמיין בגד appropriate לחתונה — לא ג'ינס.",
    c: "התשובה הזאת לא appropriate למבחן הזה.",
  },
  approach: {
    p: "אֲפְּרוֹץ'",
    h: "שיטה: שורש 'pro' = קדימה. approach = לגשת, להתקרב.",
    c: "אני צריך להחליט איזה approach לנקוט בשאלת הקריאה.",
  },
  although: {
    p: "אוֹלְ-דוֹ",
    h: "שיטה: although = 'אף על פי ש-'. שמש מצביעה על ניגוד במשפט.",
    c: "Although היה קר, הלכתי לחוף.",
  },
  benefit: {
    p: "בֶּנֶפִיט",
    h: "שיטה: 'בון' (טוב בלטינית) + 'נפיט' — תועלת. benefit נשמע כמו 'נפט' שמועיל.",
    c: "ה-benefit הכי גדול של תרגול יומי הוא שיפור אמיתי.",
  },
  consider: {
    p: "קוֹנְסִידֶר",
    h: "שיטה: 'קונסידר' מכיל 'consid' — לשקול, לחשוב. חשוב על כפות מאזניים.",
    c: "אני צריך to consider את כל האפשרויות לפני שאני בוחר.",
  },
  decline: {
    p: "דִיקְלַיין",
    h: "שיטה: 'דה' (down) + 'cline' (שיפוע). decline = ירידה, סירוב.",
    c: "מספר הסטודנטים החל to decline בשנה האחרונה.",
  },
  demonstrate: {
    p: "דֶמוֹנְסְטְרֵייט",
    h: "שיטה: 'demo' (הדגמה) + 'strate' — להראות, להוכיח. הדגמה = דמו.",
    c: "המורה הצליחה to demonstrate את הנוסחה בצורה ברורה.",
  },
  emphasize: {
    p: "אֶמְפַּסַייז",
    h: "שיטה: 'em' + 'phasis' (דגש). אמרת בקול 'אם!' = הדגשת.",
    c: "המאמר רוצה to emphasize את חשיבות אוצר המילים.",
  },
  establish: {
    p: "אֶסְטַבְּלִיש",
    h: "שיטה: 'establish' = להקים, לבסס. דמיין 'stable' (אורווה) שהוקמה.",
    c: "החברה הצליחה to establish שם טוב תוך שנה.",
  },
  evidence: {
    p: "אֶבִידֶנְס",
    h: "שיטה: 'evi' (ברור) + 'dence' — ראיה, הוכחה. evident = ברור לעין.",
    c: "אין מספיק evidence שתומך בטענה הזאת.",
  },
  fundamental: {
    p: "פַנְדַמֶנְטֵל",
    h: "שיטה: 'fund' = יסוד, קרן. fundamental = יסודי, בסיסי.",
    c: "הבנת השורש היא fundamental להבנת המילה.",
  },
  imply: {
    p: "אִימְפְּלַיי",
    h: "שיטה: 'im' (פנימה) + 'ply' (קפל). imply = לרמוז, להניח בפנים.",
    c: "מה שהכותב trying to imply הוא שצריך עבודה קשה.",
  },
  obvious: {
    p: "אוֹבְבְיֶס",
    h: "שיטה: 'ob' + 'via' (דרך). מה שעל הדרך, גלוי לעין. obvious = ברור מאליו.",
    c: "התשובה הייתה obvious אחרי שקראתי שוב.",
  },
  particular: {
    p: "פַּרְטִיקְיוּלָר",
    h: "שיטה: 'part' (חלק) + 'icular'. particular = מסוים, ייחודי, פרט.",
    c: "אני מחפש particular מילה — לא סתם משהו דומה.",
  },
  precise: {
    p: "פְּרִיסַייס",
    h: "שיטה: 'pre' + 'cise' (חתך). precise = מדויק, חתוך מדויק.",
    c: "המורה דרשה precise תשובה — לא קרובה, מדויקת.",
  },
  reduce: {
    p: "רִידְיוּס",
    h: "שיטה: 're' + 'duce' (להוביל). להוביל לאחור = להפחית.",
    c: "המטרה היא to reduce את כמות השגיאות לחצי.",
  },
  significant: {
    p: "סִיגְנִיפִיקֵנְט",
    h: "שיטה: 'sign' (סימן) + 'ificant'. significant = משמעותי, בעל סימן.",
    c: "ההבדל בין התשובות היה significant.",
  },
  suggest: {
    p: "סָגֶ'סְט",
    h: "שיטה: 'sub' + 'gest' (לשאת). להציע, לרמוז. תדמיין לשים רעיון על השולחן.",
    c: "I suggest שתתחיל מהשאלות הקלות ותעלה בהדרגה.",
  },
  therefore: {
    p: "דֶ'רְפוֹר",
    h: "שיטה: 'there' + 'fore' = לכן, כתוצאה. מסקנה לוגית.",
    c: "תרגלתי כל יום, therefore הציון שלי השתפר.",
  },
  whereas: {
    p: "וֶואֶראֶז",
    h: "שיטה: 'where' + 'as' = בעוד ש-. מציין ניגוד או השוואה.",
    c: "אני אוהב הבנת הנקרא whereas היא מעדיפה דקדוק.",
  },
  although_2: { p: "", h: "", c: "" }, // unused placeholder removed-style guard
};

// Cleanup placeholder
delete (HAND_CRAFTED_HINTS as Record<string, unknown>).although_2;

// ─── Transliteration for fallback hints ─────────────────────────────────────
/**
 * Cheap English → Hebrew transliteration. Not perfect, intentionally
 * conservative: maps single letters to their nearest Hebrew letter.
 * The output is a reading aid, not a phonetic standard.
 */
function transliterate(word: string): string {
  const w = word.trim().toLowerCase();
  if (!w) return "";
  // Multi-letter graphemes first
  const multi: [RegExp, string][] = [
    [/sh/g, "ש"],
    [/ch/g, "צ׳"],
    [/th/g, "ת"],
    [/ph/g, "פ"],
    [/ck/g, "ק"],
    [/qu/g, "קְוו"],
    [/oo/g, "וּ"],
    [/ee/g, "יִ"],
    [/ea/g, "יי"],
    [/ai|ay/g, "יי"],
    [/oa|ou/g, "ו"],
    [/au|aw/g, "או"],
  ];
  let out = w;
  for (const [re, rep] of multi) out = out.replace(re, rep);
  const single: Record<string, string> = {
    a: "א", b: "ב", c: "ק", d: "ד", e: "אֶ", f: "פ", g: "ג",
    h: "ה", i: "אִי", j: "ג'", k: "ק", l: "ל", m: "מ", n: "נ",
    o: "וֹ", p: "פ", q: "ק", r: "ר", s: "ס", t: "ט", u: "וּ",
    v: "ו", w: "ו", x: "קְס", y: "י", z: "ז",
  };
  out = out
    .split("")
    .map((ch) => single[ch] ?? ch)
    .join("");
  return out;
}

/**
 * Returns enrichment for a vocabulary item. Always returns a meaningful
 * pronunciation + memory hint + context sentence — never placeholders.
 */
export function getMemoryEnrichment(item: VocabItem): MemoryEnrichment {
  const key = item.word.trim().toLowerCase();
  const hand = HAND_CRAFTED_HINTS[key];
  if (hand) {
    return {
      pronunciation: item.hePronunciation ?? hand.p,
      memoryHint: item.heMemoryHint ?? hand.h,
      contextSentence: item.heContextSentence ?? hand.c,
    };
  }

  // Per-item override wins if present (future-proofing for enriched seed data)
  if (item.hePronunciation || item.heMemoryHint || item.heContextSentence) {
    return {
      pronunciation: item.hePronunciation ?? transliterate(item.word),
      memoryHint: item.heMemoryHint ?? defaultHint(item),
      contextSentence: item.heContextSentence ?? defaultContext(item),
    };
  }

  // Deterministic fallback using the memory-method framework.
  return {
    pronunciation: transliterate(item.word),
    memoryHint: defaultHint(item),
    contextSentence: defaultContext(item),
  };
}

function defaultHint(item: VocabItem): string {
  const trans = transliterate(item.word);
  const meaning = (item.hebrewTranslation || "").split(/[;,]/)[0].trim() || item.word;
  return `שיטה: '${trans}' = ${meaning}. חבר את הצליל למשמעות וצור משפט אישי קצר עם המילה.`;
}

function defaultContext(item: VocabItem): string {
  // If the seed has an English example sentence, fall back to it embedded
  // inside a short Hebrew prompt. Otherwise produce a generic prompt that
  // invites the learner to write their own sentence (a documented memory
  // technique on its own).
  if (item.exampleSentence && item.exampleSentence.length < 140) {
    return item.exampleSentence;
  }
  const meaning = (item.hebrewTranslation || "").split(/[;,]/)[0].trim();
  return meaning
    ? `נסה לבנות משפט קצר שמשתמש ב-${item.word} במשמעות של ${meaning}.`
    : `נסה לבנות משפט קצר שמשתמש ב-${item.word}.`;
}
