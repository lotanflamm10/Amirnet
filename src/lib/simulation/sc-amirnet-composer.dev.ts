/**
 * Sanity fixture for sc-amirnet-composer.
 *
 * NOT imported from any production code path. Run ad-hoc with:
 *   npx tsx src/lib/simulation/sc-amirnet-composer.dev.ts
 *
 * Emits a single composition over a tiny hand-built fixture pool so the
 * composer can be eyeballed during development without booting the
 * whole Next dev server.
 */

import type { Question } from "@/types/questions";
import { composeAmirnetScSection } from "./sc-amirnet-composer";

const fixture: Question[] = [
  {
    id: "fx-h1",
    category: "sentenceCompletion",
    difficulty: "hard",
    text: "During the Korematsu case, the Supreme Court was widely criticised for ___ wartime racial classifications.",
    choices: ["upholding", "abolishing", "concealing", "ignoring"],
    answer: 0,
    explanation: "Korematsu v. United States upheld internment.",
    wrongReasons: [],
  },
  {
    id: "fx-h2",
    category: "sentenceCompletion",
    difficulty: "hard",
    text: "The committee remained ___ about the proposal because several financial details were still unresolved.",
    choices: ["hesitant", "decisive", "eager", "indifferent"],
    answer: 0,
    explanation: "Generic-subject hard item — no anchor.",
    wrongReasons: [],
  },
  {
    id: "fx-m1",
    category: "sentenceCompletion",
    difficulty: "medium",
    text: "Roman architecture deliberately combined arches and columns to ___ the weight of monumental buildings.",
    choices: ["distribute", "decorate", "conceal", "memorise"],
    answer: 0,
    explanation: "Anchor: Roman.",
    wrongReasons: [],
  },
  {
    id: "fx-m2",
    category: "sentenceCompletion",
    difficulty: "medium",
    text: "The new policy was introduced gradually so that employees would have time to ___ to the changes.",
    choices: ["adapt", "object", "refer", "compete"],
    answer: 0,
    explanation: "Generic-subject medium item — no anchor.",
    wrongReasons: [],
  },
  {
    id: "fx-m3",
    category: "sentenceCompletion",
    difficulty: "medium",
    text: "Newton's laws of motion ___ the foundation of classical mechanics for nearly three centuries.",
    choices: ["constituted", "ignored", "celebrated", "shortened"],
    answer: 0,
    explanation: "Anchor: Newton.",
    wrongReasons: [],
  },
  {
    id: "fx-e1",
    category: "sentenceCompletion",
    difficulty: "easy",
    text: "The students were asked to submit their essays by Friday, but several requested an ___.",
    choices: ["extension", "addition", "objection", "exposure"],
    answer: 0,
    explanation: "Generic-subject easy item — no anchor.",
    wrongReasons: [],
  },
];

const result = composeAmirnetScSection(fixture, 4, new Set(), new Set());

console.log("composition:", result.composition);
console.log("fallbacks:", result.fallbacks);
console.log("selected:");
for (const q of result.selected) {
  console.log(`  - ${q.id} [${q.difficulty}] ${q.text.slice(0, 80)}`);
}
