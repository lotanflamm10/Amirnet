// Reclassify vocab difficulty using quality-based rules
// Run with: node scripts/reclassify-difficulty.js

const fs = require("fs");
const path = require("path");

const vocabPath = path.join(__dirname, "../src/data/seed/vocab.normalized.json");
const data = JSON.parse(fs.readFileSync(vocabPath, "utf8"));

// ─── 1. Connectors and linking words → always EASY ────────────────────────────
const CONNECTORS = new Set([
  "accordingly","additionally","admittedly","albeit","allegedly","also",
  "although","and","as","as a result","as well as","because","besides",
  "both","but","by contrast","by no means","caused by","concurred with",
  "consequently","conversely","currently","despite","due to","even",
  "even if","even so","even though","eventually","finally","firstly",
  "for example","for instance","formerly","furthermore","give rise to",
  "hence","however","immediately","in addition","in conclusion","in contrast",
  "in fact","in order to","in particular","in short","in spite of",
  "in summary","in the end","indeed","instead","lastly","likewise",
  "meanwhile","moreover","most importantly","nevertheless","nonetheless",
  "nor","not only","not to mention","on the contrary","on the other hand",
  "or","otherwise","overall","rather","similarly","simultaneously","since",
  "so","so that","still","subsequently","such as","that is","then",
  "therefore","though","thus","ultimately","unless","unlike","until",
  "whereas","while","yet",
  // also force-easy specific phrases in this dataset
  "account for","awe inspiring","be aware of","among (amongst)",
  "former/latter","relate to","switch on/off","take advantage of",
  "start off","in vain","kind of","de facto","eyes shut",
]);

// ─── 2. Very common everyday words → EASY regardless of length ────────────────
const FORCE_EASY = new Set([
  // conversations, daily life
  "ability","above","ability","absence","accept","accident","across","actually",
  "address","admit","advice","affect","afford","afraid","again","age","agree",
  "ahead","aim","airplane","airport","alert","alive","allow","almost","already",
  "also","although","always","amazing","amount","angry","announce","answer",
  "anyone","anything","anytime","anyway","apartment","appear","apply",
  "approach","approve","area","around","arrange","arrive","article","aspect",
  "assist","attention","background","badly","balance","basic","bathroom",
  "bedroom","before","behind","believe","beside","below","best","better",
  "between","body","breakfast","brief","bright","bring","broad","brother",
  "build","building","business","busy","camera","career","cause","certain",
  "chance","change","charge","cheap","check","chicken","choice","choose",
  "city","class","clean","clear","close","common","compare","complete",
  "concern","conduct","continue","control","correct","country","couple",
  "cover","create","culture","daughter","decide","decline","deep","define",
  "depend","discuss","display","distance","drive","easily","education",
  "effective","effort","enough","enter","environment","evidence","exactly",
  "excellent","expect","explain","expression","extend","extra","fail","false",
  "familiar","family","famous","fast","final","find","focus","follow","force",
  "form","free","freedom","frequently","friend","full","future","general",
  "genuine","give","goal","good","government","great","grow","happen","happy",
  "head","high","history","hold","honest","hospital","house","however",
  "human","husband","idea","identify","imagine","impact","important",
  "improve","include","increase","instead","interest","involve","issue",
  "join","knowledge","large","later","learn","leave","level","light","likely",
  "limit","listen","live","living room","local","long","look","lose","loss",
  "major","manage","matter","mean","media","meeting","method","mind","model",
  "moment","money","month","more","move","nation","natural","near","need",
  "network","news","next","normal","notice","number","offer","often","only",
  "open","order","other","outside","over","own","paper","part","pass",
  "pattern","pay","people","perform","period","personal","place","plan",
  "point","policy","popular","position","positive","possible","power",
  "prepare","present","prevent","primary","problem","produce","professor",
  "program","protect","prove","public","push","raise","rather","reach",
  "ready","reason","receive","recent","reduce","refer","relate","release",
  "remain","replace","report","require","research","respond","result",
  "return","reveal","review","right","rise","role","rule","run","safe",
  "scene","section","seem","send","sense","serious","service","several",
  "share","short","show","simple","since","situation","small","social",
  "solution","solve","speak","spend","strong","student","study","success",
  "sudden","suggest","support","system","teach","teacher","think","today",
  "together","tradition","true","turn","under","understand","until","usual",
  "value","various","view","visit","want","watch","ways","weather","wife",
  "woman","world","write","wrong","young","yourself",
  // specifically in the dataset hard/medium but obviously easy
  "conversation","information","interesting","relationship","personality",
  "discussion","embarrassing","experiment","explanation","frustration",
  "opportunity","responsibility","satisfaction","significant","specifically",
  "translation","immediately","accordingly","nevertheless","traditional",
  "traditional","celebration","communication","administration",
]);

// ─── 3. Genuinely hard words (rare, uncommon, advanced academic) ───────────────
const FORCE_HARD = new Set([
  // Confirmed from current HARD list (genuinely rare)
  "commensurate","commiserate","complaisance","consternation","convalescence",
  "impregnable","insuperable","ostentatious","stenographer","superfluous",
  "surreptitiously","heart-rending","conscientious",

  // Promoted from MEDIUM — genuinely uncommon vocabulary
  "apposite",         // suitable/relevant (uncommon synonym)
  "audacious",        // boldly daring (formal sense)
  "avarice",          // extreme greed
  "avaricious",       // extremely greedy
  "bamboozle",        // to deceive/trick
  "blaspheme",        // to speak against the sacred
  "blasphemy",        // the act of blasphemy
  "buffoon",          // a ridiculous person
  "buttress",         // to give support/prop up (formal)
  "corollary",        // a natural consequence (logic term)
  "docility",         // willingness to be led/controlled
  "eclectic",         // drawing from diverse sources
  "equivocal",        // ambiguous, deliberately vague
  "erudition",        // great knowledge from academic study
  "erroneous",        // wrong/incorrect (formal)
  "fallacious",       // based on false reasoning
  "fallacy",          // a mistaken belief/flawed reasoning
  "fastidious",       // very attentive to accuracy and detail
  "flagrant",         // conspicuously bad, shockingly obvious
  "heretic",          // a person with unorthodox beliefs
  "hitherto",         // until now (formal/archaic)
  "illusive",         // deceptive/misleading
  "illusory",         // based on illusion, not real
  "languish",         // to weaken/lose vitality
  "languor",          // physical/mental weakness
  "petulant",         // childishly sulky or bad-tempered
  "preclude",         // to prevent from happening
  "repudiate",        // to refuse to accept/deny
  "repugnant",        // causing strong disgust
  "saturnine",        // slow and gloomy in temperament
  "stratum",          // a layer or level (formal)
  "vertebrae",        // bones of the spinal column
  "pedantic",         // excessively concerned with rules/detail
  "pernicious",       // having a harmful gradual effect
  "reticent",         // not revealing one's thoughts
  "taciturn",         // reserved/habitually silent
  "verbose",          // using more words than needed
  "loquacious",       // talkative (if present)
  "magnanimous",      // generous/forgiving (if present)
  "ostentatious",     // displaying wealth/ability to impress
  "soliloquy",        // act of speaking thoughts aloud
  "supercilious",     // behaving as if one is superior
  "mendacious",       // not telling the truth
  "vociferous",       // making a loud outcry
  "inveterate",       // having a habit deeply established
  "recalcitrant",     // obstinately uncooperative
  "sycophant",        // a person using flattery for gain
  "perfidious",       // deceitful and untrustworthy
  "ignominious",      // deserving or causing public disgrace
  "innocuous",        // not harmful (medium is fine actually)
  "surreptitious",    // kept secret (in addition to surreptitiously)
  "circumlocution",   // using many words instead of few
  "garrulous",        // excessively talkative
  "duplicity",        // deceitfulness/double-dealing
  "insolent",         // disrespectful/rude (if present)
  "obsequious",       // excessively attentive/servile
  "propitious",       // giving a good indication of success
  "vicarious",        // experienced through another person
  "dissonance",       // tension from incompatible elements
  "corroborate",      // to confirm/give support to a statement
  "exacerbate",       // to make a problem worse
  "meticulous",       // showing great attention to detail
  "capricious",       // given to sudden changes of mood
  "nonchalant",       // not showing anxiety (if present)
  "ostracize",        // to exclude from society (if present)
  "hegemony",         // dominance of one group over others
  "serendipity",      // fortunate coincidence
  "ephemeral",        // lasting a very short time
  "ubiquitous",       // present everywhere at the same time
  "dichotomy",        // a division into two opposing things
  "conundrum",        // a difficult problem
  "euphemism",        // mild word for offensive thing
  "rhetoric",         // art of effective speech/persuasion
  "paradigm",         // typical example/pattern/model
]);

// ─── 4. Classification function ───────────────────────────────────────────────

function classify(item) {
  const word = item.word.toLowerCase().trim();
  const clean = word.replace(/[^a-z]/g, "");
  const len = clean.length;
  const pos = (item.partOfSpeech || "").toLowerCase();

  // Connector/linking words → EASY
  if (CONNECTORS.has(word) || pos === "connector" || pos === "linker") return "easy";

  // Phrases with space → EASY (common everyday phrases)
  if (word.includes(" ") && len <= 20) return "easy";

  // Hyphenated casual phrases → EASY
  if (word.includes("-") && len <= 15 && !FORCE_HARD.has(word)) return "easy";

  // Force-easy overrides
  if (FORCE_EASY.has(word) || FORCE_EASY.has(clean)) return "easy";

  // Force-hard overrides (before length rules)
  if (FORCE_HARD.has(word) || FORCE_HARD.has(clean)) return "hard";

  // Short words ≤ 5 chars → EASY
  if (len <= 5) return "easy";

  // 6-char words → EASY (most are common)
  if (len === 6) return "easy";

  // Everything else → MEDIUM
  // (the old threshold of len > 10 → hard was the root cause of all problems)
  return "medium";
}

// ─── 5. Apply and report ──────────────────────────────────────────────────────

let changed = 0;
const byDiff = { easy: 0, medium: 0, hard: 0 };

const updated = data.map((item) => {
  const newDiff = classify(item);
  if (newDiff !== item.difficulty) changed++;
  byDiff[newDiff]++;
  return { ...item, difficulty: newDiff };
});

console.log(`\nReclassified ${changed} of ${data.length} words`);
console.log(`Easy:   ${byDiff.easy}`);
console.log(`Medium: ${byDiff.medium}`);
console.log(`Hard:   ${byDiff.hard}`);

// Show the hard words for review
const hardWords = updated.filter(v => v.difficulty === "hard").map(v => v.word).sort();
console.log(`\nHARD words (${hardWords.length}):`);
console.log(hardWords.join(", "));

fs.writeFileSync(vocabPath, JSON.stringify(updated, null, 2));
console.log(`\nSaved to ${vocabPath}`);
