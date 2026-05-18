import { readFileSync, writeFileSync } from "fs";

const NOW = new Date().toISOString();

// For batch4, normalize as lowercase+trim only (no "to " stripping)
// so multi-word expressions like "to date" stay intact and don't conflict with "date"
function normalize(word) {
  return word.toLowerCase().trim();
}

function makeId(word) {
  return "noam_b4_" + normalize(word).replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

// Connectors from מילות קישור
// { word, hebrew, diff, group, ex? }
// group = semantic group tag
const CONNECTORS = [
  // ניגוד – Contrast
  { word: "though", hebrew: "למרות ש-", diff: "easy", group: "contrast" },
  { word: "although", hebrew: "למרות ש-", diff: "easy", group: "contrast" },
  { word: "even though", hebrew: "למרות ש-", diff: "medium", group: "contrast" },
  { word: "despite", hebrew: "למרות ה-", diff: "medium", group: "contrast" },
  { word: "in spite of", hebrew: "למרות ה-", diff: "medium", group: "contrast" },
  { word: "whereas", hebrew: "בעוד ש-", diff: "medium", group: "contrast" },
  { word: "but", hebrew: "אבל, אך, אולם", diff: "easy", group: "contrast" },
  { word: "yet", hebrew: "אולם, עדיין (לא)", diff: "medium", group: "contrast" },
  { word: "however", hebrew: "בכל זאת, אולם", diff: "easy", group: "contrast" },
  { word: "nevertheless", hebrew: "אף על פי כן", diff: "hard", group: "contrast" },
  { word: "nonetheless", hebrew: "למרות זאת", diff: "hard", group: "contrast" },
  { word: "on the one hand", hebrew: "מצד אחד", diff: "medium", group: "contrast" },
  { word: "on the other hand", hebrew: "מצד שני", diff: "medium", group: "contrast" },
  { word: "otherwise", hebrew: "אחרת", diff: "medium", group: "contrast" },

  // הוספה – Addition
  { word: "also", hebrew: "גם, כמו כן", diff: "easy", group: "addition" },
  { word: "as well as", hebrew: "וגם, כמו גם", diff: "medium", group: "addition" },
  { word: "in addition", hebrew: "בנוסף", diff: "easy", group: "addition" },
  { word: "in addition to", hebrew: "בנוסף ל-", diff: "medium", group: "addition" },
  { word: "additionally", hebrew: "בנוסף", diff: "medium", group: "addition" },
  { word: "furthermore", hebrew: "זאת ועוד, יתר על כן", diff: "hard", group: "addition" },
  { word: "moreover", hebrew: "זאת ועוד, יתר על כן", diff: "hard", group: "addition" },
  { word: "not only but also", hebrew: "לא רק...אלא גם", diff: "medium", group: "addition" },
  { word: "first of all", hebrew: "ראשית כל", diff: "easy", group: "addition" },
  { word: "to begin with", hebrew: "ראשית כל, בתחילה", diff: "medium", group: "addition" },
  { word: "firstly", hebrew: "ראשית", diff: "easy", group: "addition" },
  { word: "secondly", hebrew: "שנית", diff: "easy", group: "addition" },
  { word: "thirdly", hebrew: "שלישית", diff: "easy", group: "addition" },
  { word: "finally", hebrew: "לבסוף", diff: "easy", group: "addition" },

  // סיבה – Cause
  { word: "because", hebrew: "כי, מפני ש-", diff: "easy", group: "cause" },
  { word: "because of", hebrew: "בגלל ה-", diff: "easy", group: "cause" },
  { word: "since", hebrew: "מאחר ש-", diff: "medium", group: "cause" },
  { word: "due to", hebrew: "עקב, בגלל", diff: "medium", group: "cause" },
  { word: "owing to", hebrew: "עקב, בגלל", diff: "hard", group: "cause" },
  { word: "as", hebrew: "מכיוון ש-, היות ש-", diff: "medium", group: "cause" },
  { word: "thanks to", hebrew: "הודות ל-", diff: "medium", group: "cause" },
  { word: "leads to", hebrew: "מוביל ל-", diff: "medium", group: "cause" },
  { word: "is caused by", hebrew: "נגרם על ידי", diff: "medium", group: "cause" },
  { word: "for this reason", hebrew: "מסיבה זו", diff: "medium", group: "cause" },
  { word: "hence", hebrew: "לפיכך, לכן", diff: "hard", group: "cause" },

  // תוצאה/מסקנה – Result
  { word: "so", hebrew: "אז", diff: "easy", group: "result" },
  { word: "therefore", hebrew: "לכן", diff: "easy", group: "result" },
  { word: "thus", hebrew: "לפיכך", diff: "medium", group: "result" },
  { word: "as a result", hebrew: "כתוצאה מכך", diff: "medium", group: "result" },
  { word: "as a result of", hebrew: "כתוצאה מ-", diff: "medium", group: "result" },
  { word: "consequently", hebrew: "כתוצאה מכך, בעקבות זאת", diff: "hard", group: "result" },
  { word: "subsequently", hebrew: "לאחר מכן, בעקבות זאת", diff: "hard", group: "result" },

  // זמן – Time
  { word: "before", hebrew: "לפני", diff: "easy", group: "time" },
  { word: "after", hebrew: "אחרי", diff: "easy", group: "time" },
  { word: "when", hebrew: "כש-, כאשר", diff: "easy", group: "time" },
  { word: "while", hebrew: "בזמן ש- / בעוד ש-", diff: "easy", group: "time" },
  { word: "until", hebrew: "עד ש-", diff: "easy", group: "time" },
  { word: "till", hebrew: "עד ש-", diff: "easy", group: "time" },
  { word: "by the time", hebrew: "עד ש-, כאשר", diff: "medium", group: "time" },
  { word: "meanwhile", hebrew: "בינתיים", diff: "medium", group: "time" },
  { word: "in the meantime", hebrew: "בינתיים", diff: "medium", group: "time" },
  { word: "during", hebrew: "במהלך, לאורך", diff: "easy", group: "time" },
  { word: "still", hebrew: "עדיין", diff: "easy", group: "time" },
  { word: "at the same time", hebrew: "באותו זמן, בו זמנית", diff: "medium", group: "time" },
  { word: "simultaneously", hebrew: "בו זמנית", diff: "hard", group: "time" },
  { word: "whenever", hebrew: "בכל פעם ש-", diff: "medium", group: "time" },
  { word: "as soon as", hebrew: "ברגע ש-", diff: "medium", group: "time" },
  { word: "as long as", hebrew: "כל עוד", diff: "medium", group: "time" },
  { word: "eventually", hebrew: "לבסוף, בסופו של דבר", diff: "medium", group: "time" },

  // דוגמא – Example
  { word: "such as", hebrew: "כגון, כמו", diff: "easy", group: "example" },
  { word: "like", hebrew: "כמו", diff: "easy", group: "example" },
  { word: "for example", hebrew: "למשל, לדוגמא", diff: "easy", group: "example" },
  { word: "for instance", hebrew: "למשל", diff: "easy", group: "example" },
];

// Idioms/expressions from ניבים וביטויים
// { word, hebrew, diff, ex }
const IDIOMS = [
  { word: "a great deal of", hebrew: "הרבה, המון", diff: "medium", ex: "This sports car costs a great deal of money." },
  { word: "according to", hebrew: "לפי, על פי", diff: "easy", ex: "I know how to drive a car, according to my driving instructor." },
  { word: "as a matter of fact", hebrew: "למעשה", diff: "medium", ex: "Alon thinks that Shir loves him. As a matter of fact, she just likes him." },
  { word: "as far as", hebrew: "ככל ש-, עד כמה ש-, עד", diff: "medium", ex: "As far as I know, she is in her office." },
  { word: "as much as", hebrew: "עד כמה ש-", diff: "medium", ex: "As much as I love eating chocolate, it is very fattening." },
  { word: "as opposed to", hebrew: "בניגוד ל-, לעומת", diff: "medium", ex: "She is a very kind and generous person, as opposed to her sister." },
  { word: "at least", hebrew: "לפחות, לכל הפחות", diff: "easy", ex: "The car repair would cost me a thousand Shekels at least!" },
  { word: "at most", hebrew: "לכל היותר", diff: "medium", ex: "Cleaning the room should take Alon an hour at most." },
  { word: "find something difficult", hebrew: "להתקשות ב-", diff: "medium", ex: "Shir began learning Japanese, but found it too difficult, so she stopped." },
  { word: "firsthand", hebrew: "ממקור ראשון", diff: "medium", ex: "If you experience something yourself, you experience it firsthand." },
  { word: "for a living", hebrew: "למחייתו/ה", diff: "medium", ex: "He sells paintings for a living." },
  { word: "for that matter", hebrew: "באשר לכך, לצורך העניין", diff: "hard", ex: "I don't understand your question or even what you're talking about, for that matter." },
  { word: "have trouble", hebrew: "להתקשות ב-", diff: "medium", ex: "I have trouble understanding you when you talk so fast." },
  { word: "in accordance with", hebrew: "בהתאם ל-, לפי", diff: "hard", ex: "In accordance with city laws, I must give you a parking ticket." },
  { word: "in detail", hebrew: "בפירוט, בפרטי פרטים", diff: "medium", ex: "I am not busy, so you can tell me about your day in detail." },
  { word: "in great detail", hebrew: "בפירוט רב, באריכות", diff: "medium", ex: "The professor talked about his study in great detail." },
  { word: "in fact", hebrew: "למעשה, לאמיתו של דבר", diff: "easy", ex: "Tomatoes are in fact a fruit, not a vegetable." },
  { word: "in my opinion", hebrew: "לדעתי, לדעת מישהו", diff: "easy", ex: "In my opinion, we should take the train instead of the bus." },
  { word: "in order to", hebrew: "על מנת ל-, כדי", diff: "easy", ex: "In order to pass the test, you need to work hard." },
  { word: "in terms of", hebrew: "מבחינת, מהבחינה של", diff: "medium", ex: "A car is better than a motorcycle in terms of safety." },
  { word: "let alone", hebrew: "על אחת כמה וכמה, לא כל שכן, קל וחומר", diff: "hard", ex: "You shouldn't drive when you're tired, let alone when you're drunk." },
  { word: "make a living", hebrew: "להתפרנס", diff: "medium", ex: "I need to have two jobs in order to make a living." },
  { word: "no matter", hebrew: "לא חשוב, לא משנה", diff: "medium", ex: "No matter the cost, my parents wanted the best education for me." },
  { word: "not to mention", hebrew: "שלא לדבר על, שלא להזכיר", diff: "hard", ex: "He can't afford to buy her a new dress, not to mention a diamond ring." },
  { word: "old fashioned", hebrew: "מיושן, ישן-נושן", diff: "easy", ex: "My grandfather has an old fashioned radio. It is as big as a TV!" },
  { word: "on occasion", hebrew: "לעיתים, מדי פעם", diff: "medium", ex: "My uncle likes to smoke cigars on occasion." },
  { word: "so far", hebrew: "עד עתה, עד כה, לפי שעה", diff: "medium", ex: "The gardener has planted ten new flowers so far." },
  { word: "take into account", hebrew: "לקחת בחשבון", diff: "medium", ex: "When buying a sofa, you need to take into account the size of your living room." },
  { word: "take into consideration", hebrew: "לקחת בחשבון, להתחשב ב-", diff: "medium", ex: "When buying a sofa, you need to take into consideration the size of your living room." },
  { word: "to date", hebrew: "נכון להיום, עד כה", diff: "hard", ex: "My car has been stolen three times to date." },
  { word: "up to date", hebrew: "עדכני, מעודכן", diff: "medium", ex: "The information in this website is up to date." },
  { word: "under no circumstances", hebrew: "בשום פנים ואופן", diff: "hard", ex: "Under no circumstances should you mix medicine and alcohol." },
  { word: "would rather", hebrew: "מעדיף, היה מעדיף X על פני Y", diff: "medium", ex: "I would rather swim than run." },
  { word: "rather than", hebrew: "X ולא Y, X במקום Y, X יותר מאשר Y", diff: "medium", ex: "I prefer to be happy rather than rich." },
];

function makeConnectorItem(word, hebrew, difficulty, group) {
  const nw = normalize(word);
  return {
    id: makeId(word),
    word,
    normalizedWord: nw,
    hebrewTranslation: hebrew,
    englishDefinition: null,
    partOfSpeech: "connector",
    difficulty,
    category: "connectors",
    exampleSentence: null,
    exampleSentenceHebrew: null,
    synonyms: [],
    antonyms: [],
    confusingWords: [],
    commonTrap: null,
    tags: ["noam_batch4", "connectors", group],
    source: "noam_machon_batch4",
    originalLine: word,
    needsReview: false,
    studyPriority: difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function makeIdiomItem(word, hebrew, difficulty, exSentence) {
  const nw = normalize(word);
  return {
    id: makeId(word),
    word,
    normalizedWord: nw,
    hebrewTranslation: hebrew,
    englishDefinition: null,
    partOfSpeech: "expression",
    difficulty,
    category: "common phrases",
    exampleSentence: exSentence || null,
    exampleSentenceHebrew: null,
    synonyms: [],
    antonyms: [],
    confusingWords: [],
    commonTrap: null,
    tags: ["noam_batch4", "idioms", "expressions"],
    source: "noam_machon_batch4",
    originalLine: word,
    needsReview: false,
    studyPriority: difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const existing = JSON.parse(readFileSync("./src/data/seed/vocab.normalized.json", "utf-8"));
const existingNW = new Set(existing.map(x => x.normalizedWord));
existing.forEach(x => existingNW.add(x.word.toLowerCase().trim()));

let added = 0;
let skipped = 0;
const newItems = [];

function tryAdd(item) {
  const nw = item.normalizedWord;
  const bare = item.word.toLowerCase().trim();
  if (existingNW.has(nw) || existingNW.has(bare)) {
    skipped++;
    return;
  }
  existingNW.add(nw);
  existingNW.add(bare);
  newItems.push(item);
  added++;
}

for (const { word, hebrew, diff, group } of CONNECTORS) {
  tryAdd(makeConnectorItem(word, hebrew, diff, group));
}

for (const { word, hebrew, diff, ex } of IDIOMS) {
  tryAdd(makeIdiomItem(word, hebrew, diff, ex));
}

const merged = [...existing, ...newItems];
writeFileSync("./src/data/seed/vocab.normalized.json", JSON.stringify(merged, null, 2), "utf-8");

console.log("Batch 4 import complete.");
console.log(`  Added:   ${added}`);
console.log(`  Skipped: ${skipped} (already in DB)`);
console.log(`  Total DB size: ${merged.length}`);
const uniqueNW = new Set(merged.map(x => x.normalizedWord)).size;
console.log(`  Unique normalizedWords: ${uniqueNW}`);
if (uniqueNW !== merged.length) {
  console.error(`  ERROR: ${merged.length - uniqueNW} duplicate normalizedWords detected!`);
} else {
  console.log("  No duplicates detected.");
}
