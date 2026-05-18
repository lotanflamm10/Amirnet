// Assign studyPriority (1-10) based on AMIRNET test frequency
// 10 = appears most often in real AMIRNET exams
// Run: node scripts/assign-study-priority.js

const fs = require("fs");
const path = require("path");

const vocabPath = path.join(__dirname, "../src/data/seed/vocab.normalized.json");
const data = JSON.parse(fs.readFileSync(vocabPath, "utf8"));

// Priority 10 — Connectors/discourse markers: appear in EVERY reading/completion section
const P10 = new Set([
  "accordingly","additionally","admittedly","albeit","also","although","and",
  "as a result","as well as","because","besides","both","but","by contrast",
  "by no means","consequently","conversely","despite","due to","even if",
  "even so","even though","eventually","finally","firstly","for example",
  "for instance","furthermore","give rise to","hence","however","in addition",
  "in conclusion","in contrast","in fact","in order to","in particular",
  "in short","in spite of","in summary","in the end","indeed","instead",
  "lastly","likewise","meanwhile","moreover","most importantly","nevertheless",
  "nonetheless","nor","not only","not to mention","on the contrary",
  "on the other hand","or","otherwise","overall","rather","similarly",
  "simultaneously","since","so","so that","still","subsequently","such as",
  "that is","then","therefore","though","thus","ultimately","unless",
  "unlike","until","whereas","while","yet",
]);

// Priority 9 — Core academic verbs: heavily tested in sentence completion & restatements
const P9 = new Set([
  "analyze","analyse","indicate","demonstrate","suggest","conclude","consider",
  "establish","evaluate","identify","maintain","obtain","provide","require",
  "reveal","argue","assume","claim","define","describe","determine","develop",
  "discuss","emphasize","examine","explain","express","focus","highlight",
  "illustrate","imply","improve","include","influence","involve","justify",
  "observe","occur","predict","refer","reflect","relate","represent","result",
  "review","show","significant","significantly","support","tend","typically",
  "achieve","acknowledge","address","affect","apply","assess","associate",
  "attempt","attribute","base","benefit","cause","challenge","change","compare",
  "complete","conduct","confirm","contribute","create","derive","ensure",
  "evidence","generate","indicate","interpret","investigate","measure","note",
  "present","produce","promote","propose","range","recognize","reduce",
  "reflect","relate","rely","select","similar","state","tend","test","vary",
]);

// Priority 8 — High-frequency formal vocabulary in AMIRNET passages
const P8 = new Set([
  "ability","absence","accurate","achieve","advantage","approach","appropriate",
  "approximately","aspect","assumption","available","aware","background",
  "benefit","broad","capable","challenge","characteristic","circumstance",
  "common","communicate","communication","complex","concept","concern",
  "condition","consequence","context","contribute","critical","cultural",
  "current","data","decline","distinct","distribute","diverse","diversity",
  "dominant","effective","emphasis","enable","environment","establish",
  "evidence","examine","expand","experience","factor","feature","focus",
  "function","fundamental","generate","global","highlight","impact","implement",
  "implication","important","increase","influence","information","initial",
  "instance","issue","knowledge","major","mechanism","method","occur",
  "opportunity","outcome","pattern","period","perspective","primary","principle",
  "process","proportion","range","rate","region","relationship","relevant",
  "rely","research","role","significant","similar","situation","specific",
  "strategy","structure","study","substantial","sufficient","support","system",
  "theory","traditional","understanding","unique","various","whereas",
]);

// Priority 7 — Common formal/academic words tested in vocabulary sections
const P7 = new Set([
  "abundant","accumulate","accurate","acquire","adjust","advocate","allocate",
  "ambiguous","apparent","appreciate","attribute","authority","brief",
  "calculate","capable","category","coherent","competent","comply","component",
  "comprehensive","concentrate","conflict","consistent","construct","contrast",
  "controversial","convince","cooperation","coordinate","criteria","decline",
  "deduce","demonstrate","deny","depict","derive","detect","diminish",
  "distinguish","dynamic","elaborate","eliminate","emerge","emphasize","ensure",
  "equivalent","essential","estimate","exceed","exclude","explicit","expose",
  "facilitate","feasible","flexible","fluctuate","fulfill","fundamental",
  "generate","gradual","hypothesis","identify","illustrate","implement",
  "impose","inadequate","indicate","induce","inevitable","inherent","initiate",
  "input","insight","inspire","interact","interpret","investigate","justify",
  "logic","logical","manipulate","maximize","minimize","modify","monitor",
  "motivate","neutral","objective","obtain","outcome","overcome","perceive",
  "positive","negative","potential","precise","priority","proceed","promote",
  "proportion","rational","react","reinforce","reject","reluctant","restrict",
  "reveal","seek","series","straightforward","sufficient","sustain","transfer",
  "transform","transition","trend","trigger","ultimately","undermine","vary",
  "whereas","widespread","yield",
]);

// Priority 6 — Hard words that ARE commonly tested in AMIRNET
const P6_HARD = new Set([
  "ambiguous","equivocal","rhetoric","paradigm","euphemism","dichotomy",
  "ubiquitous","ephemeral","serendipity","corroborate","exacerbate",
  "meticulous","capricious","fallacy","fallacious","erroneous","preclude",
  "repudiate","verbose","pedantic","reticent","taciturn","flagrant",
  "audacious","eclectic","corollary","duplicity","dissonance","vicarious",
  "hegemony","ostracize","nonchalant","propitious","obsequious","insolent",
  "garrulous","circumlocution","surreptitious","ostentatious","mendacious",
  "vociferous","supercilious","soliloquy","magnanimous","loquacious",
  "inveterate","recalcitrant","sycophant","perfidious","ignominious",
]);

// Priority 3 — Hard but obscure/rarely tested in AMIRNET
const P3_RARE = new Set([
  "saturnine","stenographer","convalescence","vertebrae","stratum",
  "languor","languish","docility","complaisance","consternation",
  "commiserate","commensurate","impregnable","insuperable","heart-rending",
  "hitherto","heretic","buffoon","bamboozle","apposite","buttress",
  "avarice","avaricious","petulant","illusive","illusory","blaspheme",
  "blasphemy","repugnant","conscientious","fastidious","erudition",
  "innocuous","pernicious","superfluous","surreptitiously",
]);

function assignPriority(item) {
  const word = item.word.toLowerCase().trim();

  if (P10.has(word)) return 10;
  if (P9.has(word)) return 9;
  if (P8.has(word)) return 8;
  if (P7.has(word)) return 7;
  if (P6_HARD.has(word)) return 6;
  if (P3_RARE.has(word)) return 3;

  // Default by difficulty
  if (item.difficulty === "easy") return 6;
  if (item.difficulty === "medium") return 5;
  if (item.difficulty === "hard") return 4;
  return 5;
}

const dist = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
const updated = data.map((item) => {
  const p = assignPriority(item);
  dist[p]++;
  return { ...item, studyPriority: p };
});

console.log("\nStudy Priority Distribution:");
Object.entries(dist).reverse().forEach(([k, v]) => {
  if (v > 0) console.log(`  ${k}: ${v} words`);
});

fs.writeFileSync(vocabPath, JSON.stringify(updated, null, 2));
console.log(`\nSaved ${data.length} words to ${vocabPath}`);
