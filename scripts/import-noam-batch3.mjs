import { readFileSync, writeFileSync } from "fs";

const NOW = new Date().toISOString();

function normalize(word) {
  return word.replace(/^to\s+/i, "").toLowerCase().trim();
}

function makeId(word) {
  return "noam_b3_" + normalize(word).replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

// Each entry: { word, hebrew, diff, ex }
// word = canonical form (no someone/something placeholders)
// Multiple meanings separated by " / " in hebrew
const PHRASAL_VERBS = [
  // A
  { word: "ask out", hebrew: "להציע למישהו לצאת", diff: "easy", ex: "Brian asked Judy out to dinner." },
  { word: "ask around", hebrew: "לברר, להתעניין", diff: "medium", ex: "I asked around but nobody has seen my wallet." },
  { word: "add up to", hebrew: "להסתכם ב-", diff: "medium", ex: "Your purchases add up to $205.32." },
  // B
  { word: "back up", hebrew: "לגבות מישהו", diff: "medium", ex: "My wife backed me up on my decision to quit my job." },
  { word: "blow up", hebrew: "לפוצץ, להתפוצץ", diff: "easy", ex: "The racing car blew up after it crashed into the fence." },
  { word: "break down", hebrew: "להתקלקל / להתמוטט", diff: "easy", ex: "Our car broke down at the side of the highway." },
  { word: "break in", hebrew: "לפרוץ", diff: "medium", ex: "Somebody broke in last night and stole our stereo." },
  { word: "break up", hebrew: "להיפרד", diff: "easy", ex: "Tom and Jane broke up yesterday." },
  { word: "break out", hebrew: "לפרוץ / להימלט, לברוח", diff: "medium", ex: "World War II broke out in 1939." },
  { word: "bring down", hebrew: "לדכא מישהו", diff: "medium", ex: "This sad music is bringing me down." },
  { word: "bring up", hebrew: "להעלות (רעיון או נושא)", diff: "medium", ex: "My mother walks out of the room whenever my father brings up sports." },
  // C
  { word: "call off", hebrew: "לבטל", diff: "medium", ex: "Jason called the wedding off because he wasn't in love with his fiance." },
  { word: "calm down", hebrew: "להירגע", diff: "easy", ex: "Please calm down before you drive." },
  { word: "catch up with", hebrew: "להשיג מישהו / להתעדכן", diff: "easy", ex: "You'll have to run faster if you want to catch up with Marty." },
  { word: "check in", hebrew: "להירשם (במלון או בשדה התעופה)", diff: "easy", ex: "We will get the hotel keys when we check in." },
  { word: "cheer up", hebrew: "לעודד", diff: "easy", ex: "I brought you flowers to cheer you up." },
  { word: "come across", hebrew: "להיתקל ב- (במקרה)", diff: "medium", ex: "I came across these old photos when I was tidying the closet." },
  { word: "count on", hebrew: "לסמוך על", diff: "medium", ex: "I am counting on you to make dinner." },
  { word: "cut back on", hebrew: "לצמצם, להצטמצם", diff: "medium", ex: "My doctor wants me to cut back on sweets and fatty foods." },
  { word: "cut down", hebrew: "לגדוע, לכרות", diff: "medium", ex: "After the storm we had to cut down the old tree in our yard." },
  { word: "cut off", hebrew: "לקטוע / לנתק", diff: "medium", ex: "The phone company cut off our phone because we didn't pay the bill." },
  // D
  { word: "dress up", hebrew: "להתלבש יפה, להתגנדר", diff: "easy", ex: "It's a wedding, so we have to dress up." },
  { word: "drop in", hebrew: "לקפוץ לביקור בלי תיאום מוקדם", diff: "easy", ex: "I might drop in for tea some time this week." },
  { word: "drop off", hebrew: "להקפיץ מישהו ברכב / להוריד מישהו בדרך", diff: "medium", ex: "I have to drop my sister off at work before I come over." },
  { word: "drop out", hebrew: "לנשור מ-", diff: "easy", ex: "I dropped out of Science because it was too difficult." },
  // E
  { word: "end up", hebrew: "בסופו של דבר", diff: "easy", ex: "We ended up renting a movie instead of going to the cinema." },
  // F
  { word: "fall apart", hebrew: "להתפרק", diff: "easy", ex: "Tom's marriage fell apart." },
  { word: "fall out", hebrew: "לנשור", diff: "easy", ex: "His hair started to fall out when he was only 35." },
  { word: "figure out", hebrew: "להבין, לפתור", diff: "easy", ex: "I need to figure out how to solve this problem." },
  { word: "fill in", hebrew: "למלא (טופס)", diff: "easy", ex: "Please fill in the form with your name, address, and phone number." },
  { word: "find out", hebrew: "לגלות, לברר", diff: "easy", ex: "How can we find out where Tom lives?" },
  // G
  { word: "get along", hebrew: "להסתדר עם", diff: "easy", ex: "Tom and Jane get along well." },
  { word: "get around", hebrew: "להתנייד", diff: "medium", ex: "Tom gets around fine in his wheelchair." },
  { word: "get away with", hebrew: "לחמוק מעונש", diff: "medium", ex: "Tom got away with cheating on his test." },
  { word: "get back", hebrew: "לחזור, לשוב", diff: "easy", ex: "We got back from our vacation." },
  { word: "get back at", hebrew: "להתנקם ב-", diff: "hard", ex: "My sister got back at me for stealing her shoes." },
  { word: "get over", hebrew: "להתגבר על", diff: "easy", ex: "You have a problem? Well, get over it!" },
  { word: "get together", hebrew: "להיפגש", diff: "easy", ex: "Let's get together for a BBQ this weekend." },
  { word: "get up", hebrew: "לקום", diff: "easy", ex: "I got up early today." },
  { word: "give away", hebrew: "למסור, להפיץ בחינם", diff: "easy", ex: "The library was giving away old books last Friday." },
  { word: "give back", hebrew: "להחזיר משהו שאול", diff: "easy", ex: "I have to give this dog back to his owners." },
  { word: "give in", hebrew: "לוותר, להיכנע", diff: "medium", ex: "My boyfriend didn't want to go to the show, but he finally gave in." },
  { word: "give up", hebrew: "לוותר, להיכנע / להפסיק", diff: "easy", ex: "I am giving up smoking as of January 1st." },
  { word: "give out", hebrew: "למסור, לחלק", diff: "medium", ex: "They were giving out free perfume samples at the department store." },
  { word: "go ahead", hebrew: "להתחיל, להמשיך", diff: "easy", ex: "Go ahead and eat. I'll join you soon." },
  { word: "go out", hebrew: "לצאת לבלות", diff: "easy", ex: "We're going out for dinner tonight." },
  { word: "go out with", hebrew: "לצאת עם מישהו (זוגיות)", diff: "easy", ex: "Jesse is going out with Luke." },
  { word: "go over", hebrew: "לעבור על, לבדוק", diff: "easy", ex: "Go over your answers before you submit the test." },
  { word: "grow apart", hebrew: "להתרחק זה מזה רגשית", diff: "hard", ex: "My best friend and I grew apart after she changed schools." },
  { word: "grow up", hebrew: "לגדול, להתבגר", diff: "easy", ex: "Tom wants to be a fireman when he'll grow up." },
  // H
  { word: "hand in", hebrew: "להגיש (עבודה, מטלה)", diff: "easy", ex: "I have to hand in my essay by Friday." },
  { word: "hand out", hebrew: "לחלק משהו לאנשים", diff: "easy", ex: "We will hand out the invitations at the door." },
  { word: "hand over", hebrew: "למסור משהו למישהו", diff: "medium", ex: "The police asked the man to hand over his wallet." },
  { word: "hang in", hebrew: "להחזיק מעמד", diff: "medium", ex: "Hang in there. I'm sure you'll find a job." },
  { word: "hang on", hebrew: "להמתין זמן קצר", diff: "easy", ex: "Hang on while I grab my coat!" },
  { word: "hang out", hebrew: "לבלות, לבזבז זמן עם", diff: "easy", ex: "We are going to hang out at my place." },
  { word: "hang up", hebrew: "לנתק (שיחה)", diff: "easy", ex: "He hung up without saying goodbye." },
  { word: "hold back", hebrew: "לבלום, לעצור", diff: "medium", ex: "I had to hold my dog back because there was a cat in the park." },
  { word: "hold on", hebrew: "להמתין זמן קצר / להמשיך להחזיק", diff: "easy", ex: "Please hold on while I transfer you to the Sales Department." },
  { word: "hold onto", hebrew: "לאחוז במשהו בחוזקה", diff: "medium", ex: "Hold onto your hat because it's very windy outside." },
  // K
  { word: "keep on", hebrew: "להמשיך", diff: "easy", ex: "Keep on reading until page 40." },
  { word: "keep from", hebrew: "להסתיר משהו ממישהו", diff: "medium", ex: "We kept our relationship from our parents for two years." },
  // L
  { word: "let down", hebrew: "לאכזב", diff: "medium", ex: "I really trust you so please don't let me down." },
  { word: "let in", hebrew: "להכניס", diff: "easy", ex: "Let the cat in before you go to work." },
  { word: "look after", hebrew: "לטפל ב-, להשגיח על", diff: "easy", ex: "I have to look after my sick dog." },
  { word: "look for", hebrew: "לחפש", diff: "easy", ex: "I'm looking for my car keys." },
  { word: "look forward to", hebrew: "לצפות למשהו בכיליון עיניים", diff: "medium", ex: "I'm looking forward to the Christmas break." },
  { word: "look into", hebrew: "לבדוק לעומק, לרדת לשורש", diff: "medium", ex: "We are going to look into the price of snowboards today." },
  { word: "look out", hebrew: "להיזהר", diff: "easy", ex: "Look out! That car's going to hit you!" },
  { word: "look out for", hebrew: "להיזהר ממשהו ספציפי", diff: "medium", ex: "Look out for snakes on the hiking trail." },
  { word: "look up", hebrew: "לחפש מידע (במילון / באינטרנט)", diff: "easy", ex: "We can look her phone number up on the Internet." },
  { word: "look up to", hebrew: "להעריך, להעריץ", diff: "hard", ex: "My little sister has always looked up to me." },
  { word: "look down on", hebrew: "להתנשא מעל מישהו, לזלזל ב-", diff: "hard", ex: "The rich man looked down on his poor neighbor." },
  // M
  { word: "make up", hebrew: "להתפייס / לפצות / להמציא שקר", diff: "medium", ex: "We had a fight, but we made up." },
  { word: "name after", hebrew: "לקרוא על שם מישהו", diff: "medium", ex: "Moshe was named after his grandfather." },
  // P
  { word: "pass away", hebrew: "למות (לשון עדינה)", diff: "medium", ex: "Tom passed away after a long illness." },
  { word: "pass out", hebrew: "להתעלף", diff: "easy", ex: "The heat made an old lady pass out." },
  { word: "pick out", hebrew: "לבחור", diff: "easy", ex: "I picked out three sweaters for you to try on." },
  { word: "put out", hebrew: "לכבות (אש)", diff: "medium", ex: "The neighbors put out the fire before the firemen arrived." },
  { word: "put together", hebrew: "להרכיב", diff: "medium", ex: "I have to put together the crib before the baby arrives." },
  { word: "put up with", hebrew: "לסבול משהו, להשלים עם", diff: "medium", ex: "I can't put up with this noise." },
  // R
  { word: "run into", hebrew: "לפגוש מישהו במקרה", diff: "medium", ex: "I ran into an old friend at the mall." },
  { word: "run over", hebrew: "לדרוס", diff: "medium", ex: "I accidentally ran over your bicycle in the driveway." },
  { word: "run away", hebrew: "לברוח", diff: "easy", ex: "The child ran away from home." },
  { word: "run out", hebrew: "לאזול, להיגמר", diff: "easy", ex: "Oh, no! We ran out of shampoo." },
  // S
  { word: "set up", hebrew: "לארגן / לטמון פח למישהו", diff: "medium", ex: "Tom set up a meeting with the president of the company." },
  { word: "show off", hebrew: "להשוויץ", diff: "easy", ex: "He always shows off on his skateboard." },
  { word: "sleep over", hebrew: "לישון אצל מישהו", diff: "easy", ex: "You should sleep over tonight if the weather is too bad to drive home." },
  { word: "sort out", hebrew: "למיין, לארגן / למצוא פתרון", diff: "medium", ex: "We need to sort the bills out before the first of the month." },
  { word: "stick to", hebrew: "להיצמד ל-, לדבוק ב-", diff: "medium", ex: "You will lose weight if you stick to the diet." },
  // T
  { word: "take after", hebrew: "להיות דומה למישהו (חיצונית או פנימית)", diff: "hard", ex: "I take after my mother. We are both impatient." },
  { word: "take off", hebrew: "להמריא / לפשוט (בגדים)", diff: "easy", ex: "My plane takes off in five minutes." },
  { word: "tear up", hebrew: "לקרוע לחתיכות", diff: "medium", ex: "I tore up my ex-boyfriend's letters." },
  { word: "think back", hebrew: "להיזכר, להעלות זכרונות", diff: "hard", ex: "When I think back on my youth, I wish I had studied harder." },
  { word: "think over", hebrew: "לשקול, לחשוב על", diff: "medium", ex: "I'll have to think this job offer over before I make my final decision." },
  { word: "throw away", hebrew: "לזרוק (לזבל)", diff: "easy", ex: "We threw our old furniture away when we won the lottery." },
  { word: "turn down", hebrew: "להנמיך (ווליום) / לסרב, לדחות", diff: "medium", ex: "I turned the job down because I don't want to move." },
  { word: "turn off", hebrew: "לכבות", diff: "easy", ex: "Your mother wants you to turn the TV off." },
  { word: "turn on", hebrew: "להדליק", diff: "easy", ex: "It's too dark in here. Let's turn some lights on." },
  { word: "turn up", hebrew: "להגביר (ווליום) / להופיע, לצוץ", diff: "medium", ex: "Our cat turned up after disappearing for a week." },
  { word: "try out", hebrew: "לנסות, לבדוק", diff: "easy", ex: "I am going to try out this new guitar." },
  // U
  { word: "use up", hebrew: "לגמור, להשתמש עד תום", diff: "medium", ex: "The kids used all of the toothpaste up so we need to buy some more." },
  // W
  { word: "watch out", hebrew: "להיזהר", diff: "easy", ex: "Watch out! There's a big wave coming!" },
  { word: "wear off", hebrew: "לדהות, להיעלם בהדרגה", diff: "hard", ex: "My make-up wore off." },
  { word: "work out", hebrew: "להתאמן / להצליח / לפתור", diff: "easy", ex: "I work out at the gym twice a week." },
];

function guessPos(word) {
  return "phrasal verb";
}

function makeItem(word, hebrew, difficulty, exSentence) {
  const nw = normalize(word);
  return {
    id: makeId(word),
    word,
    normalizedWord: nw,
    hebrewTranslation: hebrew,
    englishDefinition: null,
    partOfSpeech: guessPos(word),
    difficulty,
    category: "phrasal verbs",
    exampleSentence: exSentence || null,
    exampleSentenceHebrew: null,
    synonyms: [],
    antonyms: [],
    confusingWords: [],
    commonTrap: null,
    tags: ["noam_batch3", "phrasal_verbs"],
    source: "noam_machon_batch3",
    originalLine: word,
    needsReview: false,
    studyPriority: difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 7,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const existing = JSON.parse(readFileSync("./src/data/seed/vocab.normalized.json", "utf-8"));
const existingNW = new Set(existing.map(x => x.normalizedWord));
// also add lowercase bare forms
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

for (const { word, hebrew, diff, ex } of PHRASAL_VERBS) {
  tryAdd(makeItem(word, hebrew, diff, ex));
}

const merged = [...existing, ...newItems];
writeFileSync("./src/data/seed/vocab.normalized.json", JSON.stringify(merged, null, 2), "utf-8");

console.log("Batch 3 import complete.");
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
