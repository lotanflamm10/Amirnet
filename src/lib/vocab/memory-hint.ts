/**
 * Vocabulary card enrichment: per-word Hebrew memory hints + optional
 * Hebrew pronunciation.
 *
 * Strategy:
 *   1. Hand-crafted natural-Hebrew hints for the most common AMIRAM
 *      vocabulary words live in HAND_CRAFTED_HINTS.
 *   2. Words without a hand-crafted entry get a smart, data-driven
 *      fallback built from the word's own translation / example /
 *      synonyms / antonyms / part-of-speech. Never a generic template,
 *      never an auto-transliteration of the English word.
 *   3. Pronunciation is shown ONLY when it appears in a hand-crafted
 *      entry — auto-transliterated pronunciation was ugly and is gone.
 */

import type { VocabItem } from "@/types/vocab";

export interface MemoryEnrichment {
  /** Hebrew letter pronunciation. Empty string when not available. */
  pronunciation: string;
  /** Short, word-specific Hebrew memory hint. */
  memoryHint: string;
  /** Short Hebrew context sentence / usage prompt. */
  contextSentence: string;
}

// ─── Hand-crafted hints ─────────────────────────────────────────────────────
//
// Each entry is a natural Hebrew sentence with a vivid, word-specific
// connection — analogy, real-life scenario, word family, contrast, image.
// Pronunciation is optional and only added where it actually helps a
// Hebrew speaker pronounce the English word.
//
// Coverage focus: the highest-frequency AMIRAM/AMIRNET words a learner
// is likely to see in a typical session.
//
// Keys are lowercased English words.
interface Hint { p?: string; h: string; c?: string }

const HAND_CRAFTED_HINTS: Record<string, Hint> = {
  abandon: {
    h: "abandon = לנטוש לגמרי. דמיין מכונית ישנה שנעזבה בצד הדרך עם מנעולים מחלידים.",
    c: "הוא החליט שלא to abandon את החלום, גם כשזה היה קשה.",
  },
  abbreviate: {
    h: "abbreviate פירושו להפוך משהו ארוך לקצר, כמו לכתוב 'info' במקום 'information'.",
  },
  ability: {
    h: "ability היא היכולת המעשית של אדם לעשות משהו — ability לרוץ 10 ק״מ, ability לפתור חידה.",
  },
  abolish: {
    h: "abolish = לבטל באופן רשמי לחלוטין, כמו חוק ישן שנמחק מספר החוקים.",
  },
  abrupt: {
    h: "abrupt זה משהו פתאומי וחד, כמו עצירה abrupt של מכונית באמצע הכביש.",
  },
  abundant: {
    h: "abundant = יש בשפע. דמיין שולחן חג עמוס באוכל — abundant food.",
  },
  accept: {
    h: "accept זה לקבל ברצון — accept מתנה, accept הזמנה, accept הצעת עבודה.",
  },
  access: {
    h: "access זה כניסה או גישה — כרטיס שנותן לך access לבניין.",
  },
  accidental: {
    h: "accidental = במקרה, לא מתוכנן. גילוי accidental כמו פניצילין.",
  },
  accommodate: {
    h: "accommodate זה לארח או להתאים — מלון שיכול to accommodate 200 אורחים.",
  },
  accomplish: {
    h: "accomplish = להשלים משימה בהצלחה. רץ שעבר את הקו — he accomplished his goal.",
  },
  accurate: {
    h: "accurate שייך לדיוק. תשובה accurate פוגעת בדיוק במטרה, בלי להחמיץ.",
  },
  accuse: {
    h: "accuse זה להאשים מישהו במעשה רע, כמו במשפט בבית משפט.",
  },
  achieve: {
    h: "achieve = להגיע למטרה אחרי מאמץ. ספורטאי שעמד על דוכן המנצחים — he achieved gold.",
  },
  acknowledge: {
    h: "acknowledge זה להכיר במשהו או באמת — להניד בראש ולאשר 'כן, אתה צודק'.",
  },
  acquire: {
    h: "acquire = לרכוש או לקנות, גם ידע. acquire safiton חדש, acquire מיומנות חדשה.",
  },
  adapt: {
    h: "adapt זה להתאים את עצמך למצב חדש — חייל שהגיע למדבר ולמד adapt לחום.",
  },
  adequate: {
    h: "adequate = מספיק, אבל לא יותר מזה. ארוחת adequate משביעה — לא חגיגה.",
  },
  adjust: {
    h: "adjust זה לכוון בעדינות — adjust את ההגה של האופניים בגובה הנכון.",
  },
  admit: {
    h: "admit = להודות באמת לא נוחה, כמו ילד שמודה שהוא שבר את האגרטל.",
  },
  adopt: {
    h: "adopt זה לאמץ — לאמץ ילד, אבל גם adopt שיטה חדשה או רעיון.",
  },
  advance: {
    h: "advance = להתקדם. צבא ש-advances קדימה לעבר היעד, או טכנולוגיה שעושה advance.",
  },
  adverse: {
    h: "adverse = שלילי, לא נוח. תנאי מזג אוויר adverse עוצרים טיסות.",
  },
  affect: {
    h: "affect זה להשפיע על. הגשם affected את התוכניות שלי לים.",
  },
  affluent: {
    h: "affluent = עשיר ושופע. שכונה affluent עם בתי פאר ובריכות.",
  },
  although: {
    h: "although פותח ניגוד: 'למרות ש-'. Although היה קר, יצאנו לטיול.",
  },
  ambiguous: {
    h: "ambiguous = דו-משמעי, אפשר להבין בכמה דרכים. תשובה ambiguous משאירה אותך מבולבל.",
  },
  ambition: {
    h: "ambition = שאיפה גדולה. הילד עם ambition להיות אסטרונאוט.",
  },
  analyze: {
    h: "analyze זה לפרק לחלקים ולבחון. מדען analyzes דגימת דם תחת מיקרוסקופ.",
  },
  ancient: {
    h: "ancient = עתיק מאוד, אלפי שנים. שרידים ancient של מצרים העתיקה.",
  },
  annoy: {
    h: "annoy זה להציק או להרגיז קצת — יתוש ש-annoys אותך בלילה.",
  },
  anticipate: {
    h: "anticipate = לצפות מראש למשהו. ילדים ש-anticipate את החופש הגדול.",
  },
  apparent: {
    h: "apparent = נראה לעין, ברור. הסיבה הייתה apparent לכל מי שהסתכל.",
  },
  appeal: {
    h: "appeal זה גם פנייה וגם משיכה — מוצר עם appeal לצעירים, או appeal לעזרה.",
  },
  apply: {
    h: "apply = להגיש בקשה או ליישם. apply לעבודה, apply את החוק על מקרה חדש.",
  },
  appreciate: {
    h: "appreciate זה להעריך את הטוב — appreciate ידיד אמיתי, appreciate כוס קפה בבוקר.",
  },
  approach: {
    h: "approach = לגשת אל, להתקרב. גם הגישה לפתרון בעיה — איזה approach לנקוט?",
  },
  appropriate: {
    h: "appropriate = מתאים, ראוי. בגד appropriate לחתונה — לא ג'ינס וכפכפים.",
  },
  approve: {
    h: "approve זה לאשר רשמית. הבוס approved את החופשה שלך.",
  },
  argue: {
    h: "argue = להתווכח או לטעון. עורך דין ש-argues עם השופט בבית משפט.",
  },
  arise: {
    h: "arise = לקום, לצוץ. בעיות arise כשלא מתכננים מראש.",
  },
  arrogant: {
    h: "arrogant = יהיר, מתנשא. אדם arrogant חושב שהוא תמיד יודע יותר טוב.",
  },
  aspire: {
    h: "aspire = לשאוף גבוה. סטודנט ש-aspires להיות רופא.",
  },
  assemble: {
    h: "assemble זה להרכיב או להתאסף — assemble ארון מאיקאה, או צבא ש-assembles ליציאה.",
  },
  assert: {
    h: "assert = להצהיר בנחישות, לטעון בתוקף. הוא asserted שהוא חף מפשע.",
  },
  assess: {
    h: "assess = להעריך שווי או רמה. שמאי ש-assesses את ערך הדירה.",
  },
  assist: {
    h: "assist = לעזור. חובש ש-assists את הרופא בניתוח.",
  },
  assume: {
    h: "assume = להניח בלי לבדוק. אל תניח שכולם יודעים — תשאל. גם 'לקבל אחריות'.",
  },
  attain: {
    h: "attain = להשיג אחרי מאמץ ארוך. attain תואר, attain חלום של שנים.",
  },
  attempt: {
    h: "attempt = ניסיון. an attempt to שבור שיא, גם אם זה לא הצליח.",
  },
  attribute: {
    h: "attribute = לייחס משהו לסיבה. הצלחתו attributed לעבודה קשה ולמזל.",
  },
  authentic: {
    h: "authentic = אמיתי, לא חיקוי. שעון authentic מהמותג, לא זיוף.",
  },
  available: {
    h: "available = זמין, פנוי. רופא שהוא available לפגישה ביום שלישי.",
  },
  avoid: {
    h: "avoid = להימנע, לעקוף. avoid פקקים בכביש על ידי יציאה מוקדמת.",
  },
  aware: {
    h: "aware = מודע, יודע. נהג aware לסכנה אוחז בהגה חזק יותר.",
  },
  beneath: {
    h: "beneath = מתחת ל-. החתול ישן beneath the table, מתחת לשולחן.",
  },
  benefit: {
    h: "benefit = תועלת. ה-benefit של תרגול יומי הוא שיפור אמיתי לאורך זמן.",
  },
  brief: {
    h: "brief = קצר, תמציתי. הרצאה brief של 5 דקות — ישר ולעניין.",
  },
  burden: {
    h: "burden = נטל כבד. דמיין אדם הולך עם תיק ענק על הגב — that's a burden.",
  },
  capable: {
    h: "capable = מסוגל. אדם capable של פתרון בעיות מורכבות.",
  },
  cease: {
    h: "cease = להפסיק לחלוטין. cease fire — הפסקת אש, סוף לחימה.",
  },
  challenge: {
    h: "challenge זה אתגר. ריצת מרתון היא challenge פיזית ומנטלית.",
  },
  characteristic: {
    h: "characteristic = תכונה אופיינית. צחוק רם הוא characteristic שלו שכולם מזהים.",
  },
  clarify: {
    h: "clarify = להבהיר, להפוך ברור. המורה clarified את ההוראות פעמיים.",
  },
  clear: {
    p: "קְלִיר",
    h: "clear = ברור, נקי. דמיין חלון נקי לחלוטין — clear glass שדרכו רואים הכל.",
    c: "ביום הראשון בעבודה לא היה לי clear מה צריך לעשות.",
  },
  collapse: {
    h: "collapse = להתמוטט. בניין ישן ש-collapsed ברעידת אדמה, או חבר ש-collapsed מעייפות.",
  },
  combine: {
    h: "combine = לחבר יחד. combine שמן וחומץ → סלט. combine רעיונות → פתרון.",
  },
  commit: {
    h: "commit = להתחייב או לבצע. commit לקשר, commit פשע (לבצע אותו).",
  },
  compel: {
    h: "compel = להכריח, לכפות. נסיבות ש-compel אותך לעזוב את הבית.",
  },
  compensate: {
    h: "compensate = לפצות. חברת ביטוח ש-compensates על נזק לרכב.",
  },
  competent: {
    h: "competent = כשיר, מקצועי. עובד competent יודע את העבודה ועושה אותה היטב.",
  },
  complex: {
    h: "complex = מורכב, רב-רובדי. בעיה complex עם הרבה פרטים שצריך לפרק.",
  },
  comply: {
    h: "comply = לציית, לעמוד בדרישה. נהג ש-complies with the speed limit.",
  },
  concise: {
    h: "concise = תמציתי. סיכום concise תופס את העיקר במעט מילים.",
  },
  conclude: {
    h: "conclude = להסיק או לסיים. הוא concluded שהמכונית בוצעה — מסקנה הגיונית.",
  },
  condemn: {
    h: "condemn = לגנות בחריפות. ארגון בינלאומי condemned את ההפרה של זכויות אדם.",
  },
  confess: {
    h: "confess = להתוודות. ילד ש-confesses שהוא אכל את העוגה.",
  },
  confine: {
    h: "confine = להגביל למקום. אסיר confined לתאו, ביקור confined ל-30 דקות.",
  },
  confirm: {
    h: "confirm = לאשר רשמית. אימייל ש-confirms את ההזמנה שלך.",
  },
  confront: {
    h: "confront = להתעמת. בסוף הוא decided to confront את הבעיה במקום לברוח.",
  },
  consider: {
    h: "consider = לשקול במחשבה. consider את כל האפשרויות לפני שאתה בוחר.",
  },
  consequently: {
    h: "consequently = כתוצאה מכך. ירד גשם, consequently המשחק בוטל.",
  },
  considerable: {
    h: "considerable = ניכר, גדול במידה. כסף considerable — סכום שמרגישים.",
  },
  consistent: {
    h: "consistent = עקבי. מתאמן consistent מגיע לאימון 4 פעמים בשבוע, כל שבוע.",
  },
  constitute: {
    h: "constitute = להוות, להרכיב. 12 חודשים constitute שנה אחת.",
  },
  constrain: {
    h: "constrain = להגביל, לכבול. תקציב נמוך ש-constrains את התוכניות שלך.",
  },
  construct: {
    h: "construct = לבנות, לבנות בצעדים. constructing בניין לבנה אחר לבנה.",
  },
  consume: {
    h: "consume = לצרוך, לכלות. גוף שצורך מזון, או מכונית ש-consumes דלק.",
  },
  contain: {
    h: "contain = מכיל בתוכו. הקופסה contains 12 ביצים, החלב contains סידן.",
  },
  contemplate: {
    h: "contemplate = להרהר בעמקות. הוא contemplated את ההחלטה לילה שלם.",
  },
  contend: {
    h: "contend = להתחרות או לטעון. צוותים ש-contend על הגביע, או טוען ש-contends במשפט.",
  },
  contrary: {
    h: "contrary = הפוך, מנוגד. on the contrary — להפך, ההיפך הוא הנכון.",
  },
  contribute: {
    h: "contribute = לתרום. כל חבר contributes לפרויקט עם רעיונות משלו.",
  },
  controversial: {
    h: "controversial = שנוי במחלוקת. נושא controversial מעלה ויכוחים סוערים.",
  },
  convey: {
    h: "convey = להעביר מסר או חפץ. רכבת ש-conveys סחורה, או דיבור ש-conveys רגש.",
  },
  cope: {
    h: "cope = להתמודד בהצלחה. הורה ש-copes with שלושה ילדים קטנים בו זמנית.",
  },
  crucial: {
    h: "crucial = קריטי, מכריע. שלב crucial במשחק — נקודה אחת תכריע את התוצאה.",
  },
  decline: {
    h: "decline = ירידה או סירוב. decline של מכירות, או decline להזמנה.",
  },
  deliberate: {
    h: "deliberate = מכוון, מתוכנן. שגיאה deliberate, לא טעות מקרית.",
  },
  demonstrate: {
    h: "demonstrate = להדגים, להראות בפעולה. demo = הדגמה, demonstrate הנוסחה על הלוח.",
  },
  deny: {
    h: "deny = להכחיש או לסרב. הוא denied שהוא היה במקום, או deny גישה לחדר.",
  },
  depend: {
    h: "depend = להיות תלוי. תינוק שלם תלוי בהורים — depends on them.",
  },
  derive: {
    h: "derive = להפיק, להגיע מ-. derive מסקנה מהראיות, או derive הנאה מקריאה.",
  },
  describe: {
    h: "describe = לתאר. עד שה-describes את החשוד למשטרה — שיער שחור, גובה ממוצע.",
  },
  despite: {
    h: "despite = למרות. despite the rain, יצאנו לטיול.",
  },
  detect: {
    h: "detect = לזהות, לאתר. כלב ש-detects ריח חשוד, או חיישן ש-detects עשן.",
  },
  determine: {
    h: "determine = לקבוע. הציון determines את הקבלה לאוניברסיטה.",
  },
  diminish: {
    h: "diminish = להפחית, להצטמצם. עניין ש-diminishes עם הזמן.",
  },
  distinct: {
    h: "distinct = ברור, שונה במובהק. ריח distinct של תפוח שעולה מהסל.",
  },
  diverse: {
    h: "diverse = מגוון. עיר diverse עם תושבים מתרבויות שונות.",
  },
  doubt: {
    h: "doubt = ספק. יש לי doubts אם זה רעיון טוב — אני לא בטוח.",
  },
  durable: {
    h: "durable = עמיד לאורך זמן. נעלי הליכה durable שמחזיקות שנים.",
  },
  efficient: {
    h: "efficient = יעיל. מנוע efficient מפיק הרבה תוצאה מעט אנרגיה.",
  },
  emerge: {
    h: "emerge = לצוץ, להופיע. צוללת ש-emerges מתחת למים, או מנהיג שצץ מתוך הקהל.",
  },
  emphasize: {
    h: "emphasize = להדגיש. emphasize בקול רם או באותיות מודגשות — שים לב לזה!",
  },
  encounter: {
    h: "encounter = להיתקל. מטייל ש-encounters דב ביער.",
  },
  endure: {
    h: "endure = לסבול בסבלנות, להחזיק מעמד. חייל ש-endures אימון קשה.",
  },
  enforce: {
    h: "enforce = לאכוף. שוטר ש-enforces חוקי תנועה ברחוב.",
  },
  enhance: {
    h: "enhance = לשפר, להעצים. תוסף ש-enhances את הצבעים בתמונה.",
  },
  enormous: {
    h: "enormous = ענק, עצום. פיל הוא יצור enormous, או בעיה enormous שדורשת פתרון.",
  },
  ensure: {
    h: "ensure = לוודא. ensure שדלת ננעלה לפני יציאה.",
  },
  entirely: {
    h: "entirely = לחלוטין, במלואו. החדר היה entirely ריק — לא נשאר אפילו רהיט אחד.",
  },
  equivalent: {
    h: "equivalent = שווה ערך. דולר equivalent ל-3.7 שקלים בערך.",
  },
  essential: {
    h: "essential = הכרחי, חיוני. מים essential לחיים — אי אפשר בלעדיהם.",
  },
  establish: {
    h: "establish = להקים, לבסס. establish חברה חדשה, establish שם טוב במקצוע.",
  },
  evaluate: {
    h: "evaluate = להעריך באופן שיטתי. מורה ש-evaluates עבודות עם רובריקה.",
  },
  evident: {
    h: "evident = ברור לעין. הכאב שלו היה evident מההבעה על פניו.",
  },
  evoke: {
    h: "evoke = לעורר רגש או זיכרון. ריח של עוגה evokes זכרונות ילדות.",
  },
  exceed: {
    h: "exceed = לעלות על, לחרוג. exceeded the speed limit — נהג מעל המהירות.",
  },
  exhibit: {
    h: "exhibit = להציג. מוזיאון ש-exhibits יצירות אמנות, או עובד ש-exhibits מקצועיות.",
  },
  expand: {
    h: "expand = להתרחב, להתפשט. expand זה כמו בלון שמתנפח ונהיה רחב יותר.",
  },
  exploit: {
    h: "exploit = לנצל. exploit הזדמנות (טוב), exploit עובדים (רע).",
  },
  expose: {
    h: "expose = לחשוף. כתב ש-exposes שחיתות, או צילום שמצריך expose לאור.",
  },
  extend: {
    h: "extend = להאריך. extend חופשה, extend יד לעזרה.",
  },
  facilitate: {
    h: "facilitate = להקל, לאפשר. מתורגמן ש-facilitates שיחה בין שתי שפות.",
  },
  familiar: {
    h: "familiar = מוכר. רחוב familiar שאתה זוכר מילדות.",
  },
  fascinate: {
    h: "fascinate = להקסים. ילד ש-fascinated by דינוזאורים, לא מפסיק לקרוא עליהם.",
  },
  feasible: {
    h: "feasible = ישים, אפשרי לביצוע. תוכנית feasible עם משאבים ולוח זמנים סבירים.",
  },
  flexible: {
    h: "flexible = גמיש. גוף flexible של מתעמלת, או שעות עבודה flexible.",
  },
  fragile: {
    h: "fragile = שביר, עדין. דמיין כוס זכוכית דקה עם מדבקה fragile — נגיעה חזקה והיא נשברת.",
  },
  fundamental: {
    h: "fundamental = יסודי, בסיסי. הבנת השורש היא fundamental להבנת המילה.",
  },
  furthermore: {
    h: "furthermore = יתר על כן, בנוסף. מוסיף עוד טיעון: 'ועוד דבר...'",
  },
  generate: {
    h: "generate = ליצור, להפיק. גנרטור ש-generates חשמל, או רעיון ש-generates עניין.",
  },
  generous: {
    h: "generous = נדיב. אדם generous שתורם זמן וכסף לזולת.",
  },
  genuine: {
    h: "genuine = אמיתי, כן. חיוך genuine שמגיע מהלב, לא חיקוי.",
  },
  gradually: {
    h: "gradually = בהדרגה, לאט. השמש gradually שוקעת — לא בבת אחת.",
  },
  hesitate: {
    h: "hesitate = להסס. הוא hesitated רגע לפני שקפץ למים הקרים.",
  },
  hostile: {
    h: "hostile = עוין, אגרסיבי. שכן hostile שצועק מעבר לגדר.",
  },
  identify: {
    h: "identify = לזהות. עד ש-identifies את החשוד מבין תמונות.",
  },
  imply: {
    h: "imply = לרמוז בלי לומר במפורש. הוא implied שיש בעיה, בלי להגיד מה.",
  },
  inevitable: {
    h: "inevitable = בלתי נמנע. מוות הוא inevitable — אי אפשר לברוח ממנו.",
  },
  influence: {
    h: "influence = השפעה. מורה טוב has influence על תלמידיו לכל החיים.",
  },
  inherent: {
    h: "inherent = טבוע, מובנה. סקרנות inherent בילדים קטנים — זה חלק מהטבע שלהם.",
  },
  initiate: {
    h: "initiate = ליזום, להתחיל תהליך. הוא initiated שיחה עם הזר.",
  },
  intense: {
    h: "intense = חזק, עוצמתי. אימון intense שמשאיר אותך מותש.",
  },
  involve: {
    h: "involve = לערב, לכלול. הפרויקט involves צוות של 5 אנשים.",
  },
  justify: {
    h: "justify = להצדיק. הוא tried to justify את האיחור עם תירוץ של פקק.",
  },
  maintain: {
    h: "maintain = לשמור, לתחזק. maintain את הרכב כדי שיעבוד, maintain קשר עם חבר.",
  },
  modify: {
    h: "modify = לשנות במידה. מתכון שעבר modify — פחות סוכר, יותר תבלינים.",
  },
  mutual: {
    h: "mutual = הדדי. כבוד mutual — שניהם מכבדים אחד את השני.",
  },
  obtain: {
    h: "obtain = להשיג, לקבל. obtain רישיון נהיגה אחרי מבחן.",
  },
  obvious: {
    h: "obvious = ברור מאליו. התשובה הייתה obvious אחרי שקראתי שוב.",
  },
  occur: {
    h: "occur = לקרות, להתרחש. תאונה ש-occurred על הכביש המהיר.",
  },
  particular: {
    h: "particular = מסוים, ייחודי. אני מחפש particular מילה — לא סתם דומה.",
  },
  perceive: {
    h: "perceive = לתפוס בחושים או בהבנה. perceive סכנה לפני שהיא מתרחשת.",
  },
  persist: {
    h: "persist = להתמיד. הוא persisted גם כשכולם אמרו שזה בלתי אפשרי.",
  },
  perspective: {
    h: "perspective = נקודת מבט, זווית. מ-perspective אחרת הבעיה נראית אחרת.",
  },
  persuade: {
    h: "persuade = לשכנע. הוא persuaded אותי לבוא לסרט — שינה לי את הדעה.",
  },
  precise: {
    h: "precise = מדויק. הוראות precise: לערבב 3 דקות בדיוק, לא 2 ולא 4.",
  },
  prevent: {
    h: "prevent = למנוע. גדר ש-prevents כניסה, או חיסון ש-prevents מחלה.",
  },
  prior: {
    h: "prior = קודם, מוקדם יותר. prior to the meeting — לפני הפגישה.",
  },
  proceed: {
    h: "proceed = להמשיך, להתקדם. proceed to the gate — המשך לשער. גם 'לפעול'.",
  },
  prominent: {
    h: "prominent = בולט, מכובד. דמות prominent בעיר — כולם מכירים אותה.",
  },
  propose: {
    h: "propose = להציע. הוא proposed רעיון, או proposed נישואים.",
  },
  reduce: {
    h: "reduce = להפחית. reduce הוצאות, reduce סוכר בקפה.",
  },
  refer: {
    h: "refer = להתייחס או להפנות. רופא ש-refers אותך למומחה.",
  },
  reflect: {
    h: "reflect = לשקף או להרהר. מראה ש-reflects דמות, או שקט ל-reflect on the day.",
  },
  reject: {
    h: "reject = לדחות. מוצר faulty ש-rejected בסוף הקו, או הצעה ש-rejected.",
  },
  relevant: {
    h: "relevant = רלוונטי, קשור. מידע relevant לנושא — לא סיפור צדדי.",
  },
  reluctant: {
    h: "reluctant = מהסס, לא נלהב. תלמיד reluctant לענות מול הכיתה.",
  },
  remain: {
    h: "remain = להישאר. רק שני נגנים remained על הבמה בסוף הקונצרט.",
  },
  remarkable: {
    h: "remarkable = ראוי לציון. ביצוע remarkable של זמרת בת 10 — מדהים לגיל הזה.",
  },
  require: {
    h: "require = לדרוש. עבודה ש-requires תואר ראשון לפחות.",
  },
  resemble: {
    h: "resemble = להיות דומה. הילד resembles את אביו — אותה צורת אף.",
  },
  resist: {
    h: "resist = להתנגד, לעמוד בפיתוי. resist עוגה בדיאטה.",
  },
  resolve: {
    h: "resolve = לפתור או החלטה איתנה. resolve סכסוך, או New Year's resolution.",
  },
  retain: {
    h: "retain = לשמור, להחזיק. retain את הקבלה ל-30 יום, retain מידע בזיכרון.",
  },
  reveal: {
    h: "reveal = לחשוף. הקוסם revealed את הסוד מאחורי הטריק.",
  },
  rigid: {
    h: "rigid = נוקשה, לא גמיש. כללים rigid שאין להם חריגים.",
  },
  significant: {
    h: "significant = משמעותי. ההבדל בין התשובות היה significant — לא טכני בלבד.",
  },
  similar: {
    h: "similar = דומה. שני שירים שהם similar במנגינה אבל שונים במילים.",
  },
  simulate: {
    h: "simulate = לדמות, לחקות. תוכנה ש-simulates נהיגה לפני שיוצאים לכביש אמיתי.",
  },
  spontaneous: {
    h: "spontaneous = ספונטני, לא מתוכנן. החלטה spontaneous לקפוץ לים.",
  },
  subsequently: {
    h: "subsequently = לאחר מכן. הוא נפצע, subsequently לקח שבועיים מנוחה.",
  },
  substantial: {
    h: "substantial = ניכר, רב. ירושה substantial — סכום שמשנה חיים.",
  },
  succeed: {
    h: "succeed = להצליח. הוא succeeded במבחן אחרי חודשי תרגול.",
  },
  sufficient: {
    h: "sufficient = מספיק. זמן sufficient להכנת ארוחה — לא צריך לרוץ.",
  },
  suggest: {
    h: "suggest = להציע. I suggest שתתחיל מהשאלות הקלות.",
  },
  superior: {
    h: "superior = עליון, טוב יותר. איכות superior במחיר גבוה יותר.",
  },
  surface: {
    h: "surface = פני שטח. surface חלק של אגם בלי גלים, או 'לצוץ' (במים).",
  },
  surround: {
    h: "surround = להקיף. הר ש-surrounded by עצים, או אדם surrounded by חברים.",
  },
  suspect: {
    h: "suspect = לחשוד. השוטר suspected שמשהו לא בסדר עם התשובה שלו.",
  },
  sustain: {
    h: "sustain = לקיים לאורך זמן. sustain קצב מהיר במרתון, sustain פגיעה ולהמשיך.",
  },
  temporary: {
    h: "temporary = זמני. פתרון temporary עד שיגיע משהו קבוע.",
  },
  thorough: {
    h: "thorough = יסודי, מקיף. בדיקה thorough שלא משאירה אבן לא הפוכה.",
  },
  transparent: {
    h: "transparent = שקוף. זכוכית transparent שדרכה רואים הכל, או תהליך transparent וגלוי.",
  },
  ultimate: {
    h: "ultimate = סופי, אולטימטיבי. ה-ultimate goal — המטרה הסופית של הכל.",
  },
  utilize: {
    h: "utilize = להשתמש ביעילות. utilize את הזמן הפנוי לתרגול.",
  },
  vague: {
    h: "vague = מעורפל, לא ברור. הסבר vague שמשאיר אותך מבולבל מתמיד.",
  },
  valid: {
    h: "valid = תקף. דרכון valid עד 2030, או טיעון valid שמחזיק לוגית.",
  },
  vary: {
    h: "vary = להשתנות, לגוון. מחירים ש-vary מחנות לחנות.",
  },
  vast: {
    h: "vast = עצום, רחב ידיים. מדבר vast שאין לו סוף לעין.",
  },
  vital: {
    h: "vital = חיוני. אוויר vital לנשימה — אי אפשר בלי.",
  },
  vulnerable: {
    h: "vulnerable = פגיע. תינוק vulnerable דורש הגנה מתמדת.",
  },
  whereas: {
    h: "whereas = בעוד ש-. אני אוהב הבנת הנקרא, whereas היא מעדיפה דקדוק.",
  },
  withdraw: {
    h: "withdraw = למשוך בחזרה. withdraw כסף מהבנק, או withdraw מצוות.",
  },
  witness: {
    h: "witness = עד או להיות עד. witness תאונה — לראות אותה במו עיניך.",
  },
  yield: {
    h: "yield = להניב או להיכנע. שדה ש-yields יבול, או נהג ש-yields זכות קדימה.",
  },
};

// ─── Hebrew part-of-speech labels for the fallback ──────────────────────────
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

/**
 * Returns enrichment for a vocabulary item. Always returns a meaningful
 * memory hint — hand-crafted when available, data-driven otherwise.
 */
export function getMemoryEnrichment(item: VocabItem): MemoryEnrichment {
  const key = item.word.trim().toLowerCase();
  const hand = HAND_CRAFTED_HINTS[key];

  if (hand) {
    return {
      pronunciation: item.hePronunciation ?? hand.p ?? "",
      memoryHint: item.heMemoryHint ?? hand.h,
      contextSentence: item.heContextSentence ?? hand.c ?? "",
    };
  }

  // Per-item override wins if present (future-proofing for enriched seed data).
  if (item.heMemoryHint) {
    return {
      pronunciation: item.hePronunciation ?? "",
      memoryHint: item.heMemoryHint,
      contextSentence: item.heContextSentence ?? "",
    };
  }

  return {
    pronunciation: "",
    memoryHint: buildFallbackHint(item),
    contextSentence: buildFallbackContext(item),
  };
}

/**
 * Builds a short, word-specific Hebrew memory hint from whatever data
 * the seed gives us. Never generic — always uses the word's own
 * translation/example/synonym/antonym/POS.
 */
function buildFallbackHint(item: VocabItem): string {
  const word = item.word;
  const meaning = primaryMeaning(item.hebrewTranslation);
  const allMeanings = item.hebrewTranslation;

  // Best: example sentence (concrete usage)
  if (item.exampleSentence && item.exampleSentence.length <= 130) {
    return `${word} = ${meaning}. בהקשר: "${item.exampleSentence}"`;
  }

  // Good: contrast with an antonym
  if (item.antonyms && item.antonyms.length > 0) {
    return `${word} = ${meaning}, ההפך מ-${item.antonyms[0]}.`;
  }

  // Good: link to a known synonym
  if (item.synonyms && item.synonyms.length > 0) {
    const syns = item.synonyms.slice(0, 2).join(", ");
    return `${word} = ${meaning}. דומה ל-${syns}.`;
  }

  // Use part-of-speech to shape the sentence naturally
  const pos = item.partOfSpeech ? POS_HE[item.partOfSpeech.toLowerCase()] : "";
  if (pos === "פועל") {
    return `${word} פירושו "${meaning}". זה הפועל שמתאר את הפעולה — נסה לחשוב מתי תשתמש בה.`;
  }
  if (pos === "שם תואר") {
    return `${word} הוא ${meaning} — תכונה שמתארת אדם, חפץ או מצב.`;
  }
  if (pos === "שם עצם") {
    return `${word} הוא ${meaning}. דמיין דוגמה ספציפית של ${meaning} שאתה מכיר.`;
  }
  if (pos === "תואר הפועל") {
    return `${word} = ${meaning}. תואר הפועל שמתאר *איך* משהו קורה.`;
  }
  if (pos === "מילת חיבור") {
    return `${word} = ${meaning}. מחבר בין שני חלקי משפט.`;
  }

  // Multiple meanings: highlight that
  if (allMeanings.includes(";") || allMeanings.includes(",")) {
    return `${word} יכול להיות ${allMeanings}. בחר את המשמעות שמתאימה להקשר.`;
  }

  // Last resort: simple meaning sentence (still word-specific)
  return `${word} = ${meaning}.`;
}

function buildFallbackContext(item: VocabItem): string {
  if (item.exampleSentence && item.exampleSentence.length <= 130) return item.exampleSentence;
  return "";
}

function primaryMeaning(hebrewTranslation: string): string {
  return (hebrewTranslation || "").split(/[;,]/)[0].trim() || "";
}
