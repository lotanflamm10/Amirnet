export interface Translations {
  nav: {
    dashboard: string;
    practice: string;
    simulation: string;
    vocab: string;
    review: string;
    challenge: string;
    pricing: string;
    account: string;
    admin: string;
    learningEngine: string;
  };
  home: {
    tagline: string;
    hero: string;
    heroSub: string;
    startFree: string;
    runSim: string;
    disclaimer: string;
    /** Marketing features */
    featSmartPractice: string;
    featSmartPracticeDesc: string;
    featSimulations: string;
    featSimulationsDesc: string;
    featVocab: string;
    featVocabDesc: string;
    featChallenge: string;
    featChallengeDesc: string;
    featReview: string;
    featReviewDesc: string;
    featDashboard: string;
    featDashboardDesc: string;
    examStructure: string;
    examSection1: string; examSection1Time: string;
    examSection2: string; examSection2Time: string;
    examSection3: string; examSection3Time: string;
    examSection4: string; examSection4Time: string;
    examSection5: string; examSection5Time: string;
    examSection6: string; examSection6Time: string;
  };
  practice: {
    title: string;
    subtitle: string;
    pickMode: string;
    startSession: string;
    question: string;
    of: string;
    submit: string;
    next: string;
    correct: string;
    incorrect: string;
    sessionDone: string;
    accuracy: string;
    timeUsed: string;
    reviewMistakes: string;
    practiceAgain: string;
    difficulty: string;
    mixed: string;
    easy: string;
    medium: string;
    hard: string;
    readingPassageSubtitle: string;
    standardSessionSubtitle: string;
    writingSessionSubtitle: string;
    /** Section labels */
    sectionMainCategories: string;
    sectionSkillBoosters: string;
    sectionSkillBoostersSubtitle: string;
    sectionSkillBoostersIntro: string;
    sectionPilot: string;
    pilotSubtitle: string;
    pilotInfo: string;
    badgePilot: string;
    badgeRecommended: string;
    badgeNew: string;
    /** Difficulty descriptions */
    difficultyAdaptiveDesc: string;
    difficultyEasyDesc: string;
    difficultyMediumDesc: string;
    difficultyHardDesc: string;
    difficultyLockNotice: string;
    /** Buttons & helpers */
    start: string;
    practiceVerb: string;
    questionsUnit: string;
    questionsCount: string; // for "{n} questions"
    correctOfTotal: string; // for "Correct / Total"
    finishSession: string;
    nextArrow: string;
    submitAnswer: string;
    incorrectLabel: string;
    skillBoosterTag: string;
    hebrewExplanation: string;
    keyWords: string;
    practiceSimilar: string;
    correctRandom1: string;
    correctRandom2: string;
    correctRandom3: string;
    correctRandom4: string;
    noQuestionsAvailable: string;
    /** Writing mode */
    writingNeedMoreWords: string; // "{n} more words needed"
    /** Lecture mode */
    playLecture: string;
    stopLecture: string;
    showTranscript: string;
    hideTranscript: string;
    transcriptHidden: string;
    audioUnsupported: string;
    /** Reading hint inside passage */
    readingHint: string;
  };
  account: {
    pageTitle: string;
    planLabelGuest: string;
    planLabelFree: string;
    planLabelPro: string;
    planLabelLifetime: string;
    planLabelAdmin: string;
    guestName: string;
    guestSub: string;
    upgradePlan: string;
    statsQuestions: string;
    statsAccuracy: string;
    statsStreak: string;
    statsStreakSuffix: string;
    entitlements: string;
    entPractice: string;
    entSimulation: string;
    entSmartReview: string;
    entAnalytics: string;
    entVocabImport: string;
    appearance: string;
    appearanceModeDark: string;
    appearanceModeLight: string;
    appearanceModeSystem: string;
    appearanceSwitch: string;
    appearancePrimaryColor: string;
    appearanceReset: string;
    appearanceCustomColor: string;
    dataTitle: string;
    exportProgress: string;
    importProgress: string;
    importSuccess: string;
    importError: string;
    resetAll: string;
    resetConfirm: string;
    devModeSwitcher: string;
    dataDisclaimer: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    mostPopular: string;
    comingSoon: string;
    free: string;
    perMonth: string;
    oneTime: string;
    activated: string;
    activate: string;
    devMode: string;
    disclaimer: string;
    /** Plan display names */
    planFree: string;
    planProMonthly: string;
    planPro3Month: string;
    planSimPack: string;
    planCredits: string;
    /** Plan features */
    featUnlimitedPractice: string;
    feat2SimsPerMonth: string;
    featBasicVocab: string;
    featProgressTracking: string;
    featEverythingInFree: string;
    featUnlimitedSimulations: string;
    featFullVocab: string;
    featSmartReviewQueue: string;
    featWeaknessAnalysis: string;
    featProgressExportImport: string;
    featEverythingInPro: string;
    feat19PercentSavings: string;
    feat3Simulations: string;
    featOneTimePayment: string;
    featValid60Days: string;
    featComingSoon: string;
    featFlexibleCredits: string;
  };
  learningEngine: {
    pageTitle: string;
    pageDescription: string;
    showExample: string;
    hideExample: string;
    addBookmark: string;
    removeBookmark: string;
    markUnderstood: string;
    markNotUnderstood: string;
    understood: string;
    gotIt: string;
    prevTip: string;
    nextTip: string;
    tipsAria: string;
    tipAria: string;
  };
  diagnostic: {
    introTitle: string;
    introSubtitle: string;
    badge15Questions: string;
    badge8Minutes: string;
    badgeNoTimePressure: string;
    badgeInstant: string;
    startCta: string;
    introDisclaimer: string;
    questionOf: string; // "Question {n} of 15"
    estimatedScore: string;
    estimatedScoreUnofficial: string;
    overallAccuracy: string;
    categoryBreakdown: string;
    yourStrongest: string;
    needsImprovement: string;
    continueCta: string;
  };
  scoreBand: {
    exemption: string;
    intermediate: string;
    basic: string;
    needsWork: string;
  };
  practiceSummary: {
    estimatedScore: string;
    outOf150: string;
    accuracy: string;
    correctTotal: string;
    time: string;
    accuracyPercent: string;
    practiceAgain: string;
    reviewMistakes: string;
    dashboard: string;
    unofficialFooter: string;
    motivExcellent: string;
    motivGood: string;
    motivOk: string;
    motivWeak: string;
  };
  vocab: {
    title: string;
    flip: string;
    knew: string;
    didntKnow: string;
    star: string;
    shuffle: string;
    new: string;
    learning: string;
    strong: string;
    mastered: string;
    dueToday: string;
    swipeRight: string;
    swipeLeft: string;
    vocabDisclaimer: string;
    trainerTitle: string;
    trainerSubtitle: string;
    pendingTotal: string;
    todaysWords: string;
    addCard: string;
    pickActivity: string;
    skillBoostersHeading: string;
    skillBoosters: string;
    unknownTitle: string;
    unknownSubtitle: string;
    /** Swipe trainer runtime */
    sessionDoneTitle: string;
    sessionMessageExcellent: string;
    sessionMessageGood: string;
    sessionMessageOk: string;
    sessionMessageDefault: string;
    statKnew: string;
    statMissed: string;
    statAccuracy: string;
    statMastered: string;
    missedThisRound: string;
    practiceMissedCta: string;
    retryMissedTitle: string; // hero CTA shown when user has missed words this session
    sessionMissedSummary: string; // "You missed {n} words in this session"
    newRound: string;
    allMissedLink: string;
    unknownBankCta: string; // secondary link to the global unknown-words bank
    retryRoundLabel: string; // small badge shown while in a retry round
    emptyFilterTitle: string;
    emptyFilterSubtitle: string;
    clearFilter: string;
    loading: string;
    keyboardHint: string;
    swipeKnown: string;
    swipeReview: string;
    /** Card */
    tapToReveal: string;
    trap: string;
    addStar: string;
    removeStar: string;
    playAudio: string;
    playingAudio: string;
    back: string;
    flipCard: string;
    /** Missed list */
    missedEmptyTitle: string;
    missedEmptySub: string;
    missedStartPractice: string;
    missedSummaryMissed: string;
    missedSummaryMastered: string;
    missedPracticeAll: string;
    missedSearchPlaceholder: string;
    missedCountSuffix: string;
    missedTimes: string;
    knownTimes: string;
    markKnown: string;
    /** Reverted-back card prev label */
    goBackCard: string;
    /** Filter pills */
    diffAll: string;
    diffEasy: string;
    diffMedium: string;
    diffHard: string;
    /** VocabList */
    listShowingOfTotal: string; // "Showing 200 of {n}. Narrow your search."
    /** Vocab sub-page titles + helpers */
    starredPageTitle: string;
    starredPageSubtitle: string;
    missedPageTitle: string;
    missedPageSubtitle: string;
    weakPageTitle: string;
    weakPageSubtitle: string;
    customPageTitle: string;
    customPageSubtitle: string;
    backToVocab: string;
    /** Custom vocab page */
    customTabBulk: string;
    customTabCard: string;
    customTabMy: string;
    customWordRequired: string;
    customFormatHint: string;
    customBulkLineFormat: string;
    customReadyCount: string;
    customSkippedCount: string;
    customWriteHere: string;
    customPreview: string;
    customMore: string;
    customAddNew: string;
    customWordLabel: string;
    customTranslationLabel: string;
    customTypeLabel: string;
    customTypePickPlaceholder: string;
    customDifficultyLabel: string;
    customExampleLabel: string;
    customNotesLabel: string;
    customNotesPlaceholder: string;
    customCardAdded: string;
    customAddCardCta: string;
    customNoCardsYet: string;
    customAddFirstCard: string;
    customDeleteCard: string;
    customStartPractice: string;
    customWordsCount: string;
    customClearImport: string;
    customTranslationPlaceholder: string;
    customSelectPlaceholder: string;
    /** Custom vocab session */
    customNoWords: string;
    customBackToList: string;
    customRoundDone: string;
    customMissedSummary: string;
    customNewRound: string;
    customLoading: string;
    customKeyboardHint: string;
    statusDefault: string;
    statusMissed: string;
    statusDue: string;
    statusNew: string;
    statusStarred: string;
    statusWeak: string;
    statusMastered: string;
  };
  simulation: {
    title: string;
    standard: string;
    withPilot: string;
    quick: string;
    pilotOnly: string;
    section: string;
    timeLeft: string;
    pilotWarning: string;
    score: string;
    unofficial: string;
    exemption: string;
    breakdown: string;
    /** Picker page */
    subtitle: string;
    modeStandardLabel: string;
    modeStandardDesc: string;
    modeWritingLabel: string;
    modeWritingDesc: string;
    modePilotLabel: string;
    modePilotDesc: string;
    modeQuickLabel: string;
    modeQuickDesc: string;
    modePilotOnlyLabel: string;
    modePilotOnlyDesc: string;
    badgeRecommended: string;
    badgeExperimental: string;
    unitMinutes: string; // "min"
    unitSections: string; // "sections"
    startSimulation: string; // hero CTA
    disclaimerCard: string;
    backToList: string;
    /** Runner */
    sectionLabelN: string; // "Section {n}/{total}"
    pilotTag: string;
    questionsAnswered: string; // "{a}/{b} answered"
    btnPrev: string;
    btnNext: string;
    btnNextSection: string;
    btnFinishSimulation: string;
    loadingQuestions: string;
    /** Section type labels (used to localize seed JSON labels) */
    sectionTypeSentenceCompletion: string;
    sectionTypeRestatements: string;
    sectionTypeReading: string;
    sectionTypeLectureQuestions: string;
    sectionTypeTextCompletion: string;
    sectionTypeWordFormation: string;
    sectionTypeGrammar: string;
    sectionTypeWritingTask: string;
    sectionOrdinalSuffix: string; // "" for EN, " {n}" for HE (uses Hebrew letters)
    /** SectionTransition */
    transitionEyebrow: string; // "Section {n}"
    transitionTime: string; // "{m} minutes · Starting in {n}…"
    transitionCta: string; // "Start now →"
    /** PilotSectionIntro */
    pilotIntroHeading: string;
    pilotIntroBody: string;
    pilotIntroContinue: string;
    /** SimulationReview */
    reviewTitle: string;
    reviewBackToResults: string;
    reviewQuestionOf: string; // "Question {n} of {total}"
    reviewUnanswered: string;
    reviewCorrect: string;
    reviewWrong: string;
    reviewExplanation: string;
    reviewYourAnswer: string;
    reviewCorrectMark: string;
    /** SimulationSummary */
    summaryComplete: string;
    summaryDisclaimer: string;
    summaryBreakdownTitle: string;
    summaryPilot: string;
    summaryReviewBtn: string;
    summaryPracticeWeaknesses: string;
    summaryNewSimulation: string;
    summaryDashboard: string;
  };
  writingTask: {
    topicHeading: string;
    instructionsTitle: string;
    instructionsBody: string;
    rubricLabel: string;
    rubricContentOrg: string;
    rubricVocabulary: string;
    rubricGrammar: string;
    rubricCoherence: string;
    rubricTaskRelevance: string;
    templateToggleShow: string;
    templateToggleHide: string;
    templateHeading: string;
    templateInsert: string;
    placeholderTextarea: string;
    wordsLabel: string;
    wordsMoreNeeded: string;
    wordsOver: string;
    wordsRange: string;
    timeoutMessage: string;
  };
  sidebar: {
    colorLabel: string;
    bgLabel: string;
    reset: string;
    themeDark: string;
    themeLight: string;
    themeSystem: string;
  };
  review: {
    title: string;
    subtitle: string;
    noDataTitle: string;
    noDataBody: string;
    noDataCta: string;
    perfectTitle: string;
    perfectBody: string;
    perfectCta: string;
    categoriesTitle: string;
    categoriesBadgeTopics: string;
    weakVocabTitle: string;
    practiceLink: string;
    correctLabel: string;
    averagePerQuestion: string; // "avg {n}s per question"
    seeAllWeakWords: string;
    practiceNow: string;
    wordTrainer: string;
  };
  dashboard: {
    greeting: string;
    goalProgress: string;
    streak: string;
    weakAreas: string;
    vocabDue: string;
    recommended: string;
    noData: string;
    todaysTraining: string;
    itemsLabel: string;
    progress: string;
    actions: string;
    startToday: string;
    /** Daily plan items */
    planVocabToday: string;
    planReadingPassage: string;
    planMixed: string;
    planReasonVocabPending: string; // "{n} pending in total"
    planReasonVocabBuild: string;
    planReasonReading: string;
    planReasonWeak: string; // "{n}% accuracy — needs work"
    planReasonBooster: string; // "Skill booster — weak in {cat}"
    planReasonMixedFirst: string;
    planReasonMixedKeepLevel: string;
    planBoosterVocabInContext: string;
    planBoosterRestatementMini: string;
    planBoosterConnectors: string;
    planBoosterSynonym: string;
    planBoosterAcademicPhrase: string;
    planBoosterSentenceLogic: string;
    /** unit for vocab/questions counter on plan rows */
    unitWords: string;
    unitQuestions: string;
    /** DashboardStats cells */
    statsDailyGoal: string;
    statsGoalReached: string;
    statsRemainingPct: string;
    statsDayStreak: string;
    statsDaysInRow: string;
    statsEstScore: string;
    statsOutOf150: string;
    statsAccuracy: string;
    statsQuestionsUnit: string;
    statsTotalQuestions: string;
    statsCorrectUnit: string;
    /** XP level names */
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
    level6: string;
    level7: string;
    level8: string;
    /** WeakAreas */
    weakEmptyLineA: string;
    weakEmptyLineB: string;
    weakStartPracticing: string;
    weakSeeAll: string;
    weakPracticeLink: string;
    weakCorrectOf: string;
    /** Category labels (used by WeakAreas + daily plan) */
    catSentenceCompletion: string;
    catRestatements: string;
    catReading: string;
    catGrammar: string;
    catWordFormation: string;
    catTextCompletion: string;
    catLectureQuestions: string;
    catVocabulary: string;
    catMixed: string;
    /** XP */
    level: string;
    daysStreak: string;
    /** Readiness */
    readinessHeading: string;
    readinessMessageVeryHigh: string;
    readinessMessageHigh: string;
    readinessMessageMid: string;
    readinessMessageLow: string;
    readinessMessageVeryLow: string;
    readinessEstimatedScore: string;
    readinessUnofficial: string;
    readinessTarget: string;
    readinessFocusAreas: string;
    readinessNoData: string;
    readinessNoDataSub: string;
    readinessPlacementBtn: string;
  };
  unknownWords: {
    filterAll: string;
    filterUnknown: string;
    filterKnown: string;
    empty: string;
    source: string;
    markKnown: string;
    markUnknown: string;
    remove: string;
    sourceReading: string;
    sourceVocab: string;
    sourcePractice: string;
    sourceAcademicPhrase: string;
    sourceManual: string;
  };
  selectionPopup: {
    addToUnknown: string;
    saved: string;
    markKnown: string;
    close: string;
    fallback: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    close: string;
    settings: string;
    darkMode: string;
    lightMode: string;
    hebrew: string;
    english: string;
    back: string;
    start: string;
    finish: string;
    empty: string;
  };
}

export const he: Translations = {
  nav: { dashboard: "לוח בקרה", practice: "תרגול", simulation: "הדמיה", vocab: "מילים", review: "סקירה", challenge: "אתגר", pricing: "תמחור", account: "חשבון", admin: "ניהול", learningEngine: "מנוע למידה" },
  home: {
    tagline: "המאמן האישי שלך לאמירנט",
    hero: "תתאמן באנגלית ברמת אמירנט עם כלים חכמים",
    heroSub: "מילון חכם, דרילים, הדמיות מלאות וניתוח ביצועים. לא קשור לנית.",
    startFree: "התחל חינם",
    runSim: "הדמיה מלאה",
    disclaimer: "כלי הכנה עצמאי לאמירנט. לא קשור לנית. ציונים, הדמיות ותחזיות הם לא רשמיים.",
    featSmartPractice: "תרגול חכם",
    featSmartPracticeDesc: "השלמת משפטים, ניסוח מחדש, דקדוק וצורות מילים — מותאם לרמתך.",
    featSimulations: "הדמיות בזמן אמת",
    featSimulationsDesc: "הדמיות אמירנט מלאות עם תזמון אמיתי וניתוח לפי סעיף.",
    featVocab: "מאמן מילים",
    featVocabDesc: "900+ מילים אנגלית-עברית. כרטיסיות החלקה, חזרה חכמה.",
    featChallenge: "מצב אתגר",
    featChallengeDesc: "תרגול מהיר עם ניקוד, סטריקים ובונוסים — שפר תחת לחץ.",
    featReview: "סקירה חכמה",
    featReviewDesc: "חזרה אוטומטית על שגיאות ושאלות שלקחו זמן רב.",
    featDashboard: "לוח בקרה",
    featDashboardDesc: "עקוב אחר הרצף שלך, הציון המשוער ותחומים לשיפור.",
    examStructure: "מבנה מבחן האמירנט",
    examSection1: "השלמת משפטים א׳",                            examSection1Time: "~4 דקות · 4 שאלות",
    examSection2: "השלמת משפטים ב׳",                            examSection2Time: "~4 דקות · 4 שאלות",
    examSection3: "הבנת הנקרא",                                examSection3Time: "~15 דקות · קטע אחד · 5 שאלות",
    examSection4: "ניסוח מחדש (Restatements) א׳",              examSection4Time: "~6 דקות · 3 שאלות",
    examSection5: "ניסוח מחדש (Restatements) ב׳",              examSection5Time: "~6 דקות · 3 שאלות",
    examSection6: "השלמת משפטים ג׳",                            examSection6Time: "~4 דקות · 4 שאלות",
  },
  practice: {
    title: "תרגול",
    subtitle: "בחר רמת קושי ואז קטגוריה להתחלת סשן של 20 שאלות",
    pickMode: "בחר קטגוריה",
    startSession: "התחל סשן",
    question: "שאלה",
    of: "מתוך",
    submit: "שלח תשובה",
    next: "הבאה",
    correct: "נכון!",
    incorrect: "לא נכון",
    sessionDone: "הסשן הסתיים",
    accuracy: "דיוק",
    timeUsed: "זמן",
    reviewMistakes: "סקור שגיאות",
    practiceAgain: "תרגל שוב",
    difficulty: "רמת קושי",
    mixed: "מעורב",
    easy: "קל",
    medium: "בינוני",
    hard: "קשה",
    readingPassageSubtitle: "קטע מלא + 5 שאלות",
    standardSessionSubtitle: "סשן תרגול — 20 שאלות",
    writingSessionSubtitle: "סשן תרגול — מטלת כתיבה",
    sectionMainCategories: "קטגוריות עיקריות",
    sectionSkillBoosters: "חיזוק מיומנויות",
    sectionSkillBoostersSubtitle: "תרגול תומך",
    sectionSkillBoostersIntro:
      "תרגול מיומנויות ספציפיות שיעזרו לך בשאלות AMIRNET — אוצר מילים, קישורים לוגיים, ניסוח מחדש ומלכודות נפוצות.",
    sectionPilot: "פרקים ניסיוניים — 5 סוגים",
    pilotSubtitle: "ניסיוני",
    pilotInfo:
      "פרקים אלו לא נספרים לציון הסופי. שגיאות לא פוגעות בציון — תשובות נכונות עשויות להוסיף בונוס.",
    badgePilot: "פיילוט",
    badgeRecommended: "מומלץ",
    badgeNew: "חדש",
    difficultyAdaptiveDesc: "מתאים לרמתך אוטומטית",
    difficultyEasyDesc: "שאלות בסיסיות",
    difficultyMediumDesc: "רמת מבחן אמיתית",
    difficultyHardDesc: "מאתגר ומורכב",
    difficultyLockNotice: "כל הסשנים יתחילו ברמה זו",
    start: "התחל",
    practiceVerb: "תרגל",
    questionsUnit: "שאלות",
    questionsCount: "{n} שאלות",
    correctOfTotal: "נכון",
    finishSession: "סיים סשן",
    nextArrow: "הבאה →",
    submitAnswer: "שלח תשובה",
    incorrectLabel: "לא נכון",
    skillBoosterTag: "חיזוק מיומנות",
    hebrewExplanation: "הסבר בעברית",
    keyWords: "מילים מפתח:",
    practiceSimilar: "תרגל שאלות דומות →",
    correctRandom1: "נכון! מצוין 🌟",
    correctRandom2: "כל הכבוד! ✓",
    correctRandom3: "מצוין! ✓",
    correctRandom4: "נכון! המשך כך 💪",
    noQuestionsAvailable: "אין שאלות זמינות עבור מצב זה.",
    writingNeedMoreWords: "עוד {n} מילים נדרשות לסיום",
    playLecture: "נגן הרצאה",
    stopLecture: "עצור",
    showTranscript: "הצג תמליל (לתרגול בלבד)",
    hideTranscript: "הסתר תמליל",
    transcriptHidden: "📖 Transcript — לא גלוי במבחן",
    audioUnsupported: "אודיו לא נתמך בדפדפן זה",
    readingHint:
      "טיפ: סמן מילה או ביטוי כדי לתרגם לעברית ולהוסיף למאגר 'לא יודע'.",
  },
  account: {
    pageTitle: "חשבון",
    planLabelGuest: "אורח",
    planLabelFree: "חינמי",
    planLabelPro: "פרו",
    planLabelLifetime: "לכל החיים",
    planLabelAdmin: "מנהל",
    guestName: "משתמש אורח",
    guestSub: "ללא כניסה",
    upgradePlan: "שדרג תוכנית →",
    statsQuestions: "שאלות",
    statsAccuracy: "דיוק",
    statsStreak: "רצף",
    statsStreakSuffix: "ימים",
    entitlements: "הרשאות",
    entPractice: "תרגול",
    entSimulation: "הדמיה",
    entSmartReview: "סקירה חכמה",
    entAnalytics: "ניתוח מלא",
    entVocabImport: "ייבוא מילים",
    appearance: "מראה",
    appearanceModeDark: "מצב כהה",
    appearanceModeLight: "מצב בהיר",
    appearanceModeSystem: "מצב מערכת",
    appearanceSwitch: "החלף",
    appearancePrimaryColor: "צבע ראשי",
    appearanceReset: "איפוס",
    appearanceCustomColor: "צבע מותאם אישית",
    dataTitle: "ניהול נתונים",
    exportProgress: "ייצא התקדמות",
    importProgress: "ייבא התקדמות",
    importSuccess: "✓ יובא בהצלחה",
    importError: "✗ שגיאה בייבוא",
    resetAll: "אפס את כל הנתונים",
    resetConfirm: "בטוח שרצית לאפס את כל ההתקדמות? פעולה זו אינה הפיכה.",
    devModeSwitcher: "DEV: מתג תוכנית (Mock)",
    dataDisclaimer: "כל הנתונים שמורים מקומית. לא נשלח מידע לשרת.",
  },
  pricing: {
    title: "תמחור",
    subtitle: "התחל חינם. שדרג כשתהיה מוכן.",
    mostPopular: "הכי פופולרי",
    comingSoon: "בקרוב",
    free: "חינם",
    perMonth: "/ חודש",
    oneTime: "חד-פעמי",
    activated: "✓ מופעל (Mock)",
    activate: "הפעל (Mock)",
    devMode: "DEV MODE: לחיצה על תוכנית מדמה הפעלה מקומית בלבד. תשלום אמיתי אינו מופעל.",
    disclaimer: "כלי הכנה עצמאי לאמירנט. אינו קשור ל-NITE. ציונים והדמיות אינם רשמיים.",
    planFree: "חינמי",
    planProMonthly: "פרו חודשי",
    planPro3Month: "פרו 3 חודשים",
    planSimPack: "חבילת הדמיות",
    planCredits: "קרדיטים",
    featUnlimitedPractice: "שאלות אימון ללא הגבלה",
    feat2SimsPerMonth: "2 הדמיות בחודש",
    featBasicVocab: "מאגר בסיסי 100 מילים",
    featProgressTracking: "מעקב התקדמות",
    featEverythingInFree: "כל מה שב-Free",
    featUnlimitedSimulations: "הדמיות ללא הגבלה",
    featFullVocab: "מאגר מלא 900+ מילים",
    featSmartReviewQueue: "תור חזרה חכם",
    featWeaknessAnalysis: "ניתוח נקודות חולשה",
    featProgressExportImport: "ייצוא ויבוא התקדמות",
    featEverythingInPro: "כל מה שב-Pro",
    feat19PercentSavings: "חיסכון של ~19%",
    feat3Simulations: "3 הדמיות",
    featOneTimePayment: "תשלום חד-פעמי",
    featValid60Days: "תוקף 60 יום",
    featComingSoon: "בקרוב",
    featFlexibleCredits: "קרדיטים לשימוש גמיש",
  },
  learningEngine: {
    pageTitle: "מנוע למידה",
    pageDescription: "למד אסטרטגיות מבחן אמירנט — טיפ אחד בכל פעם",
    showExample: "הצג דוגמה",
    hideExample: "הסתר דוגמה",
    addBookmark: "הוסף סימנייה",
    removeBookmark: "הסר סימנייה",
    markUnderstood: "סמן כהובן",
    markNotUnderstood: "סמן כלא הובן",
    understood: "✓ הובן",
    gotIt: "הבנתי",
    prevTip: "עצה קודמת",
    nextTip: "עצה הבאה",
    tipsAria: "עצות לימוד",
    tipAria: "עצה {n}",
  },
  diagnostic: {
    introTitle: "בדיקת מיצוב ראשונית",
    introSubtitle: "נאמד את רמתך ונבנה עבורך תוכנית אימון מותאמת אישית",
    badge15Questions: "15 שאלות",
    badge8Minutes: "~8 דקות",
    badgeNoTimePressure: "ללא לחץ זמן",
    badgeInstant: "מיידי ומדויק",
    startCta: "התחל בדיקה →",
    introDisclaimer: "כלי הכנה עצמאי · ציונים אינם רשמיים",
    questionOf: "שאלה {n} מתוך 15",
    estimatedScore: "ציון משוער",
    estimatedScoreUnofficial: "ציון משוער לא רשמי · מתוך 150",
    overallAccuracy: "דיוק כולל",
    categoryBreakdown: "פירוט לפי קטגוריה",
    yourStrongest: "החזק שלך",
    needsImprovement: "זקוק לשיפור",
    continueCta: "המשך לתוכנית האימון שלי →",
  },
  scoreBand: {
    exemption: "רמת פטור",
    intermediate: "רמה בינונית",
    basic: "רמה בסיסית",
    needsWork: "נדרש שיפור משמעותי",
  },
  practiceSummary: {
    estimatedScore: "ציון משוער (לא רשמי) · מתוך 150",
    outOf150: "מתוך 150",
    accuracy: "דיוק",
    correctTotal: "נכון / סה״כ",
    time: "זמן",
    accuracyPercent: "{n}% דיוק",
    practiceAgain: "תרגל שוב",
    reviewMistakes: "סקור שגיאות",
    dashboard: "לוח בקרה",
    unofficialFooter:
      "ציון זה אינו רשמי ומיועד לאימון בלבד. לא קשור לנית או מאל\"מ.",
    motivExcellent: "מעולה! אתה ברמת פטור. המשך כך!",
    motivGood: "ביצוע טוב — עוד קצת תרגול ותגיע לפטור.",
    motivOk: "יש פוטנציאל — תתמקד בנושאים החלשים.",
    motivWeak: "אל תוותר! כל תרגול מקרב אותך למטרה.",
  },
  vocab: {
    title: "מילון",
    flip: "הפוך כרטיס",
    knew: "ידעתי ✓",
    didntKnow: "לא ידעתי",
    star: "סמן",
    shuffle: "ערבב",
    new: "חדש",
    learning: "לומד",
    strong: "חזק",
    mastered: "שלטתי",
    dueToday: "לתרגול היום",
    swipeRight: "החלק ימינה — ידעתי",
    swipeLeft: "החלק שמאלה — לא ידעתי",
    vocabDisclaimer:
      "רשימת המילים מבוססת על חומר לימוד של משתמשים. זו אינה רשימה רשמית של נית.",
    trainerTitle: "מאמן מילים",
    trainerSubtitle: "900+ מילים אנגלית-עברית לאמירנט · מאגר עצמאי, לא רשמי",
    pendingTotal: "סה״כ ממתינות",
    todaysWords: "מילים להיום",
    addCard: "+ הוסף כרטיס",
    pickActivity: "בחר פעילות",
    skillBoostersHeading: "חיזוק מיומנויות מילים",
    skillBoosters: "מאמני מיומנות",
    unknownTitle: "מילים שאני לא יודע",
    unknownSubtitle: "מאגר אישי של מילים וביטויים שסימנת בזמן הקריאה.",
    sessionDoneTitle: "סיום סבב!",
    sessionMessageExcellent: "מצוין! אתה מתפתח בקצב מהיר! 🔥",
    sessionMessageGood: "עבודה טובה! המשך להתקדם!",
    sessionMessageOk: "נסיון טוב — תרגל את המילים הקשות!",
    sessionMessageDefault: "המשך כך — אתה בונה תנופה!",
    statKnew: "ידעתי",
    statMissed: "לא ידעתי",
    statAccuracy: "דיוק",
    statMastered: "שלטתי",
    missedThisRound: "מילים שלא ידעת בסבב זה",
    practiceMissedCta: "תרגל את המילים שלא ידעת מהסבב הזה →",
    retryMissedTitle: "חזור על המילים שלא ידעת מהסבב הזה",
    sessionMissedSummary: "פספסת {n} מילים בסבב הזה",
    newRound: "התחל סבב חדש",
    allMissedLink: "כל הלא ידועות",
    unknownBankCta: "עבור למאגר המילים הלא ידועות",
    retryRoundLabel: "סבב חזרה — מילים שפספסת",
    emptyFilterTitle: "אין מילים בסינון זה",
    emptyFilterSubtitle: "נסה לשנות את הקטגוריה, הרמה או הסטטוס",
    clearFilter: "נקה סינון",
    loading: "טוען...",
    keyboardHint: "← לא ידעתי · Space הפוך · ידעתי → · S סימן · Z חזור",
    swipeKnown: "✓ ידעתי",
    swipeReview: "↩ שוב",
    tapToReveal: "הקש כדי לחשוף",
    trap: "מלכודת",
    addStar: "הוסף כוכב",
    removeStar: "הסר כוכב",
    playAudio: "השמע הגייה",
    playingAudio: "מנגן הגייה",
    back: "← חזור",
    flipCard: "הפוך ⟳",
    missedEmptyTitle: "כל הכבוד! 🎉",
    missedEmptySub: "עדיין לא פספסת אף מילה. תרגל כרטיסיות כדי לבנות את הרשימה.",
    missedStartPractice: "התחל לתרגל →",
    missedSummaryMissed: "פוספסו",
    missedSummaryMastered: "שלטתי",
    missedPracticeAll: "תרגל הכל →",
    missedSearchPlaceholder: "חפש מילה...",
    missedCountSuffix: "מילים",
    missedTimes: "פוספס {n}×",
    knownTimes: "ידוע {n}×",
    markKnown: "✓ סמן כידוע",
    goBackCard: "חזור לכרטיס הקודם (Z)",
    diffAll: "הכל",
    diffEasy: "קל",
    diffMedium: "בינוני",
    diffHard: "קשה",
    listShowingOfTotal: "מציג 200 מתוך {n}. צמצם את החיפוש.",
    starredPageTitle: "מילים מסומנות",
    starredPageSubtitle: "מילים שסימנת לחזרה מיוחדת",
    missedPageTitle: "מילים שלא ידעתי",
    missedPageSubtitle: "כל המילים שסימנת \"לא ידעתי\" — ממוינות לפי תדירות פספוסים",
    weakPageTitle: "מילים חלשות",
    weakPageSubtitle: "מילים שפספסת לעיתים קרובות — תרגל אותן שוב",
    customPageTitle: "מילים מותאמות אישית",
    customPageSubtitle: "הוסף מילים משלך ותרגל אותן בכרטיסיות החלקה",
    backToVocab: "← מאמן מילים",
    customTabBulk: "ייבוא מהיר",
    customTabCard: "הוסף כרטיס",
    customTabMy: "הכרטיסים שלי",
    customWordRequired: "מילה ותרגום הם שדות חובה",
    customFormatHint: "פורמט: מילה = תרגום",
    customBulkLineFormat: "הזן מילים — כל שורה: מילה = תרגום",
    customReadyCount: "✓ {n} מילים מוכנות לתרגול",
    customSkippedCount: "⚠ {n} שורות דולגו (חסר =)",
    customWriteHere: "כתוב מילים בפורמט: מילה = תרגום",
    customPreview: "תצוגה מקדימה",
    customMore: "+{n} נוספות",
    customAddNew: "הוסף כרטיס חדש",
    customWordLabel: "מילה",
    customTranslationLabel: "תרגום",
    customTypeLabel: "סוג מילה",
    customTypePickPlaceholder: "— בחר —",
    customDifficultyLabel: "רמת קושי",
    customExampleLabel: "משפט לדוגמה",
    customNotesLabel: "הערות",
    customNotesPlaceholder: "הערות נוספות…",
    customCardAdded: "✓ הכרטיס נוסף בהצלחה!",
    customAddCardCta: "+ הוסף כרטיס",
    customNoCardsYet: "עדיין לא הוספת כרטיסים מובנים",
    customAddFirstCard: "הוסף כרטיס ראשון →",
    customDeleteCard: "מחק",
    customStartPractice: "התחל תרגול",
    customWordsCount: "{n} מילים",
    customClearImport: "נקה ייבוא",
    customTranslationPlaceholder: "התמדה",
    customSelectPlaceholder: "—",
    customNoWords: "אין מילים לתרגול",
    customBackToList: "← חזרה לרשימה",
    customRoundDone: "סיום סבב!",
    customMissedSummary: "לא ידעת ({n})",
    customNewRound: "סבב חדש →",
    customLoading: "טוען…",
    customKeyboardHint: "← לא ידעתי · Space הפוך · ידעתי → · S סימן · Z חזור",
    statusDefault: "ברירת מחדל",
    statusMissed: "לא ידעתי ✗",
    statusDue: "לחזרה",
    statusNew: "חדשות",
    statusStarred: "מסומנים ★",
    statusWeak: "חלשים",
    statusMastered: "שולטים",
  },
  simulation: {
    title: "הדמיית אמירנט",
    standard: "אמירנט סטנדרטי",
    withPilot: "אמירנט+ עם פיילוט",
    quick: "תרגול מהיר",
    pilotOnly: "סעיפי פיילוט בלבד",
    section: "סעיף",
    timeLeft: "זמן שנותר",
    pilotWarning:
      "אלו סעיפי ניסוי. שגיאות לא יורידו את הציון. תשובות נכונות עשויות להוסיף עד 2 נקודות בונוס.",
    score: "ציון",
    unofficial:
      "ציון זה אינו רשמי ומיועד לאימון בלבד. לא קשור לנית או מאל\"מ.",
    exemption: "רמת פטור — ביצוע מצוין",
    breakdown: "פירוט לפי סעיף",
    subtitle: "בחר מצב הדמיה — כל הדמיה מדמה תנאי מבחן אמיתיים",
    modeStandardLabel: "אמירנט סטנדרטי",
    modeStandardDesc: "6 פרקים עיקריים — השלמת משפטים, קריאה, ניסוח מחדש. ~39 דקות, 23 שאלות. הדמיה הנאמנה ביותר למבחן האמיתי.",
    modeWritingLabel: "אמירנט עם כתיבה",
    modeWritingDesc: "7 פרקים — 6 פרקים עיקריים + מטלת כתיבה ניסיונית (90–120 מילים). ~51 דקות.",
    modePilotLabel: "אמירנט+ עם פיילוט",
    modePilotDesc: "8 פרקים — 6 עיקריים + 2 פיילוט ניסיוני (הרצאה, שמע, דקדוק, יצירת מילה). ~49 דקות.",
    modeQuickLabel: "תרגול מהיר",
    modeQuickDesc: "פרקים 1, 3, 6 בלבד — השלמת משפטים וקריאה. ~20 דקות. מושלם לחימום יומי.",
    modePilotOnlyLabel: "פרקים ניסיוניים בלבד",
    modePilotOnlyDesc: "2 פרקי פיילוט בלבד, ~15 דקות. אימון ממוקד לסעיפים הניסיוניים.",
    badgeRecommended: "מומלץ",
    badgeExperimental: "ניסיוני",
    unitMinutes: "דקות",
    unitSections: "פרקים",
    startSimulation: "התחל הדמיה →",
    disclaimerCard: "ⓘ כלי הכנה עצמאי לאמירנט. לא קשור לנית. ציונים, הדמיות ותחזיות הם לא רשמיים.",
    backToList: "← חזרה",
    sectionLabelN: "פרק {n}/{total}",
    pilotTag: "● ניסיוני",
    questionsAnswered: "{a}/{b} נענו",
    btnPrev: "← הקודם",
    btnNext: "הבא →",
    btnNextSection: "המשך לפרק הבא →",
    btnFinishSimulation: "סיים הדמיה →",
    loadingQuestions: "טוען שאלות…",
    sectionTypeSentenceCompletion: "השלמת משפטים",
    sectionTypeRestatements: "ניסוח מחדש",
    sectionTypeReading: "קטע קריאה עם שאלות נלוות",
    sectionTypeLectureQuestions: "שאלות על הרצאה או שיחה",
    sectionTypeTextCompletion: "השלמת קטע שמע",
    sectionTypeWordFormation: "יצירת מילה",
    sectionTypeGrammar: "דקדוק בהקשר",
    sectionTypeWritingTask: "מטלת כתיבה",
    sectionOrdinalSuffix: " {n}",
    transitionEyebrow: "סעיף {n}",
    transitionTime: "{m} דקות · מתחיל בעוד {n}…",
    transitionCta: "התחל עכשיו →",
    pilotIntroHeading: "🧪 סעיף ניסוי",
    pilotIntroBody: "אלו סעיפי ניסוי. שגיאות לא יורידו את הציון שלך. תשובות נכונות עשויות להוסיף עד 2 נקודות בונוס.",
    pilotIntroContinue: "המשך →",
    reviewTitle: "סקירת תשובות",
    reviewBackToResults: "← חזרה לתוצאות",
    reviewQuestionOf: "שאלה {n} מתוך {total}",
    reviewUnanswered: "• לא נענתה",
    reviewCorrect: "✓ נכון",
    reviewWrong: "✗ שגוי",
    reviewExplanation: "הסבר",
    reviewYourAnswer: "התשובה שלך",
    reviewCorrectMark: "התשובה הנכונה",
    summaryComplete: "הדמיה הסתיימה",
    summaryDisclaimer: "ציון זה אינו רשמי ומיועד לאימון בלבד. לא קשור לנית או מאל\"מ.",
    summaryBreakdownTitle: "פירוט לפי סעיף",
    summaryPilot: "פיילוט",
    summaryReviewBtn: "סקור תשובות →",
    summaryPracticeWeaknesses: "תרגל חולשות",
    summaryNewSimulation: "הדמיה חדשה",
    summaryDashboard: "לוח בקרה",
  },
  writingTask: {
    topicHeading: "✍️ נושא הכתיבה",
    instructionsTitle: "הנחיות:",
    instructionsBody: "כתב/י תשובה ברורה של {min}–{max} מילים. הצג/י עמדה, תן/י שתי סיבות ודוגמה, וסיים/י בסיכום קצר. שים/י לב לדקדוק, אוצר מילים ורציפות.",
    rubricLabel: "קריטריונים לניקוד:",
    rubricContentOrg: "תוכן וארגון",
    rubricVocabulary: "אוצר מילים",
    rubricGrammar: "דיוק דקדוקי",
    rubricCoherence: "קוהרנטיות",
    rubricTaskRelevance: "רלוונטיות למשימה",
    templateToggleShow: "📋 הצג תבנית מומלצת",
    templateToggleHide: "הסתר תבנית",
    templateHeading: "תבנית לכתיבה (לתרגול בלבד)",
    templateInsert: "הכנס תבנית לשדה הכתיבה",
    placeholderTextarea: "כתב/י כאן את תשובתך באנגלית…",
    wordsLabel: "מילים",
    wordsMoreNeeded: "עוד {n} מילים נדרשות",
    wordsOver: "{n} מילים יתר",
    wordsRange: "טווח: {min}–{max} מילים",
    timeoutMessage: "הזמן לסעיף זה הסתיים.",
  },
  sidebar: {
    colorLabel: "צבע",
    bgLabel: "רקע",
    reset: "איפוס",
    themeDark: "כהה",
    themeLight: "בהיר",
    themeSystem: "מערכת",
  },
  review: {
    title: "סקירה חכמה",
    subtitle: "חזור על הנושאים שבהם אתה חלש ביותר",
    noDataTitle: "עדיין אין נתונים",
    noDataBody: "ענה על לפחות 3 שאלות בכל קטגוריה כדי לראות ניתוח חולשות",
    noDataCta: "התחל לתרגל →",
    perfectTitle: "כל הכבוד!",
    perfectBody: "אין נקודות חולשה ברורות עדיין. המשך לתרגל כדי לשמור על הרמה.",
    perfectCta: "המשך לתרגל",
    categoriesTitle: "קטגוריות לשיפור",
    categoriesBadgeTopics: "נושאים",
    weakVocabTitle: "מילים חלשות",
    practiceLink: "תרגל →",
    correctLabel: "נכון",
    averagePerQuestion: "ממוצע {n}ש׳ לשאלה",
    seeAllWeakWords: "ראה את כל המילים החלשות →",
    practiceNow: "תרגל עכשיו →",
    wordTrainer: "מאמן מילים →",
  },
  dashboard: {
    greeting: "שלום",
    goalProgress: "התקדמות יומית",
    streak: "רצף ימים",
    weakAreas: "נקודות לשיפור",
    vocabDue: "מילים לתרגול היום",
    recommended: "פעילות מומלצת",
    noData: "השלם את הסשן הראשון כדי לראות נתונים",
    todaysTraining: "תוכנית האימון של היום",
    itemsLabel: "פעולות",
    progress: "התקדמות",
    actions: "פעולות",
    startToday: "התחל אימון היום",
    planVocabToday: "מילים להיום",
    planReadingPassage: "הבנת הנקרא — קטע מלא",
    planMixed: "תרגול מעורב",
    planReasonVocabPending: "{n} ממתינות בסך הכל",
    planReasonVocabBuild: "חזק את אוצר המילים",
    planReasonReading: "5 שאלות על קטע אחד בן כמה פסקאות",
    planReasonWeak: "דיוק {n}% — זקוק לשיפור",
    planReasonBooster: "חיזוק מיומנות — נחלש ב{cat}",
    planReasonMixedFirst: "תרגול מאוזן לתחילה",
    planReasonMixedKeepLevel: "שמור על רמה גבוהה",
    planBoosterVocabInContext: "אוצר מילים בהקשר",
    planBoosterRestatementMini: "ניסוח מחדש מהיר",
    planBoosterConnectors: "מילות קישור",
    planBoosterSynonym: "זיהוי נרדפות",
    planBoosterAcademicPhrase: "ביטויים אקדמיים",
    planBoosterSentenceLogic: "היגיון משפטי",
    unitWords: "מילים",
    unitQuestions: "שאלות",
    statsDailyGoal: "יעד יומי",
    statsGoalReached: "יעד הושג",
    statsRemainingPct: "{n}% נותר",
    statsDayStreak: "רצף ימים",
    statsDaysInRow: "ימים ברצף",
    statsEstScore: "ציון משוער",
    statsOutOf150: "מתוך 150",
    statsAccuracy: "דיוק",
    statsQuestionsUnit: "שאלות",
    statsTotalQuestions: "סה״כ שאלות",
    statsCorrectUnit: "נכון",
    level1: "מתחיל",
    level2: "לומד",
    level3: "מתקדם",
    level4: "מיומן",
    level5: "מומחה",
    level6: "אמן",
    level7: "מאסטר",
    level8: "אלוף",
    weakEmptyLineA: "ענה על לפחות 3 שאלות בכל קטגוריה",
    weakEmptyLineB: "כדי לראות ניתוח חולשות ועוצמות",
    weakStartPracticing: "התחל לתרגל",
    weakSeeAll: "ראה הכל",
    weakPracticeLink: "תרגל",
    weakCorrectOf: "נכון",
    catSentenceCompletion: "השלמת משפטים",
    catRestatements: "ניסוח מחדש",
    catReading: "הבנת הנקרא",
    catGrammar: "דקדוק",
    catWordFormation: "צורות מילים",
    catTextCompletion: "השלמת טקסט",
    catLectureQuestions: "הרצאה",
    catVocabulary: "אוצר מילים",
    catMixed: "מעורב",
    level: "רמה",
    daysStreak: "ימים",
    readinessHeading: "מוכנות לאמירנט",
    readinessMessageVeryHigh: "מוכנות גבוהה — המשך לשמור על הרמה",
    readinessMessageHigh: "בדרך טובה — כדאי לחזק את הנקודות החלשות",
    readinessMessageMid: "התקדמות ניכרת — יש עוד מה לשפר",
    readinessMessageLow: "בסיס טוב — כדאי להגביר את קצב האימון",
    readinessMessageVeryLow: "עוד עבודה לפנינו — המשך לתרגל מדי יום",
    readinessEstimatedScore: "ציון משוער",
    readinessUnofficial: "לא רשמי · מתוך 150",
    readinessTarget: "מטרה",
    readinessFocusAreas: "נקודות לחיזוק:",
    readinessNoData: "גלה את הרמה האמיתית שלך",
    readinessNoDataSub: "15 שאלות · כ-8 דקות · תוכנית אימון מותאמת אישית",
    readinessPlacementBtn: "בדיקת מיצוב",
  },
  unknownWords: {
    filterAll: "הכל",
    filterUnknown: "לא ידוע",
    filterKnown: "ידוע",
    empty: "עדיין לא שמרת מילים. סמן מילה בתוך קטע באנגלית כדי להוסיף אותה לכאן.",
    source: "מקור",
    markKnown: "ידעתי",
    markUnknown: "לא ידוע",
    remove: "הסר",
    sourceReading: "קריאה",
    sourceVocab: "מילון",
    sourcePractice: "תרגול",
    sourceAcademicPhrase: "ביטוי אקדמי",
    sourceManual: "ידני",
  },
  selectionPopup: {
    addToUnknown: "הוסף ללא יודע",
    saved: "נשמר",
    markKnown: "ידוע",
    close: "סגור",
    fallback: "(תרגום לא זמין)",
  },
  common: {
    loading: "טוען...",
    save: "שמור",
    cancel: "ביטול",
    close: "סגור",
    settings: "הגדרות",
    darkMode: "מצב לילה",
    lightMode: "מצב יום",
    hebrew: "עברית",
    english: "English",
    back: "חזרה",
    start: "התחל",
    finish: "סיים",
    empty: "אין נתונים עדיין",
  },
};

export const en: Translations = {
  nav: { dashboard: "Dashboard", practice: "Practice", simulation: "Simulation", vocab: "Vocab", review: "Review", challenge: "Challenge", pricing: "Pricing", account: "Account", admin: "Admin", learningEngine: "Learn" },
  home: {
    tagline: "Your personal AMIRNET coach",
    hero: "Practice AMIRNET-level English with smart tools",
    heroSub: "Smart dictionary, drills, full simulations and performance analysis. Not affiliated with NITE.",
    startFree: "Start for free",
    runSim: "Full simulation",
    disclaimer: "Independent AMIRNET preparation tool. Not affiliated with NITE. Scores, simulations, and predictions are unofficial.",
    featSmartPractice: "Smart practice",
    featSmartPracticeDesc: "Sentence completion, restatements, grammar and word formation — tuned to your level.",
    featSimulations: "Real-time simulations",
    featSimulationsDesc: "Full AMIRNET simulations with realistic timing and per-section analysis.",
    featVocab: "Vocabulary trainer",
    featVocabDesc: "900+ English–Hebrew words. Swipe cards, smart spaced repetition.",
    featChallenge: "Challenge mode",
    featChallengeDesc: "Fast-paced practice with scoring, streaks and bonuses — improve under pressure.",
    featReview: "Smart review",
    featReviewDesc: "Automatic review of mistakes and questions that took too long.",
    featDashboard: "Dashboard",
    featDashboardDesc: "Track your streak, estimated score and the areas you need to improve.",
    examStructure: "AMIRNET exam structure",
    examSection1: "Sentence Completion (Part 1)",              examSection1Time: "~4 min · 4 questions",
    examSection2: "Sentence Completion (Part 2)",              examSection2Time: "~4 min · 4 questions",
    examSection3: "Reading Comprehension",                     examSection3Time: "~15 min · 1 passage · 5 questions",
    examSection4: "Restatements (Part 1)",                     examSection4Time: "~6 min · 3 questions",
    examSection5: "Restatements (Part 2)",                     examSection5Time: "~6 min · 3 questions",
    examSection6: "Sentence Completion (Part 3)",              examSection6Time: "~4 min · 4 questions",
  },
  practice: {
    title: "Practice",
    subtitle: "Choose a difficulty level and a category to start a 20-question session",
    pickMode: "Pick a mode",
    startSession: "Start session",
    question: "Question",
    of: "of",
    submit: "Submit answer",
    next: "Next",
    correct: "Correct!",
    incorrect: "Incorrect",
    sessionDone: "Session complete",
    accuracy: "Accuracy",
    timeUsed: "Time",
    reviewMistakes: "Review mistakes",
    practiceAgain: "Practice again",
    difficulty: "Difficulty level",
    mixed: "Mixed",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    readingPassageSubtitle: "Full passage + 5 questions",
    standardSessionSubtitle: "Practice — 20 questions",
    writingSessionSubtitle: "Practice — writing task",
    sectionMainCategories: "Main Categories",
    sectionSkillBoosters: "Skill Boosters",
    sectionSkillBoostersSubtitle: "Supporting practice",
    sectionSkillBoostersIntro:
      "Drill specific skills that help on AMIRNET — academic vocabulary, logical connectors, paraphrasing and common distractors.",
    sectionPilot: "Experimental sections — 5 types",
    pilotSubtitle: "Experimental",
    pilotInfo:
      "These sections don't count toward the official score. Mistakes won't hurt your score — correct answers may add a small bonus.",
    badgePilot: "Pilot",
    badgeRecommended: "Recommended",
    badgeNew: "New",
    difficultyAdaptiveDesc: "Adapts to your level automatically",
    difficultyEasyDesc: "Foundational questions",
    difficultyMediumDesc: "Real-exam level",
    difficultyHardDesc: "Challenging and complex",
    difficultyLockNotice: "All sessions will start at this difficulty",
    start: "Start",
    practiceVerb: "Practice",
    questionsUnit: "questions",
    questionsCount: "{n} questions",
    correctOfTotal: "correct",
    finishSession: "Finish session",
    nextArrow: "Next →",
    submitAnswer: "Submit answer",
    incorrectLabel: "Incorrect",
    skillBoosterTag: "Skill booster",
    hebrewExplanation: "Hebrew explanation",
    keyWords: "Key words:",
    practiceSimilar: "Practice similar questions →",
    correctRandom1: "Correct — great work 🌟",
    correctRandom2: "Well done ✓",
    correctRandom3: "Excellent ✓",
    correctRandom4: "Right — keep going 💪",
    noQuestionsAvailable: "No questions available for this mode.",
    writingNeedMoreWords: "{n} more words needed to finish",
    playLecture: "Play lecture",
    stopLecture: "Stop",
    showTranscript: "Show transcript (practice only)",
    hideTranscript: "Hide transcript",
    transcriptHidden: "📖 Transcript — not visible in the real exam",
    audioUnsupported: "Audio is not supported in this browser",
    readingHint:
      "Tip: highlight any word or phrase to translate it and save to your unknown-words bank.",
  },
  account: {
    pageTitle: "Account",
    planLabelGuest: "Guest",
    planLabelFree: "Free",
    planLabelPro: "Pro",
    planLabelLifetime: "Lifetime",
    planLabelAdmin: "Admin",
    guestName: "Guest user",
    guestSub: "no sign-in",
    upgradePlan: "Upgrade plan →",
    statsQuestions: "Questions",
    statsAccuracy: "Accuracy",
    statsStreak: "Streak",
    statsStreakSuffix: "d",
    entitlements: "Entitlements",
    entPractice: "Practice",
    entSimulation: "Simulation",
    entSmartReview: "Smart Review",
    entAnalytics: "Full Analytics",
    entVocabImport: "Vocab Import",
    appearance: "Appearance",
    appearanceModeDark: "Dark mode",
    appearanceModeLight: "Light mode",
    appearanceModeSystem: "System mode",
    appearanceSwitch: "Switch",
    appearancePrimaryColor: "Primary color",
    appearanceReset: "Reset",
    appearanceCustomColor: "Custom color",
    dataTitle: "Data",
    exportProgress: "Export progress",
    importProgress: "Import progress",
    importSuccess: "✓ Imported successfully",
    importError: "✗ Import failed",
    resetAll: "Reset all data",
    resetConfirm: "Are you sure you want to reset all progress? This cannot be undone.",
    devModeSwitcher: "DEV: Mock plan switcher",
    dataDisclaimer: "All data is stored locally on this device. Nothing is sent to a server.",
  },
  pricing: {
    title: "Pricing",
    subtitle: "Start free. Upgrade when you're ready.",
    mostPopular: "Most popular",
    comingSoon: "Coming soon",
    free: "Free",
    perMonth: "/ month",
    oneTime: "one-time",
    activated: "✓ Activated (Mock)",
    activate: "Activate (Mock)",
    devMode: "DEV MODE: clicking a plan only activates it locally. Real payment is not wired up.",
    disclaimer: "Independent AMIRNET prep tool. Not affiliated with NITE. Scores and simulations are unofficial.",
    planFree: "Free",
    planProMonthly: "Pro Monthly",
    planPro3Month: "Pro 3 Months",
    planSimPack: "Simulation Pack",
    planCredits: "Credits",
    featUnlimitedPractice: "Unlimited practice questions",
    feat2SimsPerMonth: "2 simulations per month",
    featBasicVocab: "Basic vocab (100 words)",
    featProgressTracking: "Progress tracking",
    featEverythingInFree: "Everything in Free",
    featUnlimitedSimulations: "Unlimited simulations",
    featFullVocab: "Full vocab deck (900+ words)",
    featSmartReviewQueue: "Smart review queue",
    featWeaknessAnalysis: "Weakness analysis",
    featProgressExportImport: "Progress export & import",
    featEverythingInPro: "Everything in Pro",
    feat19PercentSavings: "~19% savings",
    feat3Simulations: "3 simulations",
    featOneTimePayment: "One-time payment",
    featValid60Days: "Valid 60 days",
    featComingSoon: "Coming soon",
    featFlexibleCredits: "Flexible-use credits",
  },
  learningEngine: {
    pageTitle: "Learning Engine",
    pageDescription: "Learn AMIRNET test strategies — one tip at a time",
    showExample: "Show example",
    hideExample: "Hide example",
    addBookmark: "Add bookmark",
    removeBookmark: "Remove bookmark",
    markUnderstood: "Mark as understood",
    markNotUnderstood: "Mark as not understood",
    understood: "✓ Understood",
    gotIt: "Got it",
    prevTip: "Previous tip",
    nextTip: "Next tip",
    tipsAria: "Learning tips",
    tipAria: "Tip {n}",
  },
  diagnostic: {
    introTitle: "Placement test",
    introSubtitle: "We'll measure your level and build a personalized training plan",
    badge15Questions: "15 questions",
    badge8Minutes: "~8 minutes",
    badgeNoTimePressure: "No time pressure",
    badgeInstant: "Instant and accurate",
    startCta: "Start test →",
    introDisclaimer: "Independent prep tool · scores are unofficial",
    questionOf: "Question {n} of 15",
    estimatedScore: "Estimated score",
    estimatedScoreUnofficial: "Unofficial estimated score · out of 150",
    overallAccuracy: "Overall accuracy",
    categoryBreakdown: "Breakdown by category",
    yourStrongest: "Strongest",
    needsImprovement: "Needs work",
    continueCta: "Continue to my training plan →",
  },
  scoreBand: {
    exemption: "Exemption level",
    intermediate: "Intermediate level",
    basic: "Basic level",
    needsWork: "Needs significant improvement",
  },
  practiceSummary: {
    estimatedScore: "Estimated score (unofficial) · out of 150",
    outOf150: "out of 150",
    accuracy: "Accuracy",
    correctTotal: "Correct / Total",
    time: "Time",
    accuracyPercent: "{n}% accuracy",
    practiceAgain: "Practice again",
    reviewMistakes: "Review mistakes",
    dashboard: "Dashboard",
    unofficialFooter:
      "This score estimate is unofficial and for practice only. Not affiliated with NITE or MALAM.",
    motivExcellent: "Excellent — you're at exemption level. Keep it up!",
    motivGood: "Good performance — a bit more practice and you'll reach exemption.",
    motivOk: "There's potential — focus on your weakest topics.",
    motivWeak: "Don't give up — every session brings you closer.",
  },
  vocab: {
    title: "Vocab Trainer",
    flip: "Flip card",
    knew: "I knew it ✓",
    didntKnow: "Review again",
    star: "Star",
    shuffle: "Shuffle",
    new: "New",
    learning: "Learning",
    strong: "Strong",
    mastered: "Mastered",
    dueToday: "Due today",
    swipeRight: "Swipe right — I knew it",
    swipeLeft: "Swipe left — review again",
    vocabDisclaimer:
      "This vocabulary deck is based on user-provided study material. It is not an official NITE word list.",
    trainerTitle: "Vocabulary Trainer",
    trainerSubtitle: "900+ English–Hebrew AMIRNET words · independent, unofficial deck",
    pendingTotal: "pending in total",
    todaysWords: "words today",
    addCard: "+ Add card",
    pickActivity: "Pick an activity",
    skillBoostersHeading: "Vocabulary skill boosters",
    skillBoosters: "Skill Boosters",
    unknownTitle: "Words I don't know",
    unknownSubtitle: "Your personal bank of words and phrases you flagged while reading.",
    sessionDoneTitle: "Session complete!",
    sessionMessageExcellent: "Great work! You are improving quickly 🔥",
    sessionMessageGood: "Solid work — keep the streak going!",
    sessionMessageOk: "Nice try — drill the harder words next.",
    sessionMessageDefault: "Keep going — you're building momentum!",
    statKnew: "Knew",
    statMissed: "Didn't know",
    statAccuracy: "Accuracy",
    statMastered: "Mastered",
    missedThisRound: "Words missed in this session",
    practiceMissedCta: "Practice missed words from this session →",
    retryMissedTitle: "Review only the words you missed in this session",
    sessionMissedSummary: "You missed {n} words in this session",
    newRound: "Start a new session",
    allMissedLink: "All unknown words",
    unknownBankCta: "Go to unknown words bank",
    retryRoundLabel: "Retry round — words you missed",
    emptyFilterTitle: "No words match this filter",
    emptyFilterSubtitle: "Try changing the category, level or status",
    clearFilter: "Clear filter",
    loading: "Loading…",
    keyboardHint:
      "← didn't know · Space flip · knew →  · S star · Z back",
    swipeKnown: "✓ Knew it",
    swipeReview: "↩ Review",
    tapToReveal: "Tap to reveal",
    trap: "Trap",
    addStar: "Add star",
    removeStar: "Remove star",
    playAudio: "Play pronunciation",
    playingAudio: "Playing pronunciation",
    back: "← Back",
    flipCard: "Flip ⟳",
    missedEmptyTitle: "Great job 🎉",
    missedEmptySub: "You haven't missed any word yet. Practice the swipe deck to build this list.",
    missedStartPractice: "Start practicing →",
    missedSummaryMissed: "Missed",
    missedSummaryMastered: "Mastered",
    missedPracticeAll: "Practice all →",
    missedSearchPlaceholder: "Search a word…",
    missedCountSuffix: "words",
    missedTimes: "Missed {n}×",
    knownTimes: "Known {n}×",
    markKnown: "✓ Mark as known",
    goBackCard: "Go back to previous card (Z)",
    diffAll: "All",
    diffEasy: "Easy",
    diffMedium: "Medium",
    diffHard: "Hard",
    listShowingOfTotal: "Showing 200 of {n}. Narrow your search.",
    starredPageTitle: "Starred words",
    starredPageSubtitle: "Words you starred for focused review",
    missedPageTitle: "Missed words",
    missedPageSubtitle: "Every word you marked as \"didn't know\" — sorted by miss count",
    weakPageTitle: "Weak words",
    weakPageSubtitle: "Words you miss often — drill them again",
    customPageTitle: "My custom words",
    customPageSubtitle: "Add your own words and study them with swipe cards",
    backToVocab: "← Vocabulary trainer",
    customTabBulk: "Quick import",
    customTabCard: "Add card",
    customTabMy: "My cards",
    customWordRequired: "Word and translation are required",
    customFormatHint: "Format: word = translation",
    customBulkLineFormat: "Enter words — one per line: word = translation",
    customReadyCount: "✓ {n} words ready to practice",
    customSkippedCount: "⚠ {n} lines skipped (missing =)",
    customWriteHere: "Write words in the format: word = translation",
    customPreview: "Preview",
    customMore: "+{n} more",
    customAddNew: "Add a new card",
    customWordLabel: "Word",
    customTranslationLabel: "Translation",
    customTypeLabel: "Type",
    customTypePickPlaceholder: "— pick —",
    customDifficultyLabel: "Difficulty",
    customExampleLabel: "Example sentence",
    customNotesLabel: "Notes",
    customNotesPlaceholder: "Additional notes…",
    customCardAdded: "✓ Card added successfully!",
    customAddCardCta: "+ Add card",
    customNoCardsYet: "You haven't added any custom cards yet",
    customAddFirstCard: "Add your first card →",
    customDeleteCard: "Delete",
    customStartPractice: "Start practice",
    customWordsCount: "{n} words",
    customClearImport: "Clear import",
    customTranslationPlaceholder: "persistence",
    customSelectPlaceholder: "—",
    customNoWords: "No words to practice",
    customBackToList: "← Back to list",
    customRoundDone: "Session complete!",
    customMissedSummary: "Didn't know ({n})",
    customNewRound: "New session →",
    customLoading: "Loading…",
    customKeyboardHint: "← didn't know · Space flip · knew → · S star · Z back",
    statusDefault: "Default",
    statusMissed: "Missed ✗",
    statusDue: "Review",
    statusNew: "New",
    statusStarred: "Starred ★",
    statusWeak: "Weak",
    statusMastered: "Mastered",
  },
  simulation: {
    title: "AMIRNET Simulation",
    standard: "Standard AMIRNET",
    withPilot: "AMIRNET+ with Pilot",
    quick: "Quick Practice",
    pilotOnly: "Pilot sections only",
    section: "Section",
    timeLeft: "Time left",
    pilotWarning:
      "These are experimental sections. Mistakes will not lower your score. Correct answers may add up to 2 bonus points.",
    score: "Score",
    unofficial:
      "This score estimate is unofficial and for practice only. Not affiliated with NITE or MALAM.",
    exemption: "Exemption level — strong performance",
    breakdown: "Section breakdown",
    subtitle: "Choose a simulation mode — each one mirrors real exam conditions",
    modeStandardLabel: "Standard AMIRNET",
    modeStandardDesc: "6 main sections — sentence completion, reading, restatements. ~39 minutes, 23 questions. The closest simulation of the real exam.",
    modeWritingLabel: "AMIRNET + Writing Task",
    modeWritingDesc: "7 sections — 6 main + one experimental writing task (90–120 words). ~51 minutes.",
    modePilotLabel: "AMIRNET+ with Pilot",
    modePilotDesc: "8 sections — 6 main + 2 experimental pilot (lecture, audio, grammar, word formation). ~49 minutes.",
    modeQuickLabel: "Quick Practice",
    modeQuickDesc: "Sections 1, 3, 6 only — sentence completion and reading. ~20 minutes. Perfect daily warm-up.",
    modePilotOnlyLabel: "Experimental Only",
    modePilotOnlyDesc: "2 pilot sections only, ~15 minutes. Focused training for the experimental section types.",
    badgeRecommended: "Recommended",
    badgeExperimental: "Experimental",
    unitMinutes: "min",
    unitSections: "sections",
    startSimulation: "Start Simulation →",
    disclaimerCard: "ⓘ Independent AMIRNET prep tool. Not affiliated with NITE. Scores, simulations and predictions are unofficial.",
    backToList: "← Back",
    sectionLabelN: "Section {n}/{total}",
    pilotTag: "● Experimental",
    questionsAnswered: "{a}/{b} answered",
    btnPrev: "← Previous",
    btnNext: "Next →",
    btnNextSection: "Continue to next section →",
    btnFinishSimulation: "Finish Simulation →",
    loadingQuestions: "Loading questions…",
    sectionTypeSentenceCompletion: "Sentence Completion",
    sectionTypeRestatements: "Restatements",
    sectionTypeReading: "Reading Comprehension",
    sectionTypeLectureQuestions: "Lecture / Conversation",
    sectionTypeTextCompletion: "Audio Completion",
    sectionTypeWordFormation: "Word Formation",
    sectionTypeGrammar: "Grammar in Context",
    sectionTypeWritingTask: "Writing Task",
    sectionOrdinalSuffix: " {n}",
    transitionEyebrow: "Section {n}",
    transitionTime: "{m} minutes · Starting in {n}…",
    transitionCta: "Start now →",
    pilotIntroHeading: "🧪 Pilot Section",
    pilotIntroBody: "These are experimental sections. Mistakes won't lower your score. Correct answers may add up to 2 bonus points.",
    pilotIntroContinue: "Continue →",
    reviewTitle: "Answer review",
    reviewBackToResults: "← Back to results",
    reviewQuestionOf: "Question {n} of {total}",
    reviewUnanswered: "• Unanswered",
    reviewCorrect: "✓ Correct",
    reviewWrong: "✗ Wrong",
    reviewExplanation: "Explanation",
    reviewYourAnswer: "Your answer",
    reviewCorrectMark: "Correct answer",
    summaryComplete: "Simulation complete",
    summaryDisclaimer: "This score estimate is unofficial and for practice only. Not affiliated with NITE or MALAM.",
    summaryBreakdownTitle: "Section breakdown",
    summaryPilot: "pilot",
    summaryReviewBtn: "Review answers →",
    summaryPracticeWeaknesses: "Practice weaknesses",
    summaryNewSimulation: "New simulation",
    summaryDashboard: "Dashboard",
  },
  writingTask: {
    topicHeading: "✍️ Writing Topic",
    instructionsTitle: "Instructions:",
    instructionsBody: "Write a clear answer of {min}–{max} words. State your position, give two reasons and an example, and close with a brief summary. Mind grammar, vocabulary and flow.",
    rubricLabel: "Scoring criteria:",
    rubricContentOrg: "Content & organization",
    rubricVocabulary: "Vocabulary",
    rubricGrammar: "Grammar accuracy",
    rubricCoherence: "Coherence",
    rubricTaskRelevance: "Task relevance",
    templateToggleShow: "📋 Show recommended template",
    templateToggleHide: "Hide template",
    templateHeading: "Writing template (practice only)",
    templateInsert: "Insert template into editor",
    placeholderTextarea: "Type your English answer here…",
    wordsLabel: "words",
    wordsMoreNeeded: "{n} more words needed",
    wordsOver: "{n} words over the limit",
    wordsRange: "Range: {min}–{max} words",
    timeoutMessage: "Time is up for this section.",
  },
  sidebar: {
    colorLabel: "Color",
    bgLabel: "Background",
    reset: "Reset",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
  },
  review: {
    title: "Smart Review",
    subtitle: "Review the topics where you need the most improvement",
    noDataTitle: "No data yet",
    noDataBody: "Answer at least 3 questions in any category to see the weakness analysis",
    noDataCta: "Start practicing →",
    perfectTitle: "Great job!",
    perfectBody: "No clear weak spots yet. Keep practicing to maintain your level.",
    perfectCta: "Keep practicing",
    categoriesTitle: "Categories to improve",
    categoriesBadgeTopics: "topics",
    weakVocabTitle: "Weak words",
    practiceLink: "Practice →",
    correctLabel: "correct",
    averagePerQuestion: "avg {n}s per question",
    seeAllWeakWords: "See all weak words →",
    practiceNow: "Practice now →",
    wordTrainer: "Word trainer →",
  },
  dashboard: {
    greeting: "Hello",
    goalProgress: "Daily goal",
    streak: "Day streak",
    weakAreas: "Weak areas",
    vocabDue: "Vocab due today",
    recommended: "Recommended activity",
    noData: "Complete your first session to see data",
    todaysTraining: "Today's training plan",
    itemsLabel: "items",
    progress: "Progress",
    actions: "actions",
    startToday: "Start today's training",
    planVocabToday: "Today's vocabulary",
    planReadingPassage: "Reading Comprehension — full passage",
    planMixed: "Mixed Practice",
    planReasonVocabPending: "{n} pending in total",
    planReasonVocabBuild: "Build up your vocabulary",
    planReasonReading: "5 questions on one multi-paragraph passage",
    planReasonWeak: "{n}% accuracy — needs work",
    planReasonBooster: "Skill booster — weak in {cat}",
    planReasonMixedFirst: "Balanced practice to start",
    planReasonMixedKeepLevel: "Keep your level sharp",
    planBoosterVocabInContext: "Vocabulary in Context",
    planBoosterRestatementMini: "Restatement Mini",
    planBoosterConnectors: "Connectors Practice",
    planBoosterSynonym: "Synonym Recognition",
    planBoosterAcademicPhrase: "Academic Phrases",
    planBoosterSentenceLogic: "Sentence Logic",
    unitWords: "words",
    unitQuestions: "questions",
    statsDailyGoal: "Daily goal",
    statsGoalReached: "Goal reached",
    statsRemainingPct: "{n}% remaining",
    statsDayStreak: "Day streak",
    statsDaysInRow: "days in a row",
    statsEstScore: "Estimated score",
    statsOutOf150: "out of 150",
    statsAccuracy: "Accuracy",
    statsQuestionsUnit: "questions",
    statsTotalQuestions: "Total questions",
    statsCorrectUnit: "correct",
    level1: "Beginner",
    level2: "Learner",
    level3: "Intermediate",
    level4: "Skilled",
    level5: "Expert",
    level6: "Artisan",
    level7: "Master",
    level8: "Champion",
    weakEmptyLineA: "Answer at least 3 questions in any category",
    weakEmptyLineB: "to see your strengths-and-weaknesses analysis",
    weakStartPracticing: "Start practicing",
    weakSeeAll: "See all",
    weakPracticeLink: "Practice",
    weakCorrectOf: "correct",
    catSentenceCompletion: "Sentence Completion",
    catRestatements: "Restatements",
    catReading: "Reading Comprehension",
    catGrammar: "Grammar",
    catWordFormation: "Word Formation",
    catTextCompletion: "Text Completion",
    catLectureQuestions: "Lecture",
    catVocabulary: "Vocabulary",
    catMixed: "Mixed",
    level: "Level",
    daysStreak: "days",
    readinessHeading: "AMIRNET readiness",
    readinessMessageVeryHigh: "Very ready — maintain your level",
    readinessMessageHigh: "On track — shore up your weak spots",
    readinessMessageMid: "Notable progress — still room to grow",
    readinessMessageLow: "Solid base — pick up the training pace",
    readinessMessageVeryLow: "More work to do — practice every day",
    readinessEstimatedScore: "Estimated score",
    readinessUnofficial: "Unofficial · out of 150",
    readinessTarget: "Target",
    readinessFocusAreas: "Focus areas:",
    readinessNoData: "Discover your real level",
    readinessNoDataSub: "15 questions · ~8 minutes · personalized training plan",
    readinessPlacementBtn: "Placement test",
  },
  unknownWords: {
    filterAll: "All",
    filterUnknown: "Unknown",
    filterKnown: "Known",
    empty: "No words saved yet. Highlight a word in any English passage to add it here.",
    source: "Source",
    markKnown: "Know it",
    markUnknown: "Unknown",
    remove: "Remove",
    sourceReading: "reading",
    sourceVocab: "vocab",
    sourcePractice: "practice",
    sourceAcademicPhrase: "academic phrase",
    sourceManual: "manual",
  },
  selectionPopup: {
    addToUnknown: "Add to unknown",
    saved: "Saved",
    markKnown: "Know it",
    close: "Close",
    fallback: "(translation unavailable)",
  },
  common: {
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    settings: "Settings",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    hebrew: "עברית",
    english: "English",
    back: "Back",
    start: "Start",
    finish: "Finish",
    empty: "Nothing here yet",
  },
};
