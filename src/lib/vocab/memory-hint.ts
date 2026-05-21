/**
 * Vocabulary card enrichment: smart memory method.
 *
 * Strategy:
 *   1. RICH_ENTRIES — full hand-crafted learning blocks for high-frequency
 *      AMIRAM words (core meaning + memory anchor + collocations + example
 *      with Hebrew translation + optional confusion + retrieval question).
 *   2. LIGHT_HINTS — single-sentence natural-Hebrew hints for the next tier
 *      of common words. These get auto-promoted into the richer shape with
 *      a sensible default retrieval question.
 *   3. Fallback — for every other word, build a word-specific block from
 *      the seed data we DO have (translation, partOfSpeech, synonyms,
 *      antonyms, example sentence). Never generic templates, never
 *      transliteration garbage.
 */

import type { VocabItem } from "@/types/vocab";

export interface MemoryEnrichment {
  /** Hebrew pronunciation (only when actually helpful). Empty otherwise. */
  pronunciation: string;
  /** Central idea of the word, paraphrased in Hebrew. */
  coreMeaning: string;
  /** Short Hebrew anchor — the one phrase to remember. */
  memoryAnchor: string;
  /** Common English collocations (≤4). */
  collocations: string[];
  /** Single short English example sentence. */
  exampleEn: string;
  /** Hebrew translation of the example, when meaningful. */
  exampleHe: string;
  /** Optional warning about a confusable word/meaning. */
  confusion: string;
  /** Single retrieval question for active recall. */
  retrieval: string;
}

interface RichEntry {
  /** Optional Hebrew pronunciation. */
  p?: string;
  /** Core meaning: "רעיון: ..." */
  core: string;
  /** Memory anchor: "עוגן: ..." */
  anchor: string;
  /** 2–4 common collocations. */
  coll: string[];
  /** English example sentence. */
  ex: string;
  /** Hebrew translation of the example. */
  exHe: string;
  /** Optional confusion note. */
  conf?: string;
  /** Optional retrieval question — auto-generated when omitted. */
  rq?: string;
}

// ─── Rich hand-crafted entries ──────────────────────────────────────────────
// Keys = lowercased English words. Each entry follows the spec patterns:
// real meaning anchor + collocations + clean example + Hebrew translation.
const RICH_ENTRIES: Record<string, RichEntry> = {
  absorbent: {
    core: "משהו שמכניס נוזל לתוכו במקום להשאיר אותו בחוץ.",
    anchor: "absorbent = סופג לתוכו",
    coll: ["absorbent material", "absorbent towel", "absorbent paper"],
    ex: "This towel is very absorbent.",
    exHe: "המגבת הזו סופגת מאוד.",
    rq: "מה עושה absorbent material?",
  },
  abbreviate: {
    core: "להפוך משהו ארוך לקצר — מילה, שם או מסמך.",
    anchor: "abbreviate = לקצר ולתמצת",
    coll: ["abbreviate a word", "abbreviate the name", "abbreviated form"],
    ex: "We abbreviate 'information' as 'info'.",
    exHe: "אנחנו מקצרים 'information' ל-'info'.",
    rq: "איך אומרים 'לקצר מילה' באנגלית?",
  },
  abandon: {
    core: "לעזוב לגמרי ולא לחזור — בית, תוכנית, מטרה.",
    anchor: "abandon = נטשת לחלוטין",
    coll: ["abandon a plan", "abandon hope", "abandoned building"],
    ex: "They had to abandon their plan because of the storm.",
    exHe: "הם נאלצו לנטוש את התוכנית בגלל הסערה.",
    rq: "מה ההבדל בין to leave לבין to abandon?",
  },
  abolish: {
    core: "לבטל באופן רשמי — חוק, מוסד או מנהג ישן.",
    anchor: "abolish = למחוק מהספרים",
    coll: ["abolish a law", "abolish slavery", "abolish a tax"],
    ex: "The new government abolished the old tax.",
    exHe: "הממשלה החדשה ביטלה את המס הישן.",
    conf: "לא לבלבל עם abolished (פעלים בעבר). זה לא 'לחקור' ולא 'להפסיק זמנית'.",
    rq: "מה הפעולה של מי ש-abolishes a law?",
  },
  accurate: {
    core: "מדויק לחלוטין — תשובה, מדידה או תיאור שאין בו טעויות.",
    anchor: "accurate = פוגע בדיוק במטרה",
    coll: ["accurate answer", "accurate measurement", "accurate description"],
    ex: "Her description was very accurate.",
    exHe: "התיאור שלה היה מאוד מדויק.",
    conf: "accurate ≠ adequate. accurate = מדויק; adequate = מספיק.",
    rq: "מה ההבדל בין accurate לבין correct?",
  },
  achieve: {
    core: "להגיע למטרה אחרי מאמץ — לא במקרה, אלא כתוצאה מעבודה.",
    anchor: "achieve = השגתי אחרי מאמץ",
    coll: ["achieve a goal", "achieve success", "achieve results"],
    ex: "He achieved high scores through daily practice.",
    exHe: "הוא השיג ציונים גבוהים בזכות תרגול יומי.",
    rq: "איך אומרים 'להשיג מטרה' באנגלית?",
  },
  acquire: {
    core: "לקבל או לרכוש משהו — חפץ, ידע או מיומנות.",
    anchor: "acquire = לרכוש לעצמך",
    coll: ["acquire skills", "acquire knowledge", "acquire a company"],
    ex: "She acquired new language skills during her trip.",
    exHe: "היא רכשה מיומנויות שפה חדשות בטיול.",
    conf: "acquire ≠ require. acquire = לרכוש; require = לדרוש.",
    rq: "מה זה to acquire skills?",
  },
  adapt: {
    core: "להתאים את עצמך למצב חדש — אקלים, תפקיד או סביבה.",
    anchor: "adapt = להתאים את עצמך",
    coll: ["adapt to change", "adapt quickly", "adapt to new conditions"],
    ex: "Children adapt to new schools quickly.",
    exHe: "ילדים מסתגלים לבתי ספר חדשים במהירות.",
    conf: "adapt ≠ adopt. adapt = להסתגל; adopt = לאמץ (ילד או רעיון).",
    rq: "מה ההבדל בין adapt ל-adopt?",
  },
  adopt: {
    core: "לקחת משהו כשלך — ילד, רעיון או שיטה.",
    anchor: "adopt = לאמץ ולקבל לתוכך",
    coll: ["adopt a child", "adopt a policy", "adopt an approach"],
    ex: "The company adopted a new approach to marketing.",
    exHe: "החברה אימצה גישה חדשה לשיווק.",
    conf: "adopt ≠ adapt. adopt = לאמץ; adapt = להסתגל.",
    rq: "מתי משתמשים ב-adopt ומתי ב-adapt?",
  },
  ambiguous: {
    core: "דו-משמעי — אפשר להבין בכמה דרכים, ולא ברור איזו נכונה.",
    anchor: "ambiguous = משאיר אותך בספק",
    coll: ["ambiguous answer", "ambiguous statement", "deliberately ambiguous"],
    ex: "His answer was ambiguous and confused everyone.",
    exHe: "התשובה שלו הייתה דו-משמעית ובלבלה את כולם.",
    rq: "מה זה an ambiguous statement?",
  },
  approach: {
    core: "גם פועל (להתקרב) וגם שם עצם (גישה, דרך פעולה).",
    anchor: "approach = איך אתה ניגש לבעיה",
    coll: ["a different approach", "approach a problem", "scientific approach"],
    ex: "We need a new approach to this problem.",
    exHe: "אנחנו צריכים גישה חדשה לבעיה הזו.",
    rq: "איך אומרים 'גישה אחרת לבעיה' באנגלית?",
  },
  appropriate: {
    core: "מתאים לסיטואציה — בגד, התנהגות או תשובה.",
    anchor: "appropriate = מתאים לרגע",
    coll: ["appropriate response", "appropriate behavior", "appropriate for the occasion"],
    ex: "His response was appropriate and respectful.",
    exHe: "התגובה שלו הייתה מתאימה ומכבדת.",
    rq: "מה זה an appropriate response?",
  },
  beneath: {
    core: "מתחת ל- (מילת יחס פורמלית יותר מ-under).",
    anchor: "beneath = מתחת ל-",
    coll: ["beneath the surface", "beneath the table", "beneath contempt"],
    ex: "The treasure was buried beneath the old tree.",
    exHe: "האוצר היה קבור מתחת לעץ הזקן.",
    conf: "beneath ≠ between. beneath = מתחת; between = בין.",
    rq: "מה ההבדל בין beneath ל-under?",
  },
  considerable: {
    core: "ניכר במידה — סכום, מאמץ או הבדל שמרגישים אותם.",
    anchor: "considerable = משמעותי מבחינת גודל",
    coll: ["considerable amount", "considerable effort", "considerable damage"],
    ex: "The project required a considerable amount of time.",
    exHe: "הפרויקט דרש כמות זמן ניכרת.",
    conf: "considerable ≠ considerate. considerable = ניכר; considerate = מתחשב.",
    rq: "מה ההבדל בין considerable ל-considerate?",
  },
  derive: {
    core: "משהו יוצא או נובע ממקור אחר — תועלת, מסקנה או שורש מילה.",
    anchor: "derive = מה יצא מתוך מה?",
    coll: ["derive meaning", "derive benefit", "derived from"],
    ex: "The word 'biology' is derived from Greek.",
    exHe: "המילה 'ביולוגיה' נגזרת מיוונית.",
    rq: "מה זה derive meaning?",
  },
  emphasize: {
    core: "לתת דגש מיוחד למשהו — בקול, באותיות מודגשות או בחזרה.",
    anchor: "emphasize = שים לב לזה!",
    coll: ["emphasize the importance", "strongly emphasize", "emphasize a point"],
    ex: "The teacher emphasized the importance of practice.",
    exHe: "המורה הדגישה את חשיבות התרגול.",
    rq: "איך אומרים 'להדגיש את החשיבות' באנגלית?",
  },
  encourage: {
    core: "לעודד מישהו לעשות משהו — לתת ביטחון או מוטיבציה.",
    anchor: "encourage = לתת רוח לפעולה",
    coll: ["encourage someone to", "encourage participation", "strongly encourage"],
    ex: "Her parents encouraged her to apply for the scholarship.",
    exHe: "הוריה עודדו אותה לגשת למלגה.",
    rq: "מה זה to encourage someone?",
  },
  endure: {
    core: "לסבול קושי לאורך זמן בלי להתפרק.",
    anchor: "endure = להחזיק מעמד תחת לחץ",
    coll: ["endure hardship", "endure pain", "endure for years"],
    ex: "Soldiers must endure difficult training.",
    exHe: "חיילים חייבים לעמוד באימון קשה.",
    rq: "מה זה to endure hardship?",
  },
  enhance: {
    core: "לשפר, להעצים — תכונה קיימת שכבר טובה.",
    anchor: "enhance = לעלות רמה",
    coll: ["enhance performance", "enhance the experience", "enhance flavor"],
    ex: "These exercises enhance your memory.",
    exHe: "התרגילים האלה משפרים את הזיכרון שלך.",
    conf: "enhance ≠ increase. enhance = לשפר באיכות; increase = לגדול בכמות.",
    rq: "מה ההבדל בין enhance ל-improve?",
  },
  ensure: {
    core: "לוודא שמשהו יקרה — לקחת אחריות שזה לא ישתבש.",
    anchor: "ensure = לוודא ולוודא שוב",
    coll: ["ensure quality", "ensure safety", "ensure success"],
    ex: "Please ensure that the door is locked.",
    exHe: "אנא ודא שהדלת נעולה.",
    conf: "ensure ≠ insure. ensure = לוודא; insure = לבטח.",
    rq: "איך אומרים 'לוודא שהדלת נעולה' באנגלית?",
  },
  establish: {
    core: "להקים משהו חדש — חברה, חוק, או לבסס שם.",
    anchor: "establish = לבסס יסודות",
    coll: ["establish a company", "establish a fact", "well-established"],
    ex: "The company was established in 1990.",
    exHe: "החברה הוקמה בשנת 1990.",
    rq: "מה זה a well-established company?",
  },
  evident: {
    core: "ברור לעין, גלוי — אין צורך בהוכחה נוספת.",
    anchor: "evident = רואים את זה ברור",
    coll: ["clearly evident", "evident from", "self-evident"],
    ex: "His relief was evident on his face.",
    exHe: "ההקלה שלו הייתה ניכרת על פניו.",
    rq: "איך נשמע מישהו שאומר 'It is evident that...'?",
  },
  expand: {
    core: "להתרחב, להגדיל — חברה, אופקים או מאמר.",
    anchor: "expand = להתפשט החוצה",
    coll: ["expand the business", "expand your horizons", "expand on the topic"],
    ex: "The company plans to expand into Asia.",
    exHe: "החברה מתכננת להתרחב לאסיה.",
    rq: "מה ההבדל בין expand ל-explain?",
  },
  fragile: {
    core: "שביר, עדין — חפץ או יחסים שיכולים להישבר בקלות.",
    anchor: "fragile = נשבר אם נוגעים חזק",
    coll: ["fragile item", "fragile peace", "extremely fragile"],
    ex: "Please handle this package carefully — it's fragile.",
    exHe: "אנא טפלו בחבילה הזו בזהירות — היא שבירה.",
    rq: "מה כתוב בדרך כלל על קופסה עם זכוכית?",
  },
  fundamental: {
    core: "בסיסי וחיוני — בלעדיו הכל קורס.",
    anchor: "fundamental = יסוד הבניין",
    coll: ["fundamental principle", "fundamental rights", "fundamentally different"],
    ex: "Practice is fundamental to learning a language.",
    exHe: "תרגול הוא יסוד ללימוד שפה.",
    rq: "מה זה a fundamental principle?",
  },
  impose: {
    core: "לכפות משהו על מישהו — מס, חוק או נוכחות.",
    anchor: "impose = לכפות מלמעלה",
    coll: ["impose restrictions", "impose a fine", "impose your will"],
    ex: "The city imposed strict water restrictions.",
    exHe: "העירייה הטילה הגבלות מים מחמירות.",
    rq: "מה זה to impose restrictions?",
  },
  inevitable: {
    core: "בלתי נמנע — יקרה ואי אפשר לעצור.",
    anchor: "inevitable = אין דרך לברוח",
    coll: ["inevitable outcome", "almost inevitable", "the inevitable consequence"],
    ex: "Change is inevitable in business.",
    exHe: "שינוי הוא בלתי נמנע בעולם העסקים.",
    rq: "מה זה an inevitable outcome?",
  },
  intend: {
    core: "להתכוון לעשות משהו — תוכנית או מטרה.",
    anchor: "intend = יש לי כוונה ל-",
    coll: ["intend to do", "intended for", "intended audience"],
    ex: "I intend to apply for the job next week.",
    exHe: "אני מתכוון להגיש מועמדות לעבודה בשבוע הבא.",
    rq: "מה ההבדל בין intend ל-want?",
  },
  obtain: {
    core: "להשיג משהו דרך מאמץ או תהליך — רישיון, מידע או הסכמה.",
    anchor: "obtain = להשיג בעיקר רשמית",
    coll: ["obtain a license", "obtain permission", "obtain information"],
    ex: "You must obtain a license to drive.",
    exHe: "אתה חייב להוציא רישיון כדי לנהוג.",
    conf: "obtain ≠ observe. obtain = להשיג; observe = להתבונן.",
    rq: "מה ההבדל בין obtain ל-receive?",
  },
  perceive: {
    core: "לתפוס במחשבה או בחושים — להבין איך משהו נראה.",
    anchor: "perceive = ככה זה נתפס אצלך",
    coll: ["perceive a threat", "perceive as", "widely perceived"],
    ex: "She perceived a sense of urgency in his voice.",
    exHe: "היא חשה תחושת דחיפות בקולו.",
    rq: "מה ההבדל בין perceive ל-see?",
  },
  reconcile: {
    core: "להחזיר הרמוניה — בין אנשים, או בין שני דברים שנראים סותרים.",
    anchor: "reconcile = להחזיר ידידות",
    coll: ["reconcile differences", "reconcile with", "hard to reconcile"],
    ex: "It is hard to reconcile these two reports.",
    exHe: "קשה ליישב בין שני הדוחות האלה.",
    rq: "מה זה reconcile differences?",
  },
  reluctant: {
    core: "לא נלהב — מסכים בקושי, אחרי לחץ.",
    anchor: "reluctant = מהסס לפני שהוא עושה",
    coll: ["reluctant to admit", "reluctant participant", "somewhat reluctant"],
    ex: "He was reluctant to share his answer.",
    exHe: "הוא היסס לשתף את התשובה שלו.",
    rq: "מה זה a reluctant participant?",
  },
  sufficient: {
    core: "מספיק לצורך מסוים — לא בעודף, רק מה שדרוש.",
    anchor: "sufficient = מספיק כדי לעבור",
    coll: ["sufficient evidence", "sufficient time", "sufficient funds"],
    ex: "There is sufficient evidence to support the claim.",
    exHe: "יש מספיק ראיות לתמוך בטענה.",
    conf: "sufficient ≠ efficient. sufficient = מספיק; efficient = יעיל.",
    rq: "איך אומרים 'מספיק ראיות' באנגלית?",
  },
  undermine: {
    core: "לפגוע במשהו מבפנים או מלמטה עד שהוא נחלש — לא תקיפה ישירה, אלא הרס יסודות.",
    anchor: "undermine = פוגע ביסודות",
    coll: ["undermine trust", "undermine authority", "undermine confidence"],
    ex: "His lies undermined trust in the team.",
    exHe: "השקרים שלו פגעו באמון בקבוצה.",
    conf: "לא לתרגם כ'לחקור מתחת'. המשמעות היא להחליש מבפנים.",
    rq: "מה זה undermine trust?",
  },
  vague: {
    core: "מעורפל ולא ספציפי — תשובה שאי אפשר לפעול לפיה.",
    anchor: "vague = הסבר ערפילי",
    coll: ["vague answer", "vague memory", "vague idea"],
    ex: "His instructions were too vague to follow.",
    exHe: "ההוראות שלו היו עמומות מדי כדי לפעול לפיהן.",
    conf: "vague ≠ vast. vague = מעורפל; vast = עצום.",
    rq: "מה זה a vague answer?",
  },
  vulnerable: {
    core: "פגיע — חשוף לפגיעה ולא יכול להגן על עצמו.",
    anchor: "vulnerable = ללא הגנה",
    coll: ["vulnerable to attack", "vulnerable population", "particularly vulnerable"],
    ex: "Young children are vulnerable to cold.",
    exHe: "ילדים קטנים פגיעים לקור.",
    rq: "מה זה a vulnerable population?",
  },
};

// ─── Light hints — single sentence, auto-promoted to the richer shape ───────
// These are the entries from the previous round. They have a good 1-sentence
// hint but no full structured data — the renderer treats them as
// "core meaning + auto retrieval question".
const LIGHT_HINTS: Record<string, { p?: string; h: string }> = {
  abrupt: { h: "פתאומי וחד, כמו עצירה abrupt של מכונית באמצע הכביש." },
  abundant: { h: "יש בשפע. שולחן חג עמוס באוכל — abundant food." },
  accept: { h: "לקבל ברצון — accept מתנה, accept הזמנה, accept הצעת עבודה." },
  access: { h: "כניסה או גישה — כרטיס שנותן לך access לבניין." },
  accidental: { h: "במקרה, לא מתוכנן. גילוי accidental כמו פניצילין." },
  accommodate: { h: "לארח או להתאים — מלון שיכול to accommodate 200 אורחים." },
  accomplish: { h: "להשלים משימה בהצלחה. רץ שעבר את הקו — he accomplished his goal." },
  accuse: { h: "להאשים מישהו במעשה רע, כמו במשפט בבית משפט." },
  acknowledge: { h: "להכיר במשהו או באמת — להניד בראש ולאשר 'כן, אתה צודק'." },
  adjust: { h: "לכוון בעדינות — adjust את ההגה של האופניים בגובה הנכון." },
  admit: { h: "להודות באמת לא נוחה, כמו ילד שמודה שהוא שבר את האגרטל." },
  advance: { h: "להתקדם. צבא ש-advances קדימה, או טכנולוגיה שעושה advance." },
  adverse: { h: "שלילי, לא נוח. תנאי מזג אוויר adverse עוצרים טיסות." },
  affect: { h: "להשפיע על. הגשם affected את התוכניות שלי לים." },
  affluent: { h: "עשיר ושופע. שכונה affluent עם בתי פאר ובריכות." },
  although: { h: "מילת ניגוד: 'למרות ש-'. Although היה קר, יצאנו לטיול." },
  ambition: { h: "שאיפה גדולה. הילד עם ambition להיות אסטרונאוט." },
  analyze: { h: "לפרק לחלקים ולבחון. מדען analyzes דגימה תחת מיקרוסקופ." },
  ancient: { h: "עתיק מאוד, אלפי שנים. שרידים ancient של מצרים העתיקה." },
  annoy: { h: "להציק או להרגיז קצת — יתוש ש-annoys אותך בלילה." },
  anticipate: { h: "לצפות מראש למשהו. ילדים ש-anticipate את החופש הגדול." },
  apparent: { h: "נראה לעין, ברור. הסיבה הייתה apparent לכל מי שהסתכל." },
  appeal: { h: "פנייה או משיכה — מוצר עם appeal לצעירים, או appeal לעזרה." },
  apply: { h: "להגיש בקשה או ליישם. apply לעבודה, apply את החוק על מקרה חדש." },
  appreciate: { h: "להעריך את הטוב — appreciate ידיד אמיתי, כוס קפה בבוקר." },
  approve: { h: "לאשר רשמית. הבוס approved את החופשה שלך." },
  argue: { h: "להתווכח או לטעון. עורך דין ש-argues עם השופט בבית משפט." },
  arise: { h: "לקום, לצוץ. בעיות arise כשלא מתכננים מראש." },
  arrogant: { h: "יהיר, מתנשא. אדם arrogant חושב שהוא תמיד יודע יותר טוב." },
  aspire: { h: "לשאוף גבוה. סטודנט ש-aspires להיות רופא." },
  assemble: { h: "להרכיב או להתאסף — assemble ארון, או צבא ש-assembles ליציאה." },
  assert: { h: "להצהיר בנחישות, לטעון בתוקף. הוא asserted שהוא חף מפשע." },
  assess: { h: "להעריך שווי או רמה. שמאי ש-assesses את ערך הדירה." },
  assist: { h: "לעזור. חובש ש-assists את הרופא בניתוח." },
  assume: { h: "להניח בלי לבדוק. אל תניח שכולם יודעים — תשאל." },
  attain: { h: "להשיג אחרי מאמץ ארוך. attain תואר, attain חלום של שנים." },
  attempt: { h: "ניסיון. an attempt to שבור שיא, גם אם זה לא הצליח." },
  attribute: { h: "לייחס משהו לסיבה. הצלחתו attributed לעבודה קשה ולמזל." },
  authentic: { h: "אמיתי, לא חיקוי. שעון authentic מהמותג, לא זיוף." },
  available: { h: "זמין, פנוי. רופא שהוא available לפגישה ביום שלישי." },
  avoid: { h: "להימנע, לעקוף. avoid פקקים בכביש על ידי יציאה מוקדמת." },
  aware: { h: "מודע, יודע. נהג aware לסכנה אוחז בהגה חזק יותר." },
  benefit: { h: "תועלת. ה-benefit של תרגול יומי הוא שיפור אמיתי לאורך זמן." },
  brief: { h: "קצר, תמציתי. הרצאה brief של 5 דקות — ישר ולעניין." },
  burden: { h: "נטל כבד. אדם הולך עם תיק ענק על הגב — that's a burden." },
  capable: { h: "מסוגל. אדם capable של פתרון בעיות מורכבות." },
  cease: { h: "להפסיק לחלוטין. cease fire — הפסקת אש, סוף לחימה." },
  challenge: { h: "אתגר. ריצת מרתון היא challenge פיזית ומנטלית." },
  characteristic: { h: "תכונה אופיינית. צחוק רם הוא characteristic שלו." },
  clarify: { h: "להבהיר, להפוך ברור. המורה clarified את ההוראות פעמיים." },
  clear: { p: "קְלִיר", h: "ברור, נקי. חלון נקי לחלוטין — clear glass שדרכו רואים הכל." },
  collapse: { h: "להתמוטט. בניין ישן ש-collapsed ברעידת אדמה." },
  combine: { h: "לחבר יחד. combine שמן וחומץ → סלט. combine רעיונות → פתרון." },
  commit: { h: "להתחייב או לבצע. commit לקשר, commit פשע (לבצע אותו)." },
  compel: { h: "להכריח, לכפות. נסיבות ש-compel אותך לעזוב את הבית." },
  compensate: { h: "לפצות. חברת ביטוח ש-compensates על נזק לרכב." },
  competent: { h: "כשיר, מקצועי. עובד competent יודע את העבודה ועושה אותה היטב." },
  complex: { h: "מורכב, רב-רובדי. בעיה complex עם הרבה פרטים." },
  comply: { h: "לציית, לעמוד בדרישה. נהג ש-complies with the speed limit." },
  concise: { h: "תמציתי. סיכום concise תופס את העיקר במעט מילים." },
  conclude: { h: "להסיק או לסיים. הוא concluded שהמכונית בוצעה — מסקנה הגיונית." },
  condemn: { h: "לגנות בחריפות. ארגון בינלאומי condemned את ההפרה." },
  confess: { h: "להתוודות. ילד ש-confesses שהוא אכל את העוגה." },
  confirm: { h: "לאשר רשמית. אימייל ש-confirms את ההזמנה שלך." },
  confront: { h: "להתעמת. בסוף הוא decided to confront את הבעיה." },
  consider: { h: "לשקול במחשבה. consider את כל האפשרויות לפני שאתה בוחר." },
  consequently: { h: "כתוצאה מכך. ירד גשם, consequently המשחק בוטל." },
  consistent: { h: "עקבי. מתאמן consistent מגיע לאימון 4 פעמים בשבוע." },
  constitute: { h: "להוות, להרכיב. 12 חודשים constitute שנה אחת." },
  constrain: { h: "להגביל, לכבול. תקציב נמוך ש-constrains את התוכניות." },
  construct: { h: "לבנות בצעדים. constructing בניין לבנה אחר לבנה." },
  consume: { h: "לצרוך, לכלות. גוף שצורך מזון, מכונית ש-consumes דלק." },
  contain: { h: "מכיל בתוכו. הקופסה contains 12 ביצים." },
  contemplate: { h: "להרהר בעמקות. הוא contemplated את ההחלטה לילה שלם." },
  contend: { h: "להתחרות או לטעון. צוותים ש-contend על הגביע." },
  contrary: { h: "הפוך, מנוגד. on the contrary — להפך, ההיפך הוא הנכון." },
  contribute: { h: "לתרום. כל חבר contributes לפרויקט עם רעיונות משלו." },
  controversial: { h: "שנוי במחלוקת. נושא controversial מעלה ויכוחים סוערים." },
  convey: { h: "להעביר מסר או חפץ. רכבת ש-conveys סחורה, דיבור ש-conveys רגש." },
  cope: { h: "להתמודד בהצלחה. הורה ש-copes with שלושה ילדים קטנים." },
  crucial: { h: "קריטי, מכריע. שלב crucial במשחק — נקודה אחת תכריע." },
  decline: { h: "ירידה או סירוב. decline של מכירות, decline להזמנה." },
  deliberate: { h: "מכוון, מתוכנן. שגיאה deliberate, לא טעות מקרית." },
  demonstrate: { h: "להדגים, להראות בפעולה. demonstrate הנוסחה על הלוח." },
  deny: { h: "להכחיש או לסרב. הוא denied שהוא היה במקום." },
  depend: { h: "להיות תלוי. תינוק תלוי בהורים — depends on them." },
  describe: { h: "לתאר. עד שה-describes את החשוד למשטרה." },
  despite: { h: "למרות. despite the rain, יצאנו לטיול." },
  detect: { h: "לזהות, לאתר. חיישן ש-detects עשן." },
  determine: { h: "לקבוע. הציון determines את הקבלה לאוניברסיטה." },
  diminish: { h: "להפחית, להצטמצם. עניין ש-diminishes עם הזמן." },
  distinct: { h: "ברור, שונה במובהק. ריח distinct של תפוח." },
  diverse: { h: "מגוון. עיר diverse עם תושבים מתרבויות שונות." },
  doubt: { h: "ספק. יש לי doubts אם זה רעיון טוב." },
  durable: { h: "עמיד לאורך זמן. נעלי הליכה durable שמחזיקות שנים." },
  efficient: { h: "יעיל. מנוע efficient מפיק הרבה תוצאה מעט אנרגיה." },
  emerge: { h: "לצוץ, להופיע. צוללת ש-emerges מתחת למים." },
  encounter: { h: "להיתקל. מטייל ש-encounters דב ביער." },
  enforce: { h: "לאכוף. שוטר ש-enforces חוקי תנועה ברחוב." },
  enormous: { h: "ענק, עצום. פיל הוא יצור enormous." },
  entirely: { h: "לחלוטין, במלואו. החדר היה entirely ריק." },
  equivalent: { h: "שווה ערך. דולר equivalent ל-3.7 שקלים." },
  essential: { h: "הכרחי, חיוני. מים essential לחיים — אי אפשר בלעדיהם." },
  evaluate: { h: "להעריך באופן שיטתי. מורה ש-evaluates עבודות עם רובריקה." },
  evoke: { h: "לעורר רגש או זיכרון. ריח של עוגה evokes זכרונות ילדות." },
  exceed: { h: "לעלות על, לחרוג. exceeded the speed limit." },
  exhibit: { h: "להציג. מוזיאון ש-exhibits יצירות אמנות." },
  exploit: { h: "לנצל. exploit הזדמנות (טוב), exploit עובדים (רע)." },
  expose: { h: "לחשוף. כתב ש-exposes שחיתות." },
  extend: { h: "להאריך. extend חופשה, extend יד לעזרה." },
  facilitate: { h: "להקל, לאפשר. מתורגמן ש-facilitates שיחה בין שתי שפות." },
  familiar: { h: "מוכר. רחוב familiar שאתה זוכר מילדות." },
  fascinate: { h: "להקסים. ילד ש-fascinated by דינוזאורים." },
  feasible: { h: "ישים, אפשרי לביצוע. תוכנית feasible עם משאבים סבירים." },
  flexible: { h: "גמיש. גוף flexible של מתעמלת, שעות עבודה flexible." },
  furthermore: { h: "יתר על כן, בנוסף. מוסיף עוד טיעון: 'ועוד דבר...'" },
  generate: { h: "ליצור, להפיק. גנרטור ש-generates חשמל." },
  generous: { h: "נדיב. אדם generous שתורם זמן וכסף לזולת." },
  genuine: { h: "אמיתי, כן. חיוך genuine שמגיע מהלב, לא חיקוי." },
  gradually: { h: "בהדרגה, לאט. השמש gradually שוקעת — לא בבת אחת." },
  hesitate: { h: "להסס. הוא hesitated רגע לפני שקפץ למים הקרים." },
  hostile: { h: "עוין, אגרסיבי. שכן hostile שצועק מעבר לגדר." },
  identify: { h: "לזהות. עד ש-identifies את החשוד מבין תמונות." },
  imply: { h: "לרמוז בלי לומר במפורש. הוא implied שיש בעיה." },
  influence: { h: "השפעה. מורה טוב has influence על תלמידיו לכל החיים." },
  inherent: { h: "טבוע, מובנה. סקרנות inherent בילדים קטנים." },
  initiate: { h: "ליזום, להתחיל תהליך. הוא initiated שיחה עם הזר." },
  intense: { h: "חזק, עוצמתי. אימון intense שמשאיר אותך מותש." },
  involve: { h: "לערב, לכלול. הפרויקט involves צוות של 5 אנשים." },
  justify: { h: "להצדיק. הוא tried to justify את האיחור עם תירוץ של פקק." },
  maintain: { h: "לשמור, לתחזק. maintain את הרכב, maintain קשר עם חבר." },
  modify: { h: "לשנות במידה. מתכון שעבר modify — פחות סוכר, יותר תבלינים." },
  mutual: { h: "הדדי. כבוד mutual — שניהם מכבדים אחד את השני." },
  obvious: { h: "ברור מאליו. התשובה הייתה obvious אחרי שקראתי שוב." },
  occur: { h: "לקרות, להתרחש. תאונה ש-occurred על הכביש המהיר." },
  particular: { h: "מסוים, ייחודי. אני מחפש particular מילה — לא דומה." },
  persist: { h: "להתמיד. הוא persisted גם כשכולם אמרו שזה בלתי אפשרי." },
  perspective: { h: "נקודת מבט. מ-perspective אחרת הבעיה נראית אחרת." },
  persuade: { h: "לשכנע. הוא persuaded אותי לבוא לסרט — שינה לי את הדעה." },
  precise: { h: "מדויק. הוראות precise: לערבב 3 דקות בדיוק." },
  prevent: { h: "למנוע. גדר ש-prevents כניסה, חיסון ש-prevents מחלה." },
  prior: { h: "קודם, מוקדם יותר. prior to the meeting — לפני הפגישה." },
  proceed: { h: "להמשיך, להתקדם. proceed to the gate — המשך לשער." },
  prominent: { h: "בולט, מכובד. דמות prominent בעיר — כולם מכירים אותה." },
  propose: { h: "להציע. הוא proposed רעיון, או proposed נישואים." },
  reduce: { h: "להפחית. reduce הוצאות, reduce סוכר בקפה." },
  refer: { h: "להתייחס או להפנות. רופא ש-refers אותך למומחה." },
  reflect: { h: "לשקף או להרהר. מראה ש-reflects דמות." },
  reject: { h: "לדחות. מוצר faulty ש-rejected בסוף הקו." },
  relevant: { h: "רלוונטי, קשור. מידע relevant לנושא — לא סיפור צדדי." },
  remain: { h: "להישאר. רק שני נגנים remained על הבמה בסוף הקונצרט." },
  remarkable: { h: "ראוי לציון. ביצוע remarkable של זמרת בת 10." },
  require: { h: "לדרוש. עבודה ש-requires תואר ראשון לפחות." },
  resemble: { h: "להיות דומה. הילד resembles את אביו — אותה צורת אף." },
  resist: { h: "להתנגד, לעמוד בפיתוי. resist עוגה בדיאטה." },
  resolve: { h: "לפתור או החלטה איתנה. resolve סכסוך, New Year's resolution." },
  retain: { h: "לשמור, להחזיק. retain את הקבלה ל-30 יום." },
  reveal: { h: "לחשוף. הקוסם revealed את הסוד מאחורי הטריק." },
  rigid: { h: "נוקשה, לא גמיש. כללים rigid שאין להם חריגים." },
  significant: { h: "משמעותי. ההבדל בין התשובות היה significant." },
  similar: { h: "דומה. שני שירים similar במנגינה אבל שונים במילים." },
  simulate: { h: "לדמות, לחקות. תוכנה ש-simulates נהיגה לפני הכביש." },
  spontaneous: { h: "ספונטני, לא מתוכנן. החלטה spontaneous לקפוץ לים." },
  subsequently: { h: "לאחר מכן. הוא נפצע, subsequently לקח שבועיים מנוחה." },
  substantial: { h: "ניכר, רב. ירושה substantial — סכום שמשנה חיים." },
  succeed: { h: "להצליח. הוא succeeded במבחן אחרי חודשי תרגול." },
  suggest: { h: "להציע. I suggest שתתחיל מהשאלות הקלות." },
  superior: { h: "עליון, טוב יותר. איכות superior במחיר גבוה יותר." },
  surface: { h: "פני שטח. surface חלק של אגם בלי גלים." },
  surround: { h: "להקיף. הר ש-surrounded by עצים, אדם surrounded by חברים." },
  suspect: { h: "לחשוד. השוטר suspected שמשהו לא בסדר." },
  sustain: { h: "לקיים לאורך זמן. sustain קצב מהיר במרתון." },
  temporary: { h: "זמני. פתרון temporary עד שיגיע משהו קבוע." },
  thorough: { h: "יסודי, מקיף. בדיקה thorough שלא משאירה אבן לא הפוכה." },
  transparent: { h: "שקוף. זכוכית transparent שדרכה רואים הכל." },
  ultimate: { h: "סופי, אולטימטיבי. ה-ultimate goal — המטרה הסופית." },
  utilize: { h: "להשתמש ביעילות. utilize את הזמן הפנוי לתרגול." },
  valid: { h: "תקף. דרכון valid עד 2030, או טיעון valid שמחזיק לוגית." },
  vary: { h: "להשתנות, לגוון. מחירים ש-vary מחנות לחנות." },
  vast: { h: "עצום, רחב ידיים. מדבר vast שאין לו סוף לעין." },
  vital: { h: "חיוני. אוויר vital לנשימה — אי אפשר בלי." },
  whereas: { h: "בעוד ש-. אני אוהב הבנת הנקרא, whereas היא מעדיפה דקדוק." },
  withdraw: { h: "למשוך בחזרה. withdraw כסף מהבנק, או withdraw מצוות." },
  witness: { h: "עד או להיות עד. witness תאונה — לראות אותה במו עיניך." },
  yield: { h: "להניב או להיכנע. שדה ש-yields יבול, נהג ש-yields זכות קדימה." },
};

// Hebrew part-of-speech labels for the data-driven fallback
const POS_HE: Record<string, string> = {
  verb: "פועל",
  noun: "שם עצם",
  adjective: "שם תואר",
  adverb: "תואר הפועל",
  preposition: "מילת יחס",
  conjunction: "מילת חיבור",
  pronoun: "כינוי",
  phrase: "ביטוי",
  idiom: "ביטוי",
};

const EMPTY: MemoryEnrichment = {
  pronunciation: "",
  coreMeaning: "",
  memoryAnchor: "",
  collocations: [],
  exampleEn: "",
  exampleHe: "",
  confusion: "",
  retrieval: "",
};

/**
 * Returns enrichment for a vocabulary item. Always returns a meaningful,
 * word-specific learning block — hand-crafted when available, smart
 * data-driven fallback otherwise. Empty fields are hidden by the UI.
 */
export function getMemoryEnrichment(item: VocabItem): MemoryEnrichment {
  const key = item.word.trim().toLowerCase();

  // 1. Rich hand-crafted entry — best case.
  const rich = RICH_ENTRIES[key];
  if (rich) {
    return {
      ...EMPTY,
      pronunciation: item.hePronunciation ?? rich.p ?? "",
      coreMeaning: item.heCoreMeaning ?? rich.core,
      memoryAnchor: item.heMemoryAnchor ?? rich.anchor,
      collocations: item.commonCollocations ?? rich.coll,
      exampleEn: item.exampleSentenceEn ?? item.exampleSentence ?? rich.ex,
      exampleHe: item.exampleSentenceHe ?? item.exampleSentenceHebrew ?? rich.exHe,
      confusion: item.commonConfusion ?? rich.conf ?? "",
      retrieval: item.retrievalQuestion ?? rich.rq ?? buildRetrieval(item.word),
    };
  }

  // 2. Light hint — auto-promoted into the richer shape.
  const light = LIGHT_HINTS[key];
  if (light) {
    const primary = primaryMeaning(item.hebrewTranslation);
    return {
      ...EMPTY,
      pronunciation: item.hePronunciation ?? light.p ?? "",
      coreMeaning: item.heCoreMeaning ?? light.h,
      memoryAnchor: item.heMemoryAnchor ?? `${item.word} = ${primary}`,
      collocations: item.commonCollocations ?? [],
      exampleEn: item.exampleSentenceEn ?? item.exampleSentence ?? "",
      exampleHe: item.exampleSentenceHe ?? item.exampleSentenceHebrew ?? "",
      confusion: item.commonConfusion ?? "",
      retrieval: item.retrievalQuestion ?? buildRetrieval(item.word),
    };
  }

  // 3. Per-item override (future-proofing) — if the seed gets enriched.
  if (item.heCoreMeaning || item.heMemoryHint) {
    return {
      ...EMPTY,
      pronunciation: item.hePronunciation ?? "",
      coreMeaning: item.heCoreMeaning ?? item.heMemoryHint ?? "",
      memoryAnchor: item.heMemoryAnchor ?? `${item.word} = ${primaryMeaning(item.hebrewTranslation)}`,
      collocations: item.commonCollocations ?? [],
      exampleEn: item.exampleSentenceEn ?? item.exampleSentence ?? "",
      exampleHe: item.exampleSentenceHe ?? item.exampleSentenceHebrew ?? "",
      confusion: item.commonConfusion ?? "",
      retrieval: item.retrievalQuestion ?? buildRetrieval(item.word),
    };
  }

  // 4. Smart fallback — word-specific block from seed data.
  return buildFallback(item);
}

function buildFallback(item: VocabItem): MemoryEnrichment {
  const word = item.word;
  const primary = primaryMeaning(item.hebrewTranslation);
  const all = item.hebrewTranslation;

  // Core meaning — choose the best shape based on available data
  let core: string;
  if (all && (all.includes(";") || all.includes(","))) {
    core = `${word} יכול להיות ${all}. בחר את המשמעות שמתאימה להקשר.`;
  } else if (item.partOfSpeech) {
    const pos = POS_HE[item.partOfSpeech.toLowerCase()] ?? "";
    if (pos === "פועל") {
      core = `${word}: פועל שמשמעותו "${primary}".`;
    } else if (pos === "שם תואר") {
      core = `${word}: תואר שמתאר "${primary}".`;
    } else if (pos === "שם עצם") {
      core = `${word}: שם עצם — ${primary}.`;
    } else if (pos === "תואר הפועל") {
      core = `${word}: תואר הפועל שמתאר *איך* — ${primary}.`;
    } else if (pos === "מילת חיבור") {
      core = `${word}: מילת חיבור — ${primary}.`;
    } else {
      core = `${word}: ${primary}.`;
    }
  } else {
    core = `${word}: ${primary}.`;
  }

  // Memory anchor — short, always word-specific
  const anchor = `${word} = ${primary}`;

  // Collocations — derive from synonyms when we have them
  const collocations: string[] = [];
  if (item.synonyms?.length) {
    collocations.push(...item.synonyms.slice(0, 3));
  }

  return {
    pronunciation: item.hePronunciation ?? "",
    coreMeaning: item.heCoreMeaning ?? core,
    memoryAnchor: item.heMemoryAnchor ?? anchor,
    collocations: item.commonCollocations ?? collocations,
    exampleEn: item.exampleSentenceEn ?? item.exampleSentence ?? "",
    exampleHe: item.exampleSentenceHe ?? item.exampleSentenceHebrew ?? "",
    confusion: item.commonConfusion ?? buildConfusion(item),
    retrieval: item.retrievalQuestion ?? buildRetrieval(word),
  };
}

function buildConfusion(item: VocabItem): string {
  // Only show confusion when the seed gives us a meaningful confusable pair.
  if (item.confusingWords && item.confusingWords.length > 0) {
    return `${item.word} ≠ ${item.confusingWords[0]}.`;
  }
  return "";
}

function buildRetrieval(word: string): string {
  // Compact, generic-but-word-specific recall prompt.
  return `שאלת שליפה: איך תשתמש ב-${word} במשפט?`;
}

function primaryMeaning(hebrewTranslation: string): string {
  return (hebrewTranslation || "").split(/[;,]/)[0].trim() || "";
}
