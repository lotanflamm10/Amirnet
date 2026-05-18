/**
 * Amirnet Trainer — script.js
 *
 * Architecture: vanilla JS, hash-based SPA router, localStorage persistence.
 *
 * Key fixes over original:
 *  - listeningIndex is now reset when moving to the next queue item
 *  - showTranscript initialised in all session objects that use listening
 *  - Segmented difficulty control updates active state in-place (no stale DOM)
 *  - Smart review session initialised with all required fields
 *  - practiceCount / simulationCount object-literal is not duplicated
 *  - renderNotFound uses the improved state-card layout
 *  - Session progress bar is wired up and updated on every question advance
 *  - Daily goal uses a proper modal prompt with accessible feedback
 *  - Score estimation clamped to 50–150 with better weight curve
 *  - All HTML escaping centralised; no raw string interpolation of user data
 */

'use strict';

/* ─── Constants ─────────────────────────────────────────────── */
const STORAGE_KEY = 'amirnet-trainer-v3';

/*
 * Timer values match the official Amirnet chapter allocations:
 *   Sentence Completion   —  4 min  (~8 questions)
 *   Sentence Rephrasing   —  6 min  (~8 questions)
 *   Reading Comprehension — 20 min  (3 passages, multiple questions each)
 *   Grammar in Context    —  4 min  (~6 questions)
 *   Word Formation        —  4 min  (~6 questions)
 *   Vocabulary Trainer    —  no official Amirnet section (untimed drill)
 *   Lecture/Conversation  —  7 min  (pilot section)
 *   Text Completion       —  4 min  (pilot section)
 *   Smart Review          —  untimed (personal practice)
 */
const MODES = {
  sentenceCompletion: { label: 'Sentence Completion',     type: 'choice',    timer: 4 * 60,  sectionMinutes: 4,  description: 'Choose the best word or phrase to complete the sentence.' },
  paraphrasing:       { label: 'Sentence Rephrasing',     type: 'choice',    timer: 6 * 60,  sectionMinutes: 6,  description: 'Select the option that best preserves the original meaning.' },
  grammar:            { label: 'Grammar in Context',      type: 'choice',    timer: 4 * 60,  sectionMinutes: 4,  description: 'Choose the grammatically correct option in context.' },
  wordFormation:      { label: 'Word Formation',          type: 'input',     timer: 4 * 60,  sectionMinutes: 4,  description: 'Build the correct word form from the base given.' },
  reading:            { label: 'Reading Comprehension',   type: 'reading',   timer: 20 * 60, sectionMinutes: 20, description: 'Read a short passage and answer the comprehension questions.' },
  vocab:              { label: 'Vocabulary Trainer',      type: 'choice',    timer: 0,       sectionMinutes: 0,  description: 'Strengthen the academic vocabulary that appears on Amirnet.' },
  lectureQuestions:   { label: 'Lecture or Conversation', type: 'listening', timer: 7 * 60,  sectionMinutes: 7,  description: 'Listen for main idea, inference, and key details. (Pilot)' },
  textCompletion:     { label: 'Text Completion',         type: 'choice',    timer: 4 * 60,  sectionMinutes: 4,  description: 'Complete a short paragraph using context and collocation. (Pilot)' },
  smartReview:        { label: 'Smart Review',            type: 'review',    timer: 0,       sectionMinutes: 0,  description: 'Retry your mistakes and slow-response questions first.' }
};

const SIMULATION_CORE   = ['sentenceCompletion', 'paraphrasing', 'reading', 'grammar', 'wordFormation'];
const PILOT_OPTIONS     = ['lectureQuestions', 'textCompletion', 'wordFormation', 'grammar'];
const DIFFICULTIES      = ['adaptive', 'easy', 'medium', 'hard'];
const DIFFICULTY_LEVELS = { easy: 1, medium: 2, hard: 3 };
const REVIEW_LIMIT      = 60;
const TIME_GOOD         = 22;  // seconds — fast response
const TIME_SLOW         = 35;  // seconds — slow response, triggers review

const PRACTICE_COUNTS   = { reading: 4, lectureQuestions: 2, vocab: 12, textCompletion: 6, wordFormation: 8 };
const SIMULATION_COUNTS = { sentenceCompletion: 8, paraphrasing: 8, reading: 3, grammar: 6, wordFormation: 5, lectureQuestions: 1, textCompletion: 4 };

/* ─── Application state ─────────────────────────────────────── */
const app = {
  data:            null,   // question bank (keyed by mode)
  vocab:           [],     // vocab items
  state:           loadProgress(),
  current:         null,   // active session object
  timerId:         null,
  timerEndsAt:     null,
  selectedChoice:  null,
  isLoading:       false
};

/* ─── Boot ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', handleRoute);

// Delegate [data-action="route"] clicks — must be registered early
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action="route"]');
  if (!el) return;
  e.preventDefault();
  navigate(el.dataset.route);
});

async function init() {
  applyTheme();
  bindGlobalButtons();
  updateStreakForToday();
  renderLoading();
  await loadData();
  handleRoute();
  setupKeyboardShortcuts();
}

/* ─── Data loading ───────────────────────────────────────────── */
async function loadData() {
  const fallbackQuestions = buildFallbackQuestionBank();
  const fallbackVocab     = buildFallbackVocab();

  try {
    const [qRes, vRes] = await Promise.allSettled([
      fetch('questions.json', { cache: 'no-store' }),
      fetch('vocab.json',     { cache: 'no-store' })
    ]);

    const questionData = (qRes.status === 'fulfilled' && qRes.value.ok) ? await qRes.value.json() : fallbackQuestions;
    const vocabData    = (vRes.status === 'fulfilled' && vRes.value.ok) ? await vRes.value.json() : fallbackVocab;

    app.data  = normalizeQuestionBank(questionData, fallbackQuestions);
    app.vocab = normalizeVocabBank(vocabData, fallbackVocab);
  } catch (err) {
    console.warn('[Amirnet] Data load failed; using built-in fallback.', err);
    app.data  = normalizeQuestionBank({}, fallbackQuestions);
    app.vocab = normalizeVocabBank([], fallbackVocab);
  }
}

/* ─── Router ─────────────────────────────────────────────────── */
function handleRoute() {
  const raw   = location.hash.replace(/^#\/?/, '').trim();
  const route = raw || 'home';
  clearTimer();
  stopSpeech();

  if (route === 'home')              return renderHome();
  if (route === 'simulation')        return startSimulation(false);
  if (route === 'simulation-pilot')  return startSimulation(true);
  if (route.startsWith('mode/')) {
    const mode = route.split('/')[1];
    if (mode === 'smartReview') return startSmartReview();
    if (MODES[mode])            return startPractice(mode);
  }
  renderNotFound(route);
}

function navigate(route) {
  location.hash = route === 'home' ? '' : `#/${route}`;
}

/* ─── Global buttons ─────────────────────────────────────────── */
function bindGlobalButtons() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    app.state.theme = app.state.theme === 'dark' ? 'light' : 'dark';
    saveProgress();
    applyTheme();
  });

  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (!confirm('Reset all practice history, smart review items, streak data, and score? This cannot be undone.')) return;
    app.state = loadProgress(true);
    saveProgress();
    navigate('home');
  });
}

/* ─── Loading state ──────────────────────────────────────────── */
function renderLoading() {
  const screen = getScreen();
  screen.innerHTML = `
    <div class="loading-overlay" role="status" aria-label="Loading question bank">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading…</p>
    </div>`;
}

/* ─── Home screen ────────────────────────────────────────────── */
function renderHome() {
  const screen = getScreen();
  screen.innerHTML = '';
  screen.appendChild(cloneTemplate('home-template'));
  screen.focus();

  document.getElementById('dailyGoalValue').textContent = `${app.state.dailyGoal} questions`;
  document.getElementById('streakValue').textContent    = String(app.state.streak);
  document.getElementById('scoreValue').textContent     = String(estimateScore());
  document.getElementById('dashboardStats').innerHTML   = buildDashboardStats();
  document.getElementById('heatmap').innerHTML          = buildHeatmap();
  document.getElementById('modeGrid').innerHTML         = buildModeCards();
  document.getElementById('editGoalBtn').addEventListener('click', editDailyGoal);

  replaceDifficultyControl('globalDifficulty', app.state.difficultyPreference, (v) => {
    app.state.difficultyPreference = v;
    saveProgress();
    renderHome();
  });
}

function buildModeCards() {
  const order = ['sentenceCompletion','paraphrasing','grammar','wordFormation','reading','vocab','lectureQuestions','textCompletion','smartReview'];
  return order.map((mode) => {
    const stats    = app.state.modeStats[mode] || emptyStats();
    const accuracy = stats.answered
      ? `${Math.round((stats.correct / stats.answered) * 100)}% accuracy · ${stats.answered} answered`
      : 'Not started';
    const mins = MODES[mode].sectionMinutes;
    const timeLabel = mins > 0 ? `⏱ ${mins} min` : '∞ Untimed';
    return `
      <button class="mode-card" type="button" data-action="route" data-route="mode/${mode}"
        role="listitem" aria-label="Practice ${MODES[mode].label}">
        <div class="mode-card-top">
          <span class="mode-card-name">${esc(MODES[mode].label)}</span>
          <span class="mode-card-time">${timeLabel}</span>
        </div>
        <span class="mode-card-desc">${esc(MODES[mode].description)}</span>
        <span class="mode-card-stat">${esc(accuracy)}</span>
      </button>`;
  }).join('');
}

function buildDashboardStats() {
  const totalAnswered = app.state.totalAnswered;
  const accuracy      = totalAnswered ? Math.round((app.state.totalCorrect / totalAnswered) * 100) : 0;
  const avgTime       = app.state.responseTimes.length ? Math.round(average(app.state.responseTimes)) : 0;
  const todayCount    = countTodayProgress();
  const goalPercent   = Math.min(100, Math.round((todayCount / app.state.dailyGoal) * 100));

  return [
    statRow('Total questions answered',   totalAnswered || '—'),
    statRow('Overall accuracy',           totalAnswered ? `${accuracy}%` : '—'),
    statRow('Average response time',      avgTime ? `${avgTime}s` : '—'),
    statRow('Highest difficulty reached', capitalize(app.state.highestDifficultyReached)),
    statRow('Today\'s progress',          `${todayCount} / ${app.state.dailyGoal} (${goalPercent}%)`),
    statRow('Smart review queue',         `${app.state.reviewQueue.length} items`)
  ].join('');
}

function buildHeatmap() {
  const modes = ['sentenceCompletion','paraphrasing','grammar','wordFormation','reading','vocab','lectureQuestions','textCompletion'];
  return modes.flatMap((mode) => {
    const stats = app.state.modeStats[mode] || emptyStats();
    const total = Math.max(1, Object.values(stats.difficultyHits).reduce((s, v) => s + v, 0));
    return ['easy','medium','hard'].map((level) => {
      const count   = stats.difficultyHits[level] || 0;
      const percent = Math.round((count / total) * 100);
      return `
        <div class="heat-cell" role="listitem">
          <span class="heat-cell-name">${esc(MODES[mode].label)}</span>
          <span class="heat-cell-meta">${capitalize(level)}: ${count}</span>
          <div class="heat-track" role="presentation">
            <div class="heat-fill" style="width:${percent}%" aria-hidden="true"></div>
          </div>
        </div>`;
    });
  }).join('');
}

/* ─── Practice ───────────────────────────────────────────────── */
function startPractice(mode) {
  const screen = getScreen();
  screen.innerHTML = '';
  screen.appendChild(cloneTemplate('practice-template'));
  screen.focus();

  app.current = {
    kind:                    'practice',
    mode,
    questionIndex:           0,
    startedAt:               Date.now(),
    currentDifficulty:       resolveStartingDifficulty(mode),
    queue:                   buildQuestionQueue(mode, resolveStartingDifficulty(mode), false),
    answers:                 [],
    listeningIndex:          0,
    listeningResponses:      {},
    showTranscript:          false,
    pendingResult:           null
  };

  document.getElementById('sideTitle').textContent = MODES[mode].label;
  bindPracticeButtons();
  replaceDifficultyControl('practiceDifficulty', app.state.difficultyPreference, onPracticeDifficultyChange);
  renderSideStats(mode);
  showSessionProgress();
  loadCurrentQuestion();

  // Start the real-exam section timer (if this mode has one)
  const sectionSeconds = MODES[mode].timer;
  if (sectionSeconds > 0) {
    startTimer(sectionSeconds, () => renderTimeUp(mode));
  }
}

function bindPracticeButtons() {
  document.getElementById('submitBtn').addEventListener('click', submitCurrentQuestion);
  document.getElementById('nextBtn').addEventListener('click', moveToNextQuestion);
}

function onPracticeDifficultyChange(value) {
  app.state.difficultyPreference = value;
  saveProgress();
  if (app.current?.kind === 'practice') {
    app.current.currentDifficulty   = resolveStartingDifficulty(app.current.mode);
    app.current.queue                = buildQuestionQueue(app.current.mode, app.current.currentDifficulty, false);
    app.current.questionIndex        = 0;
    app.current.listeningIndex       = 0;
    app.current.listeningResponses   = {};
    showSessionProgress();
    loadCurrentQuestion();
    renderSideStats(app.current.mode);
  }
}

function createPracticeSession(mode) {
  return {
    kind:               'practice',
    mode,
    questionIndex:      0,
    startedAt:          Date.now(),
    currentDifficulty:  resolveStartingDifficulty(mode),
    queue:              buildQuestionQueue(mode, resolveStartingDifficulty(mode), false),
    answers:            [],
    listeningIndex:     0,
    listeningResponses: {},
    showTranscript:     false,
    pendingResult:      null
  };
}

function renderSideStats(mode) {
  const stats    = app.state.modeStats[mode] || emptyStats();
  const accuracy = stats.answered ? `${Math.round((stats.correct / stats.answered) * 100)}%` : '—';
  const avgTime  = stats.times.length ? `${Math.round(average(stats.times))}s` : '—';
  const modeText = app.state.difficultyPreference === 'adaptive' ? 'Adaptive' : 'Locked';

  const mins = MODES[mode]?.sectionMinutes;
  const timeInfo = mins > 0 ? `${mins} min (real exam)` : 'Untimed';
  document.getElementById('sideStats').innerHTML = [
    statRow('Section time', timeInfo),
    statRow('Difficulty',   capitalize(app.current?.currentDifficulty || resolveStartingDifficulty(mode))),
    statRow('Mode',         modeText),
    statRow('Accuracy',     accuracy),
    statRow('Avg. time',    avgTime),
    statRow('Streak',       String(app.state.currentCorrectStreak))
  ].join('');
}

function showSessionProgress() {
  const el = document.getElementById('sessionProgress');
  if (!el || !app.current) return;
  const queue = app.current.queue;
  if (!queue || !queue.length) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  updateSessionProgress();
}

function updateSessionProgress() {
  const el = document.getElementById('sessionProgress');
  if (!el || !app.current?.queue?.length) return;
  const idx   = app.current.questionIndex;
  const total = app.current.queue.length;
  const pct   = Math.round((idx / total) * 100);

  const label   = document.getElementById('progressLabel');
  const pctEl   = document.getElementById('progressPercent');
  const fill    = document.getElementById('progressFill');
  const bar     = el.querySelector('.progress-bar');

  if (label)  label.textContent   = `Question ${idx + 1} of ${total}`;
  if (pctEl)  pctEl.textContent   = `${pct}%`;
  if (fill)   fill.style.width    = `${pct}%`;
  if (bar)    bar.setAttribute('aria-valuenow', pct);
}

/* ─── Load question ──────────────────────────────────────────── */
function loadCurrentQuestion() {
  const session   = app.current;
  const queueItem = session.queue[session.questionIndex];
  if (!queueItem) {
    return renderEmptyState(
      MODES[session.mode].label,
      'No more questions are available in this set.',
      'Try a different difficulty level or return home to choose another mode.'
    );
  }
  app.selectedChoice = null;
  resetQuestionUI();
  updateSessionProgress();

  if (session.mode === 'reading')          return renderReadingQuestion(queueItem);
  if (session.mode === 'lectureQuestions') return renderListeningQuestion(queueItem);
  return renderStandardQuestion(session.mode, queueItem);
}

function resetQuestionUI() {
  document.getElementById('feedbackCard').classList.add('hidden');
  document.getElementById('nextBtn').classList.add('hidden');
  document.getElementById('submitBtn').classList.remove('hidden');
  document.getElementById('submitBtn').disabled = false;
}

/* ─── Standard question ──────────────────────────────────────── */
function renderStandardQuestion(mode, question) {
  const typeLabel = mode === 'vocab' ? 'Vocabulary' : MODES[mode].label;
  document.getElementById('questionMeta').textContent  = `${typeLabel} · ${capitalize(question.difficulty || app.current.currentDifficulty)}`;
  document.getElementById('questionTitle').textContent = getPromptTitle(mode, question);
  document.getElementById('questionBody').innerHTML    = buildQuestionBody(mode, question);

  const choices = document.getElementById('questionChoices');
  choices.innerHTML = '';

  if (mode === 'wordFormation') {
    document.getElementById('questionBody').insertAdjacentHTML('beforeend',
      `<div class="question-box">
        <strong>Base word</strong>
        <label for="wordInput" class="sr-only">Enter the correct word form</label>
        <input id="wordInput" class="word-input" autocomplete="off"
          placeholder="Type the correct word form…" aria-label="Word answer input" />
      </div>`
    );
    document.getElementById('wordInput')?.focus();
  } else {
    const opts = question.choices || [];
    opts.forEach((text, idx) => choices.appendChild(buildChoiceButton(text, idx)));
  }

  // Timer stays visible (started by startPractice / renderCurrentSimulationSection)
  app.current.currentQuestionStartedAt = Date.now();
}

/* ─── Reading question ───────────────────────────────────────── */
function renderReadingQuestion(passage) {
  const q = passage.activeQuestion;
  document.getElementById('questionMeta').textContent  = `Reading Comprehension · ${capitalize(passage.difficulty)}`;
  document.getElementById('questionTitle').textContent = esc(passage.title);
  document.getElementById('questionBody').innerHTML    = `
    <div class="question-box"><p>${esc(passage.passage)}</p></div>
    <div class="question-box"><strong>Question</strong> ${esc(q.question)}</div>`;

  const choices = document.getElementById('questionChoices');
  choices.innerHTML = '';
  q.choices.forEach((text, idx) => choices.appendChild(buildChoiceButton(text, idx)));

  // Timer stays visible
  app.current.currentQuestionStartedAt = Date.now();
}

/* ─── Listening question ─────────────────────────────────────── */
function renderListeningQuestion(item) {
  const q = item.questions[app.current.listeningIndex];
  if (!q) {
    console.warn('[Amirnet] Listening question index out of bounds');
    return;
  }

  document.getElementById('questionMeta').textContent  = `Pilot practice · ${capitalize(item.difficulty)}`;
  document.getElementById('questionTitle').textContent = esc(item.title);
  document.getElementById('questionBody').innerHTML    = `
    <div class="audio-row">
      <button class="btn btn-primary btn-sm" type="button" id="playAudioBtn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Play audio
      </button>
      <button class="btn btn-secondary btn-sm" type="button" id="replayAudioBtn">Replay</button>
      <button class="btn btn-ghost btn-sm" type="button" id="toggleTranscriptBtn">
        ${app.current.showTranscript ? 'Hide transcript' : 'Show transcript'}
      </button>
    </div>
    <div class="question-box">
      <strong>Question ${app.current.listeningIndex + 1} of ${item.questions.length}</strong>
      ${esc(q.question)}
    </div>
    <div class="question-box${app.current.showTranscript ? '' : ' hidden'}" id="transcriptBox"
      aria-label="Transcript">
      <strong>Transcript</strong>
      <p>${esc(item.transcript)}</p>
    </div>`;

  const choices = document.getElementById('questionChoices');
  choices.innerHTML = '';
  q.choices.forEach((text, idx) => {
    const isSelected = app.current.listeningResponses[app.current.listeningIndex] === idx;
    choices.appendChild(buildChoiceButton(text, idx, isSelected));
  });

  document.getElementById('playAudioBtn').addEventListener('click', () => speakText(item.transcript, false));
  document.getElementById('replayAudioBtn').addEventListener('click', () => speakText(item.transcript, true));
  document.getElementById('toggleTranscriptBtn').addEventListener('click', () => {
    app.current.showTranscript = !app.current.showTranscript;
    renderListeningQuestion(item);
  });

  // Timer stays visible
  app.current.currentQuestionStartedAt = Date.now();
}

/* ─── Choice button ──────────────────────────────────────────── */
function buildChoiceButton(text, index, selected = false) {
  const button = document.createElement('button');
  button.type       = 'button';
  button.className  = `choice${selected ? ' selected' : ''}`;
  button.setAttribute('role', 'listitem');
  button.innerHTML  = `<span class="choice-badge">${String.fromCharCode(65 + index)}</span><span>${esc(text)}</span>`;
  button.addEventListener('click', () => selectChoice(index, button));
  return button;
}

function selectChoice(index, buttonEl) {
  app.selectedChoice = index;
  if (app.current?.mode === 'lectureQuestions') {
    app.current.listeningResponses[app.current.listeningIndex] = index;
  }
  document.querySelectorAll('.choice').forEach((n) => n.classList.remove('selected'));
  buttonEl.classList.add('selected');
}

/* ─── Submit ─────────────────────────────────────────────────── */
function submitCurrentQuestion() {
  const session = app.current;
  if (!session) return;
  const item    = session.queue[session.questionIndex];
  const elapsed = Math.max(1, Math.round((Date.now() - session.currentQuestionStartedAt) / 1000));

  /* Listening */
  if (session.mode === 'lectureQuestions') {
    const q      = item.questions[session.listeningIndex];
    const chosen = session.listeningResponses[session.listeningIndex];
    if (chosen === undefined) { flashSubmitValidation(); return; }
    const isCorrect = chosen === q.answer;
    showFeedback({ success: isCorrect, correctText: q.choices[q.answer], explanation: q.explanation, wrongReasons: q.wrongReasons, responseSeconds: elapsed });
    session.pendingResult = { mode: session.mode, question: mapListeningQuestion(item, q), correct: isCorrect, seconds: elapsed };
    revealAnswerChoices(q.answer, chosen);
    toggleActionButtons(false);
    return;
  }

  /* Word formation */
  if (session.mode === 'wordFormation') {
    const value = document.getElementById('wordInput')?.value.trim().toLowerCase();
    if (!value) { flashSubmitValidation(); return; }
    const isCorrect = value === String(item.answer).trim().toLowerCase();
    showFeedback({ success: isCorrect, correctText: item.answer, explanation: item.explanation, wrongReasons: item.wrongReasons, responseSeconds: elapsed });
    session.pendingResult = { mode: session.mode, question: item, correct: isCorrect, seconds: elapsed };
    if (document.getElementById('wordInput')) document.getElementById('wordInput').disabled = true;
    toggleActionButtons(false);
    return;
  }

  /* Multiple choice */
  const activeQuestion = session.mode === 'reading' ? item.activeQuestion : item;
  if (app.selectedChoice === null) { flashSubmitValidation(); return; }
  const isCorrect = app.selectedChoice === activeQuestion.answer;
  showFeedback({
    success:         isCorrect,
    correctText:     activeQuestion.choices[activeQuestion.answer],
    explanation:     activeQuestion.explanation || item.explanation,
    wrongReasons:    activeQuestion.wrongReasons || item.wrongReasons,
    responseSeconds: elapsed
  });
  session.pendingResult = { mode: session.mode, question: item, correct: isCorrect, seconds: elapsed };
  revealAnswerChoices(activeQuestion.answer, app.selectedChoice);
  toggleActionButtons(false);
}

function toggleActionButtons(showSubmit) {
  document.getElementById('submitBtn').classList.toggle('hidden', !showSubmit);
  document.getElementById('nextBtn').classList.toggle('hidden', showSubmit);
}

function flashSubmitValidation() {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.style.outline = '2px solid var(--danger)';
  setTimeout(() => { btn.style.outline = ''; }, 800);
}

/* ─── Move to next question ──────────────────────────────────── */
function moveToNextQuestion() {
  const session = app.current;
  if (!session?.pendingResult) return;

  registerResult(session.pendingResult.mode, session.pendingResult.question, session.pendingResult.correct, session.pendingResult.seconds);
  adaptDifficultyAfterAnswer(session.pendingResult.correct, session.mode);
  session.answers.push(session.pendingResult);
  session.pendingResult = null;

  /* Advance through sub-questions in a listening item */
  if (session.mode === 'lectureQuestions') {
    const item = session.queue[session.questionIndex];
    if (item && session.listeningIndex + 1 < item.questions.length) {
      session.listeningIndex += 1;
      renderListeningQuestion(item);
      renderSideStats(session.mode);
      return;
    }
    /* All sub-questions answered — reset index for next item */
    session.listeningIndex = 0;
    session.listeningResponses = {};
  }

  session.questionIndex += 1;

  if (session.kind === 'simulation') return advanceSimulation();

  if (session.questionIndex >= session.queue.length) {
    return renderSessionResults(session.answers, `${MODES[session.mode].label} complete`);
  }

  renderSideStats(session.mode);
  loadCurrentQuestion();
}

/* ─── Reveal answer colours ───────────────────────────────────── */
function revealAnswerChoices(correctIndex, selectedIndex) {
  document.querySelectorAll('.choice').forEach((node, idx) => {
    node.classList.remove('selected');
    node.disabled = true;
    if (idx === correctIndex)                               node.classList.add('correct');
    if (idx === selectedIndex && selectedIndex !== correctIndex) node.classList.add('incorrect');
  });
}

/* ─── Simulation ─────────────────────────────────────────────── */
function startSimulation(includePilot) {
  const sections = SIMULATION_CORE.map((mode) => ({
    mode,
    pool: buildQuestionQueue(mode, resolveStartingDifficulty(mode), true)
  }));

  if (includePilot) {
    randomize([...PILOT_OPTIONS]).slice(0, 2).forEach((mode) =>
      sections.push({ mode, pool: buildQuestionQueue(mode, resolveStartingDifficulty(mode), true), pilot: true })
    );
  }

  app.current = {
    kind:               'simulation',
    includePilot,
    sections,
    sectionIndex:       0,
    questionIndex:      0,
    currentDifficulty:  resolveStartingDifficulty(sections[0].mode),
    mode:               sections[0].mode,
    queue:              sections[0].pool,
    answers:            [],
    listeningIndex:     0,
    listeningResponses: {},
    showTranscript:     false,
    pendingResult:      null
  };

  const screen = getScreen();
  screen.innerHTML = '';
  screen.appendChild(cloneTemplate('practice-template'));
  screen.focus();
  bindPracticeButtons();
  replaceDifficultyControl('practiceDifficulty', app.state.difficultyPreference, (v) => {
    app.state.difficultyPreference = v;
    saveProgress();
  });
  renderCurrentSimulationSection();
}

function renderCurrentSimulationSection() {
  const section = app.current.sections[app.current.sectionIndex];
  if (!section) return finishSimulation();

  app.current.mode               = section.mode;
  app.current.queue              = section.pool;
  app.current.questionIndex      = 0;
  app.current.listeningIndex     = 0;
  app.current.listeningResponses = {};
  app.current.currentDifficulty  = resolveStartingDifficulty(section.mode);

  const label = `Simulation · ${MODES[section.mode].label}${section.pilot ? ' · Pilot' : ''}`;
  document.getElementById('sideTitle').textContent = label;
  renderSideStats(section.mode);
  showSessionProgress();
  startTimer(MODES[section.mode].timer || 0, () => {
    app.current.sectionIndex += 1;
    renderCurrentSimulationSection();
  });
  loadCurrentQuestion();
}

function advanceSimulation() {
  if (app.current.questionIndex >= app.current.queue.length) {
    app.current.sectionIndex += 1;
    return renderCurrentSimulationSection();
  }
  renderSideStats(app.current.mode);
  loadCurrentQuestion();
}

function finishSimulation() {
  clearTimer();
  const title = app.current.includePilot
    ? 'Updated Amirnet simulation with pilot sections complete'
    : 'Core Amirnet simulation complete';
  renderSessionResults(app.current.answers, title);
}

/* ─── Smart Review ───────────────────────────────────────────── */
function startSmartReview() {
  const reviewItems = dedupeReviewItems(app.state.reviewQueue).slice(0, 15);
  if (!reviewItems.length) {
    return renderEmptyState(
      'Smart Review',
      'Your review queue is empty.',
      'Answer a few practice questions first. Mistakes and slow responses are automatically added here.'
    );
  }

  const screen = getScreen();
  screen.innerHTML = '';
  screen.appendChild(cloneTemplate('practice-template'));
  screen.focus();

  app.current = {
    kind:               'review',
    mode:               reviewItems[0].mode,
    queue:              reviewItems,
    questionIndex:      0,
    currentDifficulty:  app.state.difficultyPreference === 'adaptive' ? 'medium' : app.state.difficultyPreference,
    answers:            [],
    listeningIndex:     0,
    listeningResponses: {},
    showTranscript:     false,
    pendingResult:      null
  };

  replaceDifficultyControl('practiceDifficulty', app.state.difficultyPreference, (v) => {
    app.state.difficultyPreference = v;
    saveProgress();
  });
  document.getElementById('submitBtn').addEventListener('click', submitCurrentQuestion);
  document.getElementById('nextBtn').addEventListener('click', nextReviewQuestion);
  renderReviewQuestion();
}

function renderReviewQuestion() {
  const entry = app.current.queue[app.current.questionIndex];
  if (!entry) return renderSessionResults(app.current.answers, 'Smart review complete');

  app.current.mode = entry.mode;
  document.getElementById('sideTitle').textContent = `${MODES[entry.mode].label} · Smart Review`;
  renderSideStats(entry.mode);
  resetQuestionUI();
  updateSessionProgress();

  if (entry.mode === 'lectureQuestions') {
    app.current.listeningIndex     = 0;
    app.current.listeningResponses = {};
    renderListeningQuestion(entry.question);
  } else if (entry.mode === 'reading') {
    renderReadingQuestion(entry.question);
  } else {
    renderStandardQuestion(entry.mode, entry.question);
  }

  /* Override meta pill to show review reason */
  document.getElementById('questionMeta').textContent = `${MODES[entry.mode].label} · Review: ${entry.reason}`;
}

function nextReviewQuestion() {
  const pending = app.current.pendingResult;
  if (!pending) return;
  registerResult(pending.mode, pending.question, pending.correct, pending.seconds);
  app.current.answers.push(pending);
  app.current.pendingResult = null;
  app.current.questionIndex += 1;
  renderReviewQuestion();
}

/* ─── Feedback ───────────────────────────────────────────────── */
function showFeedback({ success, correctText, explanation, wrongReasons, responseSeconds }) {
  const card = document.getElementById('feedbackCard');
  const icon = success
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  card.className = `card feedback-card ${success ? 'success' : 'error'}`;
  card.classList.remove('hidden');
  card.innerHTML = `
    <h3>${icon} ${success ? 'Correct' : 'Not quite right'}</h3>
    <p><strong>Correct answer:</strong> ${esc(correctText)}</p>
    <p><strong>Explanation:</strong> ${esc(explanation || 'Focus on meaning, grammar, and the full sentence context.')}</p>
    ${Array.isArray(wrongReasons) && wrongReasons.length
      ? `<p><strong>Why the other options are weaker:</strong></p>
         <ul>${wrongReasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
      : ''}
    <p class="feedback-meta">Response time: ${responseSeconds}s${responseSeconds > TIME_SLOW ? ' — aim for under 30s on non-reading items' : ''}</p>`;
}

/* ─── Register result ────────────────────────────────────────── */
function registerResult(mode, question, isCorrect, seconds) {
  const modeStats = app.state.modeStats[mode] || emptyStats();

  app.state.totalAnswered += 1;
  app.state.totalCorrect  += isCorrect ? 1 : 0;
  app.state.responseTimes  = trimArray([...app.state.responseTimes, seconds], 500);

  modeStats.answered  += 1;
  modeStats.correct   += isCorrect ? 1 : 0;
  modeStats.times      = trimArray([...modeStats.times, seconds], 80);
  modeStats.lastDifficulty = app.current.currentDifficulty;

  const diff = app.current.currentDifficulty;
  if (modeStats.difficultyHits[diff] !== undefined) modeStats.difficultyHits[diff] += 1;

  if (DIFFICULTY_LEVELS[diff] > DIFFICULTY_LEVELS[app.state.highestDifficultyReached]) {
    app.state.highestDifficultyReached = diff;
  }

  app.state.currentCorrectStreak = isCorrect ? app.state.currentCorrectStreak + 1 : 0;
  app.state.modeStats[mode] = modeStats;

  /* Add to review queue on mistake or slow response */
  const reason = !isCorrect ? 'mistake' : seconds >= TIME_SLOW ? 'slow response' : null;
  if (reason)                         enqueueReview(mode, question, reason);
  if (mode === 'vocab' && !isCorrect) enqueueReview(mode, question, 'vocabulary');

  updateStreakForAnswer();
  saveProgress();
}

/* ─── Review queue ───────────────────────────────────────────── */
function enqueueReview(mode, question, reason) {
  const key      = `${mode}:${question.id || question.title || question.text || question.word || 'unknown'}`;
  const filtered = app.state.reviewQueue.filter((e) => e.key !== key);
  filtered.unshift({ key, mode, question, reason, addedAt: new Date().toISOString() });
  app.state.reviewQueue = filtered.slice(0, REVIEW_LIMIT);
}

/* ─── Adaptive difficulty ────────────────────────────────────── */
function adaptDifficultyAfterAnswer(isCorrect, mode) {
  if (app.state.difficultyPreference !== 'adaptive') {
    app.current.currentDifficulty = app.state.difficultyPreference;
    return;
  }
  if (isCorrect && app.state.currentCorrectStreak >= 2) {
    app.current.currentDifficulty = nextDifficulty(app.current.currentDifficulty);
  } else if (!isCorrect) {
    app.current.currentDifficulty = previousDifficulty(app.current.currentDifficulty);
  }
  renderSideStats(mode);
}

function resolveStartingDifficulty(mode) {
  if (app.state.difficultyPreference !== 'adaptive') return app.state.difficultyPreference;
  const stats = app.state.modeStats[mode] || emptyStats();
  if (stats.answered < 8) return mode === 'lectureQuestions' ? 'medium' : 'easy';
  const accuracy = stats.correct / Math.max(1, stats.answered);
  if (accuracy >= 0.82) return 'hard';
  if (accuracy >= 0.62) return 'medium';
  return 'easy';
}

/* ─── Question queue ─────────────────────────────────────────── */
function buildQuestionQueue(mode, difficulty, simulation) {
  if (mode === 'vocab') {
    const pool = selectByDifficulty(app.vocab, difficulty, 12);
    return randomize(pool).slice(0, simulation ? 10 : 12);
  }
  const source      = app.data[mode] || [];
  const targetCount = simulation ? simulationCount(mode) : practiceCount(mode);
  const pool        = selectByDifficulty(source, difficulty, targetCount);
  return randomize(pool).slice(0, targetCount).map((entry) =>
    mode === 'reading'
      ? { ...entry, activeQuestion: entry.questions[Math.floor(Math.random() * entry.questions.length)] }
      : deepClone(entry)
  );
}

function practiceCount(mode)   { return PRACTICE_COUNTS[mode]   ?? 8; }
function simulationCount(mode) { return SIMULATION_COUNTS[mode] ?? 4; }

function selectByDifficulty(pool, difficulty, count) {
  const preferred = pool.filter((item) => (item.difficulty || 'easy') === difficulty);
  const fallback  = pool.filter((item) => !preferred.includes(item));
  return [...preferred, ...fallback].slice(0, Math.max(count, preferred.length || count));
}

/* ─── Results screen ─────────────────────────────────────────── */
function renderSessionResults(answerLog, title) {
  const score     = estimateScoreFromAnswers(answerLog);
  const accuracy  = answerLog.length ? Math.round((answerLog.filter((e) => e.correct).length / answerLog.length) * 100) : 0;
  const avgTime   = answerLog.length ? Math.round(average(answerLog.map((e) => e.seconds))) : 0;
  const grouped   = {};

  answerLog.forEach((entry) => {
    grouped[entry.mode] ||= { total: 0, correct: 0 };
    grouped[entry.mode].total   += 1;
    grouped[entry.mode].correct += entry.correct ? 1 : 0;
  });

  const screen = getScreen();
  screen.innerHTML = '';
  screen.appendChild(cloneTemplate('results-template'));
  screen.focus();

  document.getElementById('resultsTitle').textContent    = title;
  document.getElementById('resultsScore').textContent    = String(score);
  document.getElementById('resultsAccuracy').textContent = `${accuracy}%`;
  document.getElementById('resultsTime').textContent     = avgTime ? `${avgTime}s` : '—';

  document.getElementById('resultsBreakdown').innerHTML = Object.entries(grouped)
    .map(([mode, v]) => {
      const pct = Math.round((v.correct / v.total) * 100);
      return statRow(MODES[mode]?.label || mode, `${pct}% (${v.correct}/${v.total})`);
    }).join('');

  document.getElementById('resultsRecommendations').innerHTML = buildRecommendations(grouped, avgTime, score)
    .map((item) => `<div class="recommendation-item">${item}</div>`).join('');
}

/* ─── Recommendations ────────────────────────────────────────── */
function buildRecommendations(grouped, avgTime, score) {
  const weakest = Object.entries(grouped)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0];

  const list = [];
  if (weakest) {
    list.push(`Your weakest section this session is <strong>${esc(MODES[weakest[0]]?.label || weakest[0])}</strong>. Open it as a focused drill in your next session.`);
  }
  list.push(
    avgTime > TIME_SLOW
      ? 'Your average pacing is slow. On non-reading items, aim to commit to an answer within 25–30 seconds.'
      : 'Your pacing is solid. Avoid unnecessary re-reading once you have identified the key clue.'
  );
  list.push(
    score >= 134
      ? 'You are at or above the placement exemption line. Use your final days on timed full simulations and smart review.'
      : 'Focus on hard-mode vocabulary, Grammar in Context, and one full timed simulation every other day to close the gap.'
  );
  list.push('For Sentence Completion and Text Completion, eliminate options that match the grammar but clash with the tone or collocation of the sentence.');
  list.push('For pilot listening items, listen for structure: main point → speaker goal → supporting detail.');
  return list;
}

/* ─── Timer ──────────────────────────────────────────────────── */
function startTimer(seconds, onEnd) {
  if (!seconds) return toggleTimer(false);
  app.timerEndsAt = Date.now() + seconds * 1000;
  const timerEl = document.getElementById('timer');
  timerEl.classList.remove('hidden');
  renderTimerDisplay(timerEl);
  clearTimer();
  app.timerId = setInterval(() => {
    renderTimerDisplay(timerEl);
    if (Date.now() >= app.timerEndsAt) { clearTimer(); onEnd(); }
  }, 500);
}

function renderTimerDisplay(el) {
  const remaining = Math.max(0, Math.round((app.timerEndsAt - Date.now()) / 1000));
  el.textContent = formatTime(remaining);
  el.classList.toggle('warning', remaining <= 60 && remaining > 20);
  el.classList.toggle('danger',  remaining <= 20);
}

function toggleTimer(show) {
  document.getElementById('timer')?.classList.toggle('hidden', !show);
}

function clearTimer() {
  if (app.timerId) clearInterval(app.timerId);
  app.timerId = null;
}

/* ─── Difficulty control ─────────────────────────────────────── */
function replaceDifficultyControl(id, selected, onChange) {
  const existing = document.getElementById(id);
  if (!existing) return;
  const wrapper = buildDifficultyControl(id, selected, onChange);
  existing.replaceWith(wrapper);
}

function buildDifficultyControl(id, selected, onChange) {
  const wrapper = document.createElement('div');
  wrapper.id        = id;
  wrapper.className = 'segmented';
  wrapper.setAttribute('role', 'radiogroup');

  DIFFICULTIES.forEach((diff) => {
    const btn = document.createElement('button');
    btn.type       = 'button';
    btn.className  = `segment${diff === selected ? ' active' : ''}`;
    btn.textContent = capitalize(diff);
    btn.setAttribute('aria-pressed', String(diff === selected));
    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.segment').forEach((s) => {
        s.classList.toggle('active', s === btn);
        s.setAttribute('aria-pressed', String(s === btn));
      });
      onChange(diff);
    });
    wrapper.appendChild(btn);
  });
  return wrapper;
}

/* ─── Question helpers ───────────────────────────────────────── */
function buildQuestionBody(mode, question) {
  switch (mode) {
    case 'textCompletion':
      return `<div class="question-box"><p>${esc(question.passage).replace('___', '<span class="blank-slot">_____</span>')}</p></div>`;
    case 'vocab':
      return `<div class="question-box"><strong>Example sentence</strong><p>${esc(question.example)}</p></div>`;
    case 'paraphrasing':
    case 'grammar':
    case 'sentenceCompletion':
      return `<div class="question-box"><p>${esc(question.text)}</p></div>`;
    default:
      return '';
  }
}

function getPromptTitle(mode, question) {
  if (mode === 'vocab')          return `What does "${question.word}" mean?`;
  if (mode === 'textCompletion') return question.title || 'Complete the passage';
  if (mode === 'wordFormation')  return question.text;
  return MODES[mode]?.label || '';
}

/* ─── Speech synthesis ───────────────────────────────────────── */
function speakText(text, restart) {
  if (!('speechSynthesis' in window)) return;
  if (restart || window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  const utterance  = new SpeechSynthesisUtterance(text);
  utterance.rate   = 0.92;
  utterance.pitch  = 1;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/* ─── State management ───────────────────────────────────────── */
function renderNotFound(route) {
  getScreen().innerHTML = `
    <div class="card state-card" role="main">
      <span class="state-icon" aria-hidden="true">🔍</span>
      <span class="badge badge-outline">Page not found</span>
      <h2>This page doesn't exist</h2>
      <p>The path <code>${esc(route)}</code> is not recognised. Use the button below or choose a practice mode from the home screen.</p>
      <div class="btn-group" style="justify-content:center">
        <button class="btn btn-primary" type="button" data-action="route" data-route="home">Back to home</button>
      </div>
    </div>`;
  getScreen().focus();
}

/* ─── Time's up overlay ──────────────────────────────────────── */
function renderTimeUp(mode) {
  clearTimer();
  stopSpeech();
  const answers = app.current?.answers || [];
  const screen  = getScreen();
  const correct = answers.filter(a => a.correct).length;
  const total   = answers.length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  screen.innerHTML = `
    <div class="card state-card timesup-card" role="main">
      <span class="state-icon" aria-hidden="true">⏰</span>
      <span class="badge badge-warning">Time's up</span>
      <h2>${esc(MODES[mode]?.label || mode)} — Section ended</h2>
      <p>Your ${esc(String(MODES[mode]?.sectionMinutes || 0))}-minute section time has elapsed, just like on the real Amirnet.</p>
      ${total > 0 ? `
        <div class="timesup-stats">
          <div class="timesup-stat"><span>Answered</span><strong>${total}</strong></div>
          <div class="timesup-stat"><span>Correct</span><strong>${correct}</strong></div>
          <div class="timesup-stat"><span>Accuracy</span><strong>${accuracy}%</strong></div>
        </div>` : '<p class="text-muted">No questions were submitted before time ran out.</p>'}
      <p class="timesup-tip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Tip: On the real exam you cannot go back. Practise committing to an answer within the section time.
      </p>
      <div class="btn-group" style="justify-content:center;margin-top:8px">
        <button class="btn btn-primary" type="button" data-action="route" data-route="mode/${esc(mode)}">Retry section</button>
        <button class="btn btn-secondary" type="button" data-action="route" data-route="home">Back to home</button>
        ${total > 0 ? `<button class="btn btn-ghost" type="button" data-action="route" data-route="mode/smartReview">Smart review</button>` : ''}
      </div>
    </div>`;
  screen.focus();
  // Save partial results
  if (total > 0) answers.forEach(a => registerResult(a.mode, a.question, a.correct, a.seconds));
}

function renderEmptyState(title, message, hint = '') {
  getScreen().innerHTML = `
    <div class="card state-card" role="main">
      <span class="state-icon" aria-hidden="true">📭</span>
      <h2>${esc(title)}</h2>
      <p>${esc(message)}</p>
      ${hint ? `<p class="text-muted text-sm">${esc(hint)}</p>` : ''}
      <div class="btn-group" style="justify-content:center">
        <button class="btn btn-primary" type="button" data-action="route" data-route="home">Back to home</button>
      </div>
    </div>`;
  getScreen().focus();
}

/* ─── Persistence ────────────────────────────────────────────── */
function loadProgress(reset = false) {
  const base = {
    totalAnswered:           0,
    totalCorrect:            0,
    responseTimes:           [],
    highestDifficultyReached:'easy',
    currentCorrectStreak:    0,
    dailyGoal:               25,
    streak:                  0,
    questionsToday:          0,
    lastPracticeDate:        null,
    difficultyPreference:    'adaptive',
    theme:                   'dark',
    reviewQueue:             [],
    modeStats: Object.fromEntries(Object.keys(MODES).map((m) => [m, emptyStats()]))
  };
  if (reset) return base;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return base;
    return {
      ...base,
      ...saved,
      responseTimes: Array.isArray(saved.responseTimes) ? saved.responseTimes.slice(-500) : [],
      reviewQueue:   Array.isArray(saved.reviewQueue)   ? saved.reviewQueue.slice(0, REVIEW_LIMIT) : [],
      modeStats: Object.fromEntries(
        Object.keys(MODES).map((m) => [m, { ...emptyStats(), ...(saved.modeStats?.[m] || {}) }])
      )
    };
  } catch {
    return base;
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
  } catch (err) {
    console.warn('[Amirnet] Could not save progress.', err);
  }
}

/* ─── Streak tracking ────────────────────────────────────────── */
function updateStreakForToday() {
  const today = todayKey();
  const last  = app.state.lastPracticeDate;
  if (!last || last === today) return;
  if (daysBetween(last, today) > 1) {
    app.state.streak        = 0;
    app.state.questionsToday = 0;
    saveProgress();
  }
}

function updateStreakForAnswer() {
  const today = todayKey();
  if (!app.state.lastPracticeDate) {
    app.state.streak         = 1;
    app.state.questionsToday = 1;
  } else if (app.state.lastPracticeDate === today) {
    app.state.questionsToday += 1;
  } else {
    const diff = daysBetween(app.state.lastPracticeDate, today);
    app.state.streak         = diff === 1 ? app.state.streak + 1 : 1;
    app.state.questionsToday = 1;
  }
  app.state.lastPracticeDate = today;
}

function countTodayProgress() {
  return app.state.lastPracticeDate === todayKey() ? app.state.questionsToday : 0;
}

/* ─── Score estimation ───────────────────────────────────────── */
function estimateScore() {
  const answered      = Math.max(1, app.state.totalAnswered);
  const accuracy      = app.state.totalCorrect / answered;
  const difficultyBonus = (DIFFICULTY_LEVELS[app.state.highestDifficultyReached] || 1) * 8;
  return clamp(Math.round(50 + accuracy * 80 + difficultyBonus), 50, 150);
}

function estimateScoreFromAnswers(answerLog) {
  if (!answerLog.length) return estimateScore();
  const weightedCorrect = answerLog.reduce((sum, e) => {
    if (!e.correct) return sum;
    const diff = e.question?.difficulty;
    const w = diff === 'hard' ? 1.4 : diff === 'medium' ? 1.2 : 1.0;
    return sum + w;
  }, 0);
  return clamp(Math.round(50 + (weightedCorrect / answerLog.length) * 75), 50, 150);
}

/* ─── Daily goal ─────────────────────────────────────────────── */
function editDailyGoal() {
  const raw = prompt(`Current daily goal: ${app.state.dailyGoal} questions.\n\nEnter a new goal (5 – 300):`, String(app.state.dailyGoal));
  if (raw === null) return;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 5 || value > 300) {
    alert('Please enter a whole number between 5 and 300.');
    return;
  }
  app.state.dailyGoal = Math.round(value);
  saveProgress();
  renderHome();
}

/* ─── Theme ──────────────────────────────────────────────────── */
function applyTheme() {
  document.body.classList.toggle('dark', app.state.theme === 'dark');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = app.state.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

/* ─── Keyboard shortcuts ─────────────────────────────────────── */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key.toLowerCase() === 'h' && e.ctrlKey) navigate('home');
      return;
    }
    if (e.key.toLowerCase() === 'h') { navigate('home'); return; }
    if (['1','2','3','4'].includes(e.key)) {
      document.querySelectorAll('.choice')[Number(e.key) - 1]?.click();
      return;
    }
    if (e.key === 'Enter') { document.getElementById('submitBtn')?.click(); return; }
    if (e.key.toLowerCase() === 'n') { document.getElementById('nextBtn')?.click(); }
  });
}

/* ─── Data normalisation ─────────────────────────────────────── */
function normalizeQuestionBank(data, fallback) {
  const merged = { ...fallback, ...(isObject(data) ? data : {}) };
  Object.keys(fallback).forEach((key) => {
    const incoming = Array.isArray(merged[key]) ? merged[key] : fallback[key];
    merged[key] = incoming.length ? incoming : fallback[key];
  });
  return merged;
}

function normalizeVocabBank(data, fallback) {
  if (Array.isArray(data) && data.length) {
    const valid = data.filter((e) => e.word && Array.isArray(e.choices) && typeof e.answer === 'number');
    return valid.length ? valid : fallback;
  }
  return fallback;
}

/* ─── Review helpers ─────────────────────────────────────────── */
function dedupeReviewItems(items) {
  const seen = new Set();
  return items.filter((e) => {
    if (seen.has(e.key)) return false;
    seen.add(e.key);
    return true;
  });
}

function mapListeningQuestion(item, question) {
  return {
    id:          `${item.id}-${question.question.slice(0, 20)}`,
    difficulty:  item.difficulty,
    text:        `${item.title} — ${question.question}`,
    choices:     question.choices,
    answer:      question.answer,
    explanation: question.explanation,
    wrongReasons:question.wrongReasons
  };
}

/* ─── Utility ────────────────────────────────────────────────── */
function emptyStats() {
  return { answered: 0, correct: 0, times: [], lastDifficulty: 'easy', difficultyHits: { easy: 0, medium: 0, hard: 0 } };
}
function statRow(label, value)  { return `<div role="listitem"><span>${esc(String(label))}</span><strong>${esc(String(value))}</strong></div>`; }
function nextDifficulty(v)      { return v === 'easy' ? 'medium' : 'hard'; }
function previousDifficulty(v)  { return v === 'hard' ? 'medium' : 'easy'; }
function trimArray(arr, max)    { return arr.slice(-max); }
function average(arr)           { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function todayKey()             { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b)      { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function formatTime(s)          { return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`; }
function capitalize(v = '')     { return v.charAt(0).toUpperCase() + v.slice(1); }
function clamp(v, lo, hi)       { return Math.max(lo, Math.min(hi, v)); }
function getScreen()            { return document.getElementById('screen'); }
function cloneTemplate(id)      { return document.getElementById(id).content.cloneNode(true); }
function isObject(v)            { return v && typeof v === 'object' && !Array.isArray(v); }
function deepClone(v)           { return JSON.parse(JSON.stringify(v)); }
function randomize(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
/** Escape HTML special characters to prevent XSS in innerHTML. */
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
  );
}

/* ─── Fallback data helpers ──────────────────────────────────── */
function buildFallbackQuestionBank() { return window.__AMIRNET_FALLBACK_QUESTIONS__; }
function buildFallbackVocab()        { return window.__AMIRNET_FALLBACK_VOCAB__; }

/* ─── Fallback data ──────────────────────────────────────────── */
window.__AMIRNET_FALLBACK_QUESTIONS__ = {"sentenceCompletion":[{"id":"sc1","difficulty":"easy","text":"The scientist repeated the experiment to make sure the results were _____.","choices":["reliable","ceremonial","fragile","annual"],"answer":0,"explanation":"Reliable fits the idea of results that can be trusted after repetition.","wrongReasons":["Ceremonial is unrelated to research.","Fragile describes physical weakness, not data quality.","Annual describes time, not trustworthiness."]},{"id":"sc2","difficulty":"easy","text":"Because the library was unusually quiet, Maya could study without any _____.","choices":["distraction","prediction","creation","reward"],"answer":0,"explanation":"A quiet library helps her study without distraction.","wrongReasons":["Prediction does not fit the context.","Creation is unrelated.","Reward does not complete the meaning."]},{"id":"sc3","difficulty":"medium","text":"The committee rejected the proposal because several details remained too _____ to support a final decision.","choices":["vague","efficient","curious","portable"],"answer":0,"explanation":"Vague details are unclear and make decisions difficult.","wrongReasons":["Efficient does not describe missing clarity.","Curious does not fit.","Portable is unrelated."]},{"id":"sc4","difficulty":"medium","text":"Although the lecture was long, the professor presented the material in such a _____ way that students remained attentive.","choices":["engaging","fragile","silent","ordinary"],"answer":0,"explanation":"An engaging lecture keeps students attentive.","wrongReasons":["Fragile and silent do not fit the teaching context.","Ordinary does not explain why they remained attentive."]},{"id":"sc5","difficulty":"hard","text":"The new policy was introduced gradually so that employees would have time to _____ to the revised procedures.","choices":["adapt","predict","hesitate","forbid"],"answer":0,"explanation":"Adapt means adjust to a new situation.","wrongReasons":["Predict is about forecasting, not adjusting.","Hesitate does not match the purpose.","Forbid is the opposite of what is needed."]},{"id":"sc6","difficulty":"hard","text":"The report was praised for its _____ analysis, which considered both the short-term and long-term effects of the reform.","choices":["comprehensive","accidental","artificial","temporary"],"answer":0,"explanation":"Comprehensive analysis considers the issue fully.","wrongReasons":["Accidental and artificial do not describe a careful report.","Temporary does not fit the idea of scope."]},{"id":"sc7","difficulty":"medium","text":"The manager asked for a concise summary because she did not have time to read the entire _____.","choices":["document","ceremony","landscape","permission"],"answer":0,"explanation":"A summary replaces reading a full document.","wrongReasons":["The other nouns do not fit the office context."]},{"id":"sc8","difficulty":"hard","text":"Many researchers are cautious about drawing conclusions from a small sample because the data may not be _____.","choices":["representative","decorative","submissive","portable"],"answer":0,"explanation":"Representative means the sample reflects the larger group.","wrongReasons":["Decorative, submissive, and portable are unrelated."]},{"id":"sc9","difficulty":"easy","text":"The company decided to _____ its prices after customers complained that the products were too expensive.","choices":["lower","delay","ignore","publish"],"answer":0,"explanation":"Lowering prices responds directly to the complaint.","wrongReasons":["Delay, ignore, and publish do not address the pricing issue."]},{"id":"sc10","difficulty":"medium","text":"The new bridge was designed to _____ heavy traffic and strong winds without damage.","choices":["withstand","postpone","replace","announce"],"answer":0,"explanation":"Withstand means to remain strong under pressure.","wrongReasons":["The other verbs do not describe structural strength."]},{"id":"sc11","difficulty":"hard","text":"Because the information was _____, the editor removed it from the final draft of the report.","choices":["irrelevant","important","accurate","beneficial"],"answer":0,"explanation":"Irrelevant information is removed because it does not belong.","wrongReasons":["The other adjectives would be reasons to keep, not remove, the information."]},{"id":"sc12","difficulty":"easy","text":"The students were asked to submit their essays by Friday, but several requested a _____.","choices":["extension","correction","replacement","reward"],"answer":0,"explanation":"An extension gives more time to submit work.","wrongReasons":["The other words do not relate to submitting by a later date."]}],"paraphrasing":[{"id":"p1","difficulty":"easy","text":"The meeting was postponed because several participants were still traveling.","choices":["The meeting was delayed since some participants had not arrived yet.","The meeting was canceled after all participants traveled.","The meeting started early because people were traveling.","The meeting continued although nobody arrived."],"answer":0,"explanation":"Postponed means delayed.","wrongReasons":["The other options change the meaning or contradict it."]},{"id":"p2","difficulty":"easy","text":"Unlike his brother, Daniel prefers working alone.","choices":["Daniel likes teamwork more than his brother does.","Daniel prefers to work independently, unlike his brother.","Daniel and his brother both dislike working alone.","Daniel refuses to work under any conditions."],"answer":1,"explanation":"Working alone means working independently.","wrongReasons":["A reverses the comparison.","C changes the meaning.","D is too strong."]},{"id":"p3","difficulty":"medium","text":"The museum expanded its hours in order to attract more visitors.","choices":["The museum reduced its hours to save money.","The museum changed its opening times to encourage more people to come.","The museum closed earlier because too many visitors arrived.","The museum invited visitors to work there."],"answer":1,"explanation":"Expanded its hours to attract visitors means changed opening times to encourage attendance.","wrongReasons":["The other options contradict or distort the sentence."]},{"id":"p4","difficulty":"medium","text":"Although the instructions looked simple, many users still made mistakes.","choices":["The instructions were simple, so users made no mistakes.","Many users made mistakes because the instructions were missing.","Even though the instructions appeared easy, many users still got things wrong.","Users made mistakes only after the instructions changed."],"answer":2,"explanation":"Although introduces contrast: looked simple yet mistakes happened.","wrongReasons":["A removes the contrast.","B adds information not given.","D changes the timeline."]},{"id":"p5","difficulty":"hard","text":"The author argues that technological progress should be measured by social benefit, not by novelty alone.","choices":["The author claims that new technology matters only when it improves society.","The author says novelty is more important than social benefit.","The author believes society should avoid all new technology.","The author measures social benefit by the number of inventions."],"answer":0,"explanation":"The sentence says novelty alone is not enough; social benefit matters.","wrongReasons":["The other options reverse or exaggerate the meaning."]},{"id":"p6","difficulty":"hard","text":"The results were inconclusive, so the team decided to conduct a follow-up study.","choices":["Because the results were clear, the team ended the project.","The team planned another study because the first findings did not lead to a firm conclusion.","The team ignored the results and changed topics.","The follow-up study produced conclusive results immediately."],"answer":1,"explanation":"Inconclusive means not leading to a firm conclusion.","wrongReasons":["The others add or reverse information."]},{"id":"p7","difficulty":"easy","text":"The store closed early because of the storm.","choices":["The store shut its doors sooner than usual due to the bad weather.","The store opened late on account of the storm.","The store remained open throughout the storm.","The storm caused the store to move to a different location."],"answer":0,"explanation":"Closed early because of the storm = shut sooner than usual due to bad weather.","wrongReasons":["B says 'opened late' which is different.","C contradicts the sentence.","D changes the meaning completely."]},{"id":"p8","difficulty":"medium","text":"Despite the heavy rain, the outdoor event was not canceled.","choices":["The event was canceled because of the heavy rain.","The outdoor event went ahead even though it rained heavily.","The rain caused the event to move indoors.","The event was postponed until the rain stopped."],"answer":1,"explanation":"Despite introduces contrast; the event continued in spite of the rain.","wrongReasons":["A contradicts the sentence.","C and D add information not stated."]},{"id":"p9","difficulty":"hard","text":"The professor recommended that students focus on primary sources rather than relying on summaries.","choices":["The professor told students that summaries are unreliable.","Students were advised to use original sources instead of secondary ones.","The professor argued that reading summaries is more efficient than reading originals.","Students should avoid primary sources when preparing for exams."],"answer":1,"explanation":"Primary sources = original sources; rather than = instead of.","wrongReasons":["A overstates the claim about summaries.","C reverses the recommendation.","D contradicts it."]},{"id":"p10","difficulty":"medium","text":"The company launched the product ahead of schedule to gain a competitive advantage.","choices":["The company released the product early to stay ahead of competitors.","The product was delayed so the company could improve its design.","The company gained a competitive advantage after its schedule changed.","The company launched the product because competitors forced them to."],"answer":0,"explanation":"Launched ahead of schedule = released early; gain a competitive advantage = stay ahead of competitors.","wrongReasons":["B reverses the timing.","C distorts the cause-effect relationship.","D adds unsupported information."]},{"id":"p11","difficulty":"easy","text":"Sara decided to take a gap year before starting her university degree.","choices":["Sara chose to wait a year before beginning her studies at university.","Sara dropped out of university to travel for a year.","Sara started university a year later than her classmates.","Sara took a break from her studies after her first year."],"answer":0,"explanation":"A gap year before university = waiting a year before beginning studies.","wrongReasons":["B implies she enrolled first.","C adds a comparison not in the sentence.","D places the break after starting."]},{"id":"p12","difficulty":"hard","text":"The legislation was amended after extensive lobbying by environmental groups.","choices":["Environmental groups successfully pushed for changes to the law.","The law was passed without any changes despite pressure from environmental groups.","Environmental groups created the original legislation.","The legislation was canceled after lobbying by environmental groups."],"answer":0,"explanation":"Amended = changed; lobbying = pushing for changes.","wrongReasons":["B contradicts the sentence.","C adds unsupported information.","D says canceled, not amended."]}],"grammar":[{"id":"g1","difficulty":"easy","text":"The teacher _____ the students to check their answers before submitting the test.","choices":["advised","advising","was advise","has advising"],"answer":0,"explanation":"Advised correctly completes the past-tense sentence.","wrongReasons":["The other forms are grammatically incorrect here."]},{"id":"g2","difficulty":"easy","text":"If the weather improves tomorrow, we _____ the experiment outside.","choices":["will conduct","conducted","conducting","have conduct"],"answer":0,"explanation":"A first conditional takes will + base verb in the result clause.","wrongReasons":["The other forms do not fit the conditional structure."]},{"id":"g3","difficulty":"medium","text":"The committee was pleased that the recommendations _____ by all departments.","choices":["accepted","were accepted","have accepting","to accept"],"answer":1,"explanation":"The sentence needs the passive form were accepted.","wrongReasons":["A is incomplete.","C and D are ungrammatical here."]},{"id":"g4","difficulty":"medium","text":"Students who arrive late must wait _____ the next break before entering the room.","choices":["until","among","duringly","beside of"],"answer":0,"explanation":"Until correctly marks the time limit.","wrongReasons":["The other options are incorrect or unnatural."]},{"id":"g5","difficulty":"hard","text":"Hardly _____ the lecture started when the fire alarm interrupted it.","choices":["had","has","did","was"],"answer":0,"explanation":"Hardly had + subject + past participle is the correct inversion pattern.","wrongReasons":["The other auxiliaries break the fixed structure."]},{"id":"g6","difficulty":"hard","text":"The article explains not only why the policy failed but also how it might _____ in the future.","choices":["be improved","improved","improving","to improve"],"answer":0,"explanation":"After might, use be improved for passive meaning.","wrongReasons":["The other forms are grammatically incorrect in this structure."]},{"id":"g7","difficulty":"easy","text":"She has been working on the project _____ three months.","choices":["for","since","during","while"],"answer":0,"explanation":"For is used with a period of time when talking about duration.","wrongReasons":["Since is used with a point in time, not a period.","During and while are used differently."]},{"id":"g8","difficulty":"medium","text":"The report, along with its appendices, _____ submitted by noon.","choices":["must be","must","must are","must being"],"answer":0,"explanation":"Along with does not change the singular subject; must be is correct for passive obligation.","wrongReasons":["The other forms are ungrammatical."]},{"id":"g9","difficulty":"hard","text":"Not until the manager reviewed the data _____ the mistake discovered.","choices":["was","were","did","is"],"answer":0,"explanation":"Inverted structure after 'not until': was the mistake discovered.","wrongReasons":["Were is plural and does not match 'the mistake'.","Did requires a different structure.","Is is the wrong tense."]},{"id":"g10","difficulty":"medium","text":"I wish I _____ more time to prepare before the presentation.","choices":["had","have","will have","am having"],"answer":0,"explanation":"After wish, the past simple expresses an unreal present desire.","wrongReasons":["The other tenses do not fit the subjunctive wish structure."]},{"id":"g11","difficulty":"easy","text":"The children _____ to stay inside during the thunderstorm.","choices":["were told","told","are tell","have tell"],"answer":0,"explanation":"Were told is the correct passive past form.","wrongReasons":["The other forms are ungrammatical."]},{"id":"g12","difficulty":"hard","text":"_____ more funding been available, the research could have continued for another year.","choices":["Had","If","Should","Were"],"answer":0,"explanation":"Inverted third conditional: Had + subject = If there had been.","wrongReasons":["If would require 'If more funding had been available'.","Should and Were do not fit this conditional pattern."]}],"wordFormation":[{"id":"wf1","difficulty":"easy","text":"The instructions were so clear that the task was completed with great _____.","baseWord":"easy","answer":"ease","explanation":"With ease is the fixed expression.","wrongReasons":["Other forms do not fit the phrase."]},{"id":"wf2","difficulty":"easy","text":"The scientist explained the process in a very _____ way.","baseWord":"simple","answer":"simple","explanation":"Simple directly modifies way.","wrongReasons":["More complex forms are unnecessary here."]},{"id":"wf3","difficulty":"medium","text":"Her answer showed a deep _____ of the article.","baseWord":"understand","answer":"understanding","explanation":"A noun is needed after deep.","wrongReasons":["The base verb does not fit after the article."]},{"id":"wf4","difficulty":"medium","text":"The company hopes the new system will improve _____ between departments.","baseWord":"communicate","answer":"communication","explanation":"A noun is required as the object of improve.","wrongReasons":["Verb or adjective forms would be incorrect."]},{"id":"wf5","difficulty":"hard","text":"Because of the policy change, many employees felt a sense of _____.","baseWord":"uncertain","answer":"uncertainty","explanation":"A noun is needed after a sense of.","wrongReasons":["The adjective uncertain does not fit grammatically."]},{"id":"wf6","difficulty":"hard","text":"The proposal was rejected because it lacked financial _____.","baseWord":"stable","answer":"stability","explanation":"Stability is the noun form needed here.","wrongReasons":["The adjective stable cannot follow lacked directly."]},{"id":"wf7","difficulty":"easy","text":"The manager praised the team for its _____ in completing the project on time.","baseWord":"efficient","answer":"efficiency","explanation":"Efficiency is the noun form needed after its.","wrongReasons":["The adjective efficient cannot follow the possessive its directly."]},{"id":"wf8","difficulty":"medium","text":"The new software increased the _____ of the sorting process significantly.","baseWord":"accurate","answer":"accuracy","explanation":"Accuracy is the noun form required as the object of increased.","wrongReasons":["The adjective form cannot be the object of a verb here."]},{"id":"wf9","difficulty":"hard","text":"The government introduced measures to reduce the _____ of air pollution in the capital.","baseWord":"severe","answer":"severity","explanation":"Severity is the noun form needed here.","wrongReasons":["Severe is an adjective and cannot function as the object of reduce."]},{"id":"wf10","difficulty":"medium","text":"The students were impressed by the _____ of the professor's explanation.","baseWord":"clear","answer":"clarity","explanation":"Clarity is the noun form needed after the.","wrongReasons":["Clear is an adjective and cannot follow the article directly."]},{"id":"wf11","difficulty":"easy","text":"The children showed great _____ in solving the puzzle.","baseWord":"creative","answer":"creativity","explanation":"Creativity is the noun needed after great.","wrongReasons":["The adjective creative cannot follow great in this noun position."]},{"id":"wf12","difficulty":"hard","text":"The board voted against the merger, citing a lack of financial _____.","baseWord":"transparent","answer":"transparency","explanation":"Transparency is the noun needed after lack of.","wrongReasons":["The adjective form cannot follow lack of."]}],"reading":[{"id":"r1","difficulty":"easy","title":"Why Students Forget After Studying","passage":"Many students believe that spending several hours reading the same notes is the best way to remember information. However, memory researchers have found that passive rereading is often less effective than active recall. In active recall, the learner tries to retrieve information without looking at the notes. This process strengthens memory because it forces the brain to reconstruct the material. Short, repeated retrieval sessions are often more effective than one long study period.","questions":[{"question":"What is the main idea of the passage?","choices":["Passive rereading is usually better than active recall.","Trying to retrieve information can improve memory more than simply rereading notes.","Long study sessions are always more effective than short ones.","Memory researchers do not agree on how students learn."],"answer":1,"explanation":"The passage contrasts rereading with active recall and argues for active recall.","wrongReasons":["The other options contradict or miss the central idea."]},{"question":"Why does active recall strengthen memory?","choices":["Because it requires the learner to reconstruct the material.","Because it removes the need for notes completely.","Because it makes study sessions longer.","Because it reduces the number of topics students study."],"answer":0,"explanation":"The passage explicitly says it forces the brain to reconstruct the material.","wrongReasons":["The other answers are unsupported."]}]},{"id":"r2","difficulty":"medium","title":"The Purpose of Public Parks","passage":"Public parks were once valued mainly as open spaces that offered city residents a break from crowded streets. Today they serve additional roles. Urban planners increasingly view parks as part of a city's environmental infrastructure. Trees reduce heat, plants improve air quality, and open ground can absorb rainwater that might otherwise overwhelm drainage systems. As cities grow denser, parks are therefore being discussed not only as leisure spaces but also as practical tools for public health and climate resilience.","questions":[{"question":"How does the passage describe modern parks?","choices":["As spaces used only for exercise.","As places that are now seen as both recreational and practical.","As expensive projects that should be replaced by parking lots.","As areas designed mainly for tourists."],"answer":1,"explanation":"The passage says parks are now discussed not only as leisure spaces but also as practical tools.","wrongReasons":["The others are too narrow or unsupported."]},{"question":"Why does the author mention rainwater?","choices":["To show that parks can help city infrastructure.","To argue that parks are uncomfortable in winter.","To explain why few people visit parks.","To compare parks with private gardens."],"answer":0,"explanation":"Rainwater absorption is one example of practical value.","wrongReasons":["The other answers do not match the purpose of the example."]}]},{"id":"r3","difficulty":"hard","title":"Why Some Innovations Spread Slowly","passage":"A useful invention does not always spread quickly. Economists note that adoption often depends on more than technical quality. A product may require users to change familiar routines, learn new skills, or trust a system they do not yet understand. In addition, the value of some innovations increases only after many people adopt them. This means early users may see fewer benefits than later users. For that reason, governments and companies sometimes offer incentives during the first stage of adoption.","questions":[{"question":"What is the main point of the passage?","choices":["Technical quality always determines whether an innovation succeeds.","Useful innovations may spread slowly for social and practical reasons, not just technical ones.","Governments should always control new technologies.","Early users gain the greatest benefits from every innovation."],"answer":1,"explanation":"The passage argues that adoption depends on more than technical quality.","wrongReasons":["The other options oversimplify or contradict the text."]},{"question":"Why might early users receive fewer benefits?","choices":["Because early versions never work properly.","Because some innovations become more valuable only when many people use them.","Because early users are less skilled.","Because governments prevent them from using new products."],"answer":1,"explanation":"The passage directly states this reason.","wrongReasons":["The other answers add unsupported claims."]}]},{"id":"r4","difficulty":"easy","title":"The Benefits of Reading Fiction","passage":"Reading fiction is sometimes seen as a leisure activity with little practical value. However, studies suggest it can improve social skills. When readers follow characters through complex situations, they practise understanding different perspectives. Researchers call this ability 'theory of mind' \u2014 the capacity to imagine what others think and feel. People with strong theory of mind tend to communicate more effectively and resolve conflicts more easily. These are skills that transfer directly into professional and academic settings.","questions":[{"question":"What is the main claim of the passage?","choices":["Reading fiction is a waste of time for professionals.","Fiction reading can improve skills that are useful in real-world settings.","Theory of mind is a skill that only scientists need.","Reading fiction is more valuable than studying non-fiction."],"answer":1,"explanation":"The passage argues that fiction reading builds transferable social skills.","wrongReasons":["A contradicts the passage.","C is too narrow.","D is not stated."]},{"question":"What does 'theory of mind' mean in this passage?","choices":["The ability to create fictional characters.","The capacity to understand what others think and feel.","A scientific theory about how the mind works.","The skill of reading quickly and efficiently."],"answer":1,"explanation":"The passage defines it explicitly as 'the capacity to imagine what others think and feel'.","wrongReasons":["The other options are not how the passage defines the term."]}]},{"id":"r5","difficulty":"medium","title":"Ocean Acidification","passage":"The world's oceans absorb roughly a quarter of the carbon dioxide humans release each year. While this reduces the amount of CO2 in the atmosphere, it has a side effect: when CO2 dissolves in seawater, it forms carbonic acid, making the ocean more acidic. Since the industrial era began, ocean acidity has increased by about 26 percent. Many marine organisms, particularly those that build shells or skeletons from calcium carbonate, are sensitive to these changes. As acidity increases, their shells dissolve faster than they can be rebuilt. Scientists warn that continued acidification could threaten entire food webs.","questions":[{"question":"What is the main concern described in the passage?","choices":["That oceans are warming faster than scientists predicted.","That absorbing CO2 is making oceans more acidic, threatening marine life.","That humans release too little CO2 each year.","That carbonic acid will eventually evaporate from the ocean."],"answer":1,"explanation":"The passage describes ocean acidification and its effects on marine organisms.","wrongReasons":["A mentions warming, which is not the topic here.","C reverses the stated fact.","D is not supported."]},{"question":"Which organisms are most at risk according to the passage?","choices":["Large marine predators such as sharks.","Organisms that build shells or skeletons from calcium carbonate.","Microscopic bacteria living on the ocean floor.","Fish that breathe through gills."],"answer":1,"explanation":"The passage explicitly states that shell and skeleton builders are particularly sensitive.","wrongReasons":["The other groups are not mentioned as specifically at risk."]}]},{"id":"r6","difficulty":"hard","title":"The Paradox of Choice","passage":"It might seem that having more options is always better. More choices mean greater freedom to find exactly what you want. However, psychologist Barry Schwartz argues that beyond a certain point, additional options reduce satisfaction rather than increase it. When people choose from a very large set, they are more likely to regret their decision, wondering whether a different option might have been better. They may also feel responsible for a poor outcome in a way that would not arise if the options had been limited. Schwartz calls this 'the paradox of choice': the very abundance of options can leave us worse off.","questions":[{"question":"What is the central argument of the passage?","choices":["More choices always lead to greater personal satisfaction.","Having too many options can reduce satisfaction and increase regret.","Barry Schwartz believes freedom of choice should be restricted by law.","People are incapable of making good decisions."],"answer":1,"explanation":"The passage describes how excessive choice leads to regret and reduced satisfaction.","wrongReasons":["A is the view the passage refutes.","C overstates Schwartz's argument.","D is not stated."]},{"question":"Why might people feel regret after choosing from a large set?","choices":["Because large sets always contain bad options.","Because they wonder whether a different option might have been better.","Because they were not given enough time to decide.","Because the options were not clearly explained."],"answer":1,"explanation":"The passage states this directly: they wonder whether another option would have been better.","wrongReasons":["The other reasons are not given in the passage."]}]},{"id":"r7","difficulty":"easy","title":"How Sleep Affects Learning","passage":"Sleep plays a critical role in memory consolidation. During sleep, the brain replays experiences from the day and transfers them from short-term to long-term memory. Studies show that students who sleep for a full night after studying retain significantly more information than those who stay awake. Even a short nap of twenty to thirty minutes can improve performance on memory tasks. Experts recommend that students prioritise sleep during exam preparation rather than sacrificing rest for additional study time.","questions":[{"question":"What is the main recommendation in the passage?","choices":["Students should reduce the amount of time they spend studying.","Students should prioritise sleep rather than cutting it for extra study time.","Napping for three hours is the best strategy before an exam.","Memory consolidation only occurs during long periods of sleep."],"answer":1,"explanation":"The passage ends with the explicit recommendation to prioritise sleep.","wrongReasons":["A says reduce study time, which is not stated.","C exaggerates the nap duration.","D is contradicted by the mention of short naps."]},{"question":"What happens to memories during sleep?","choices":["The brain erases unimportant memories permanently.","The brain replays experiences and moves them to long-term memory.","The brain creates entirely new memories from random thoughts.","Memories are stored in the short-term memory permanently."],"answer":1,"explanation":"The passage states the brain replays experiences and transfers them to long-term memory.","wrongReasons":["The other options are not supported by the passage."]}]},{"id":"r8","difficulty":"medium","title":"Urban Heat Islands","passage":"Cities are typically warmer than the rural areas surrounding them. This phenomenon, known as the urban heat island effect, occurs because concrete, asphalt, and buildings absorb and retain heat more effectively than vegetation and soil. Reduced airflow between tall structures also prevents cooling. The effect can raise urban temperatures by two to five degrees Celsius compared with nearby countryside. This increases energy consumption for air conditioning, worsens air quality, and has been linked to higher rates of heat-related illness. Urban planners are now using green roofs, tree planting, and reflective surfaces to counteract the effect.","questions":[{"question":"What causes the urban heat island effect?","choices":["Higher levels of air pollution in cities.","Built materials absorbing more heat than natural surfaces, combined with reduced airflow.","Cities being built at lower elevations than rural areas.","More people living in cities producing body heat."],"answer":1,"explanation":"The passage identifies built materials and reduced airflow as the two main causes.","wrongReasons":["A, C, and D are not given as causes in the passage."]},{"question":"Which of the following is mentioned as a solution?","choices":["Reducing the number of buildings in city centres.","Moving populations to rural areas.","Using reflective surfaces and planting trees.","Lowering the speed limit on city roads."],"answer":2,"explanation":"The passage lists green roofs, tree planting, and reflective surfaces as solutions.","wrongReasons":["The other options are not mentioned in the passage."]}]},{"id":"r9","difficulty":"hard","title":"The Limits of Multitasking","passage":"Many people believe they can multitask effectively. Research in cognitive psychology, however, suggests otherwise. What we experience as multitasking is actually rapid task-switching: the brain shifts attention quickly between tasks rather than processing them simultaneously. Each switch carries a cost. The brain takes time to disengage from one task and re-engage with another, a phenomenon researchers call 'switch cost'. Studies show that people who frequently switch tasks make more errors and take longer overall than those who complete tasks sequentially. The perceived productivity of multitasking is largely an illusion.","questions":[{"question":"What does the passage say about multitasking?","choices":["It is an effective strategy for managing a heavy workload.","It is actually rapid switching between tasks, which reduces efficiency.","It works well for simple tasks but not for complex ones.","Research shows it improves performance in most situations."],"answer":1,"explanation":"The passage argues that multitasking is really task-switching, which has a cost.","wrongReasons":["A and D contradict the passage.","C introduces a distinction not made in the passage."]},{"question":"What is 'switch cost' as described in the passage?","choices":["The financial cost of using multiple devices at once.","The time and effort required to shift attention between tasks.","A measurement of how many mistakes a person makes.","The difficulty of returning to a task after a long break."],"answer":1,"explanation":"The passage defines switch cost as the time the brain takes to disengage and re-engage between tasks.","wrongReasons":["The other options do not match the passage's definition."]}]},{"id":"r10","difficulty":"medium","title":"The Role of Mistakes in Learning","passage":"Many educational systems treat mistakes as failures to be avoided. In contrast, researchers in learning science argue that errors are essential to growth. When students make a mistake and then receive corrective feedback, they engage in deeper processing than when they simply read correct information. The struggle to retrieve an answer \u2014 even an incorrect one \u2014 activates more neural pathways than passive study. This principle, known as 'desirable difficulty', suggests that some level of challenge is not just acceptable but necessary for lasting learning.","questions":[{"question":"What is the main idea of the passage?","choices":["Students should avoid making mistakes in order to learn effectively.","Making mistakes, combined with feedback, can strengthen learning.","Desirable difficulty means that lessons should always be very hard.","Corrective feedback is only useful when students already know the material."],"answer":1,"explanation":"The passage argues that errors with feedback lead to deeper processing and better learning.","wrongReasons":["A contradicts the passage.","C overstates the claim.","D is not supported."]},{"question":"What does 'desirable difficulty' mean in this context?","choices":["A teaching style that deliberately confuses students.","The idea that an appropriate level of challenge supports lasting learning.","The tendency to prefer difficult tasks over easy ones.","A grading system that rewards effort rather than accuracy."],"answer":1,"explanation":"The passage defines it as the principle that some challenge is necessary for lasting learning.","wrongReasons":["The other definitions distort the meaning given in the passage."]}]}],"lectureQuestions":[{"id":"l1","difficulty":"medium","type":"lecture","title":"Mini Lecture: Why Cities Build Green Roofs","transcript":"Professor: Green roofs are layers of soil and plants placed on top of buildings. Cities often support them because they absorb rainwater, reduce heat, and improve insulation. Although they cost more to install than conventional roofs, planners often view them as long-term investments that help urban infrastructure.","questions":[{"question":"What is the main purpose of the lecture?","choices":["To explain several practical benefits of green roofs.","To argue that green roofs are cheaper than conventional roofs.","To describe how to grow vegetables indoors.","To criticise cities for supporting green roofs."],"answer":0,"explanation":"The speaker focuses on benefits: rain absorption, heat reduction, and insulation.","wrongReasons":["The other options distort the lecture."]},{"question":"Why does the professor mention cost?","choices":["To show that green roofs are not useful.","To note the main drawback that cities weigh against the benefits.","To explain why insulation is unnecessary.","To suggest that only universities build green roofs."],"answer":1,"explanation":"Cost is presented as the main drawback.","wrongReasons":["The other answers are unsupported."]}]},{"id":"l2","difficulty":"hard","type":"conversation","title":"Campus Conversation: Narrowing a Research Topic","transcript":"Student: My topic still feels too broad. Advisor: Then narrow it. Choose one platform, one age group, and one measurable outcome. A precise question will make your data easier to collect and analyse.","questions":[{"question":"What advice does the advisor give?","choices":["Collect as much data as possible before deciding on a topic.","Choose a smaller, more precise research question.","Change to a topic unrelated to social media.","Avoid using measurable outcomes."],"answer":1,"explanation":"The advisor recommends one platform, one group, and one outcome.","wrongReasons":["The other options contradict the advice."]},{"question":"Why is a precise question helpful?","choices":["It makes the project longer.","It reduces the need to analyse data.","It makes data collection and analysis easier.","It guarantees perfect results."],"answer":2,"explanation":"The advisor explicitly says this.","wrongReasons":["The other choices are unsupported or exaggerated."]}]},{"id":"l3","difficulty":"easy","type":"lecture","title":"Short Lecture: The Value of Study Breaks","transcript":"Speaker: Many students think breaks waste time, but short breaks can improve attention. After twenty or thirty minutes of focused work, a brief pause may help you return to the task with more energy.","questions":[{"question":"What is the speaker's main point?","choices":["Short breaks can improve attention.","Students should avoid working for thirty minutes.","Energy is not important for learning.","Breaks always waste time."],"answer":0,"explanation":"The speaker argues that brief pauses can help attention.","wrongReasons":["The other answers contradict the lecture."]},{"question":"When does the speaker suggest taking a break?","choices":["Before studying begins.","After a period of focused work.","Only at the end of the day.","Whenever a task becomes impossible."],"answer":1,"explanation":"The lecture mentions after twenty or thirty minutes of focused work.","wrongReasons":["The other choices are not stated."]}]},{"id":"l4","difficulty":"medium","type":"lecture","title":"Lecture: The Water Cycle","transcript":"Professor: The water cycle describes how water moves continuously through the environment. Water evaporates from oceans and lakes, rises into the atmosphere, cools to form clouds, and then falls as precipitation. It then flows into rivers or soaks into the ground before eventually returning to the ocean. Human activity, particularly deforestation and urban development, can disrupt parts of this cycle by reducing the ground's ability to absorb water.","questions":[{"question":"What is the main topic of the lecture?","choices":["The negative effects of deforestation on rivers.","How water moves through the environment in a continuous cycle.","The chemical composition of clouds.","Why oceans are important for human survival."],"answer":1,"explanation":"The lecture describes the continuous movement of water through the environment.","wrongReasons":["A and D are too narrow.","C is not the main topic."]},{"question":"How does human activity affect the water cycle according to the professor?","choices":["It speeds up evaporation from oceans.","It increases the amount of precipitation.","It reduces the ground's ability to absorb water.","It creates new rivers in urban areas."],"answer":2,"explanation":"The professor explicitly states that deforestation and urban development reduce ground absorption.","wrongReasons":["The other options are not supported by the lecture."]}]},{"id":"l5","difficulty":"easy","type":"conversation","title":"Office Conversation: Requesting Feedback","transcript":"Employee: I finished the first draft of the report. Should I send it to you now? Manager: Yes, please send it by end of day. I'll review it tonight and give you notes tomorrow morning so you can revise before the client meeting on Thursday.","questions":[{"question":"What does the manager plan to do?","choices":["Send the report directly to the client.","Review the draft and provide feedback the next morning.","Revise the report himself before Thursday.","Ask the employee to present the report without changes."],"answer":1,"explanation":"The manager says he will review it tonight and give notes tomorrow morning.","wrongReasons":["The other options are not consistent with the conversation."]},{"question":"When is the client meeting?","choices":["Tonight.","Tomorrow morning.","Thursday.","End of day."],"answer":2,"explanation":"The manager explicitly mentions the client meeting on Thursday.","wrongReasons":["The other times refer to other events in the conversation."]}]},{"id":"l6","difficulty":"hard","type":"lecture","title":"Lecture: The Ethics of Artificial Intelligence","transcript":"Professor: As AI systems take on more decision-making roles, questions of ethics become central. Who is responsible when an algorithm causes harm \u2014 the developer, the company, or the user? Traditional legal frameworks were not designed with autonomous systems in mind. Some researchers argue for a new category of legal personhood for AI, while others insist that accountability must remain with humans. The debate is far from settled, and regulators in many countries are still developing frameworks to address it.","questions":[{"question":"What is the central issue raised in the lecture?","choices":["Whether AI systems are more intelligent than humans.","Who bears responsibility when an AI system causes harm.","How to program ethics into artificial intelligence.","Why traditional legal systems are more effective than new ones."],"answer":1,"explanation":"The lecture centres on the question of accountability when AI causes harm.","wrongReasons":["A and C are not the central issue.","D is not a claim the lecture makes."]},{"question":"What do some researchers propose regarding AI accountability?","choices":["That AI developers should be banned from creating autonomous systems.","That a new legal category of personhood should be created for AI.","That users should always be held responsible for AI decisions.","That existing laws are sufficient to handle AI accountability."],"answer":1,"explanation":"The professor mentions researchers who argue for a new category of legal personhood for AI.","wrongReasons":["A is not proposed in the lecture.","C and D represent opposing positions."]}]},{"id":"l7","difficulty":"medium","type":"conversation","title":"Campus Conversation: Choosing Between Two Job Offers","transcript":"Student: I have two job offers. The first pays more, but the second has better growth opportunities. Friend: Think about where you want to be in five years, not just next month. Higher pay now does not always mean a better career later. A role with mentoring and clear advancement paths can be worth more in the long run.","questions":[{"question":"What is the friend's main advice?","choices":["Always choose the job with the higher salary.","Consider long-term career development, not just immediate pay.","Reject both offers and look for better options.","Ask both companies to increase their salary offers."],"answer":1,"explanation":"The friend advises thinking about where you want to be in five years, not just immediate pay.","wrongReasons":["A contradicts the advice.","C and D are not suggested."]},{"question":"What does the friend suggest about roles with mentoring and advancement?","choices":["They are only suitable for students without experience.","They can be more valuable than a higher salary in the long term.","They are typically offered by smaller companies.","They require more years of experience to qualify."],"answer":1,"explanation":"The friend says such roles 'can be worth more in the long run'.","wrongReasons":["The other options add information not given in the conversation."]}]},{"id":"l8","difficulty":"easy","type":"lecture","title":"Lecture: Why We Yawn","transcript":"Speaker: You might think yawning is a sign of tiredness or boredom. While that is partly true, research suggests yawning also helps regulate brain temperature. When we yawn, we inhale a large amount of cool air, which may help cool the brain and keep it alert. This could explain why people yawn when transitioning between sleep and wakefulness, when the brain needs to shift into a higher state of alertness.","questions":[{"question":"What does recent research suggest about yawning?","choices":["It is only a sign of tiredness.","It may help regulate the temperature of the brain.","It is caused by a lack of oxygen in the blood.","It is a social behaviour that humans learned from animals."],"answer":1,"explanation":"The speaker says research suggests yawning helps regulate brain temperature.","wrongReasons":["A is too narrow.","C and D are not mentioned."]},{"question":"Why might people yawn when waking up, according to the lecture?","choices":["Because they did not sleep enough.","Because the brain needs to cool down before sleep.","Because the brain needs to shift into a higher state of alertness.","Because yawning is a reflex that occurs at regular intervals."],"answer":2,"explanation":"The speaker says this could explain why yawning occurs during the transition to wakefulness.","wrongReasons":["A and D are not supported.","B reverses the direction of alertness."]}]},{"id":"l9","difficulty":"hard","type":"lecture","title":"Lecture: The Columbian Exchange","transcript":"Professor: The Columbian Exchange refers to the widespread transfer of plants, animals, diseases, and ideas between the Americas and the Old World following Columbus's 1492 voyage. It had profound effects on both sides. Europeans brought diseases to which indigenous Americans had no immunity, causing population collapse. In return, crops such as potatoes, tomatoes, and maize transformed European diets and contributed to population growth. Historians debate whether the exchange's overall impact was positive or negative, as its consequences were deeply uneven.","questions":[{"question":"What was the Columbian Exchange?","choices":["A trade agreement between Spain and Portugal in the 15th century.","The transfer of plants, animals, diseases, and ideas between the Americas and the Old World.","A programme to exchange students between European and American universities.","A series of military conflicts following Columbus's voyage."],"answer":1,"explanation":"The professor defines it explicitly at the start of the lecture.","wrongReasons":["The other options distort or replace the definition given."]},{"question":"Why do historians debate the exchange's overall impact?","choices":["Because the records from 1492 are unreliable.","Because the consequences were deeply uneven, with both devastating and beneficial effects.","Because there is no evidence that crops actually changed European diets.","Because Columbus himself argued that the exchange was harmful."],"answer":1,"explanation":"The professor says historians debate because the consequences were deeply uneven.","wrongReasons":["The other options are not supported by the lecture."]}]},{"id":"l10","difficulty":"medium","type":"conversation","title":"Library Conversation: Finding Academic Sources","transcript":"Student: I can not find enough academic sources for my paper. Librarian: Start with Google Scholar and filter by date \u2014 you only want sources from the last ten years. Use the 'cited by' feature to find related papers. If you cannot access a full article, check the library database; most journals are available there. Avoid websites that are not peer-reviewed.","questions":[{"question":"What is the librarian's first recommendation?","choices":["Check the library's physical shelves for printed journals.","Use Google Scholar and filter results by date.","Contact the journal directly to request an article.","Use a general search engine and select the most popular results."],"answer":1,"explanation":"The librarian's first piece of advice is to use Google Scholar with a date filter.","wrongReasons":["The other options are not the librarian's first recommendation."]},{"question":"What should the student do if a full article is not accessible?","choices":["Skip that source and find a different one.","Email the article's author directly.","Check the library database, where most journals are available.","Download the article from an unofficial website."],"answer":2,"explanation":"The librarian says to check the library database if a full article is not available.","wrongReasons":["The other options are not suggested by the librarian."]}]},{"id":"l11","difficulty":"easy","type":"lecture","title":"Lecture: How Vaccines Work","transcript":"Speaker: A vaccine works by training the immune system to recognise and fight a specific pathogen without causing the disease itself. It introduces a harmless version of the pathogen \u2014 or just a fragment of it \u2014 into the body. The immune system responds by producing antibodies. If the person later encounters the real pathogen, the immune system can respond quickly and prevent serious illness. This is why widespread vaccination can reduce the spread of disease through a population.","questions":[{"question":"How does a vaccine train the immune system?","choices":["By introducing the full, active form of a disease-causing pathogen.","By introducing a harmless version or fragment of a pathogen so antibodies can form.","By providing antibodies directly from another person's immune system.","By removing dangerous cells from the bloodstream."],"answer":1,"explanation":"The speaker describes a harmless version or fragment that prompts antibody production.","wrongReasons":["A describes how infection works, not vaccination.","C and D are not how vaccines work."]},{"question":"What happens if a vaccinated person later encounters the real pathogen?","choices":["The vaccine destroys the pathogen before it enters the body.","The person will always be completely immune.","The immune system can respond quickly to prevent serious illness.","The body produces a new vaccine automatically."],"answer":2,"explanation":"The speaker says the immune system can respond quickly and prevent serious illness.","wrongReasons":["A is not how the immune system works.","B says 'always', which is too absolute.","D is not stated."]}]},{"id":"l12","difficulty":"hard","type":"conversation","title":"Tutorial Conversation: Understanding Confirmation Bias","transcript":"Tutor: Your essay mentions confirmation bias, but I do not think you have fully explained it. Student: I said it means people only look for information that supports their existing view. Tutor: That is partly right, but it also includes how we interpret ambiguous evidence. We tend to read neutral information as confirmation of what we already believe. It is not just about ignoring contradictory sources \u2014 it is also about distorting what we see.","questions":[{"question":"What does the tutor say is missing from the student's explanation?","choices":["That confirmation bias only affects scientists.","That confirmation bias also includes distorting the interpretation of ambiguous evidence.","That people with confirmation bias always reject new information.","That confirmation bias is a recent discovery in psychology."],"answer":1,"explanation":"The tutor adds that people also distort neutral information to fit existing beliefs.","wrongReasons":["The other options are not what the tutor says is missing."]},{"question":"According to the tutor, what happens with ambiguous evidence?","choices":["People tend to ignore it completely.","People tend to interpret it as supporting what they already believe.","People become more open-minded after seeing it.","People ask others to interpret it for them."],"answer":1,"explanation":"The tutor says people read neutral information as confirmation of existing beliefs.","wrongReasons":["The other options are not supported by the conversation."]}]}],"textCompletion":[{"id":"tc1","difficulty":"easy","title":"Study Habits","passage":"Students often assume that longer study sessions are always more productive. Research suggests otherwise. Short sessions with active recall and regular breaks are often more effective because they reduce mental ___.","choices":["fatigue","arrival","permission","landscape"],"answer":0,"explanation":"Mental fatigue is the natural collocation.","wrongReasons":["The other words do not fit the context."]},{"id":"tc2","difficulty":"medium","title":"Museum Audio Guides","passage":"Many museums now provide digital audio guides. Good guides add useful information without distracting visitors from the objects themselves. For that reason, the most effective guides are brief, clear, and ___ rather than overwhelming.","choices":["selective","fragile","permanent","identical"],"answer":0,"explanation":"Selective matches the idea of brief, focused guidance.","wrongReasons":["The other options do not fit the logic."]},{"id":"tc3","difficulty":"hard","title":"Urban Farming","passage":"Urban farming is not intended to ___ traditional agriculture but to complement it with educational and community benefits.","choices":["replace","delay","observe","import"],"answer":0,"explanation":"The sentence contrasts replacement with complementing.","wrongReasons":["The other options do not fit the contrast."]},{"id":"tc4","difficulty":"hard","title":"Workplace Training","passage":"The company introduced short weekly workshops because a single long seminar was not enough to ___ new employees with the practical skills they needed.","choices":["equip","hesitate","translate","postpone"],"answer":0,"explanation":"Equip with skills is the correct collocation.","wrongReasons":["The other options do not match the meaning."]},{"id":"tc5","difficulty":"easy","title":"Public Libraries","passage":"Public libraries have adapted to changing habits. In addition to books, many now offer digital resources, co-working spaces, and community events. Their goal remains the same: to provide ___ access to information and learning for everyone.","choices":["free","expensive","limited","private"],"answer":0,"explanation":"Free access to information is the defining feature of public libraries.","wrongReasons":["Expensive and limited contradict the public-service model.","Private contradicts the word public."]},{"id":"tc6","difficulty":"medium","title":"Social Media and Attention","passage":"Social media platforms are designed to keep users engaged for as long as possible. Notifications, infinite scrolling, and personalised content all serve to ___ the user's attention and discourage them from leaving the platform.","choices":["capture","restore","reduce","block"],"answer":0,"explanation":"Capture attention fits the idea of keeping users engaged.","wrongReasons":["Restore and reduce do not match the meaning.","Block is the opposite of the intended effect."]},{"id":"tc7","difficulty":"hard","title":"Scientific Peer Review","passage":"Before a scientific study is published in an academic journal, it must pass through a process known as peer review. Independent experts in the field ___ the methodology, results, and conclusions to ensure the research meets the standards of the discipline.","choices":["evaluate","ignore","copy","celebrate"],"answer":0,"explanation":"Evaluate is the correct academic term for assessing research quality.","wrongReasons":["Ignore is the opposite of peer review.","Copy and celebrate do not fit the academic context."]},{"id":"tc8","difficulty":"easy","title":"Language Learning","passage":"Learning a second language is most effective when the learner is regularly ___ to the language in meaningful contexts, such as through conversation, reading, or listening to native speakers.","choices":["exposed","opposed","closed","limited"],"answer":0,"explanation":"Exposed to the language is the standard collocation in language learning research.","wrongReasons":["Opposed means resistant.","Closed and limited have different meanings that do not fit."]},{"id":"tc9","difficulty":"medium","title":"Recycling Challenges","passage":"Although recycling is widely promoted, its effectiveness depends on how well people ___ the guidelines. When contaminated materials are placed in recycling bins, entire batches may need to be sent to landfill instead.","choices":["follow","create","ignore","design"],"answer":0,"explanation":"Follow the guidelines is the natural collocation.","wrongReasons":["Create and design do not fit the context.","Ignore is the opposite of what is needed for effective recycling."]},{"id":"tc10","difficulty":"hard","title":"Cognitive Load in Education","passage":"When students are asked to process too much new information at once, their working memory becomes overwhelmed. This ___ learning because the brain cannot effectively encode new material when its processing capacity is exceeded.","choices":["hinders","supports","accelerates","clarifies"],"answer":0,"explanation":"Hinders learning is consistent with the idea that overload impairs memory encoding.","wrongReasons":["Supports and accelerates are the opposite of what is described.","Clarifies does not fit the causal relationship."]}]};
window.__AMIRNET_FALLBACK_VOCAB__ = [{"id":"v1","word":"allocate","definition":"to distribute for a purpose","example":"Universities allocate funds to strong projects.","difficulty":"hard","choices":["distribute","ignore","copy","reduce"],"answer":0},{"id":"v2","word":"assume","definition":"to accept as true without proof","example":"Do not assume the first answer is correct.","difficulty":"easy","choices":["predict","suppose","forbid","withdraw"],"answer":1},{"id":"v3","word":"benefit","definition":"an advantage or positive effect","example":"Regular review has a clear benefit for memory.","difficulty":"easy","choices":["penalty","advantage","argument","delay"],"answer":1},{"id":"v4","word":"comprehensive","definition":"complete and thorough","example":"The report offers a comprehensive analysis of the issue.","difficulty":"hard","choices":["brief","thorough","fragile","casual"],"answer":1},{"id":"v5","word":"decline","definition":"to decrease","example":"Error rates often decline after focused practice.","difficulty":"easy","choices":["decrease","announce","borrow","expand"],"answer":0},{"id":"v6","word":"efficient","definition":"achieving results with little waste","example":"A short routine can be more efficient than a long unfocused one.","difficulty":"medium","choices":["wasteful","effective","silent","unclear"],"answer":1},{"id":"v7","word":"evidence","definition":"information that supports a claim","example":"Choose the answer supported by the evidence.","difficulty":"medium","choices":["prediction","proof","ceremony","permission"],"answer":1},{"id":"v8","word":"factor","definition":"something that influences a result","example":"Time pressure is one factor in exam performance.","difficulty":"medium","choices":["result","influence","device","punishment"],"answer":1},{"id":"v9","word":"justify","definition":"to provide a good reason","example":"Your choice should be easy to justify from the sentence.","difficulty":"hard","choices":["forget","explain","observe","delay"],"answer":1},{"id":"v10","word":"maintain","definition":"to keep at the same level","example":"Try to maintain your reading speed under pressure.","difficulty":"medium","choices":["keep","reject","invite","decorate"],"answer":0},{"id":"v11","word":"precise","definition":"exact and clear","example":"A precise question is easier to answer.","difficulty":"medium","choices":["exact","decorative","temporary","vague"],"answer":0},{"id":"v12","word":"reliable","definition":"able to be trusted","example":"Use reliable clues, not random guesses.","difficulty":"medium","choices":["trustworthy","expensive","narrow","fragile"],"answer":0},{"id":"v13","word":"significant","definition":"important or large enough to matter","example":"Vocabulary has a significant effect on Amirnet results.","difficulty":"hard","choices":["minor","important","hidden","temporary"],"answer":1},{"id":"v14","word":"strategy","definition":"a plan for reaching a goal","example":"Good elimination is a useful test strategy.","difficulty":"easy","choices":["plan","mistake","resource","warning"],"answer":0},{"id":"v15","word":"sufficient","definition":"enough for a purpose","example":"One clue is not always sufficient to choose correctly.","difficulty":"hard","choices":["enough","dangerous","temporary","mysterious"],"answer":0},{"id":"v16","word":"sustain","definition":"to continue over time","example":"It is easier to sustain focus in short blocks.","difficulty":"hard","choices":["continue","interrupt","invent","refuse"],"answer":0},{"id":"v17","word":"temporary","definition":"lasting for a limited time","example":"Stress before the test is often temporary.","difficulty":"easy","choices":["brief","permanent","useful","social"],"answer":0},{"id":"v18","word":"vague","definition":"not clear enough","example":"Eliminate vague choices that do not fit the sentence.","difficulty":"medium","choices":["unclear","exact","careful","expensive"],"answer":0},{"id":"v19","word":"valid","definition":"logically acceptable or well founded","example":"The best answer must be valid in context.","difficulty":"medium","choices":["acceptable","rare","silent","careless"],"answer":0},{"id":"v20","word":"withstand","definition":"to remain strong under pressure","example":"The best strategy must withstand time pressure.","difficulty":"hard","choices":["collapse under","endure","announce","copy"],"answer":1}];
