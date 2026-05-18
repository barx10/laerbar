type Confidence = 1 | 2 | 3;

export interface Translations {
  // App
  appName: string;
  tagline: string;

  // Navbar
  navOm: string;
  navHjelp: string;
  navApi: string;

  // Om-modal
  omTitle: string;
  omDesc: string;
  omAuthorName: string;
  omAuthorDesc: string;

  // Hjelp-modal
  hjelpTitle: string;

  // Settings modal
  settingsTitle: string;
  settingsDesc: string;
  settingsGeminiSection: string;
  settingsKeyLabel: string;
  settingsKeySet: (prefix: string) => string;
  settingsKeyMissing: string;
  settingsRemoveKey: string;
  settingsModelLabel: string;
  settingsSave: string;
  settingsCancel: string;
  settingsBackupTitle: string;
  settingsBackupDesc: string;
  settingsDownloadBackup: string;
  settingsImportBackup: string;
  settingsBackupOk: (n: number) => string;
  settingsNoneNew: (n: number) => string;
  settingsImportOk: (imp: number, skip: number, invalid: number) => string;
  settingsBackupError: string;
  settingsImportError: string;

  // CourseTabs
  tabOversikt: string;
  tabLaer: string;
  tabRepeter: string;
  tabFlashcards: string;
  tabLastNed: string;

  // Common card / grading
  cardQuestion: string;
  cardAnswer: string;
  flipToGrade: string;
  forgot: string;
  uncertain: string;
  remembered: string;
  mastered: string;
  inDays: (n: number) => string;
  nextLaterToday: string;
  nextTomorrow: string;
  nextInDays: (n: number) => string;
  allReviewed: string;

  // LearnTab
  conceptOf: (pos: number, total: number) => string;
  confidenceLabel: string;
  confidenceSubLabel: string;
  confidenceOptions: Array<{ value: Confidence; label: string; hint: string }>;
  answerPlaceholder: string;
  checkBtn: string;
  checkBtnLoading: string;
  confirmMastery: string;
  tryAgain: string;
  goDeeper: string;
  fetchingQuestion: string;
  anchorQuestion: string;
  elaborationPlaceholder: string;
  submitAnswer: string;
  evaluating: string;
  allProven: string;
  allProvenSub: string;
  chatTitle: string;
  chatSubtitle: string;
  chatEmpty: string;
  chatInputPlaceholder: string;
  chatLoading: string;
  sendBtn: string;
  quickCheck: string;
  revealBtn: string;
  answerKey: string;

  // RepetitionTab
  repetitionTitle: string;
  repetitionOf: (pos: number, total: number) => string;
  nothingYet: string;
  nothingYetSub: string;
  allDone: string;
  noneReadyToday: string;
  lapse: (n: number) => string;
  confirmedOf: (n: number, threshold: number) => string;

  // FlashcardsTab
  flashcardsTitle: string;
  flashcardsOf: (pos: number, total: number) => string;
  focusUnmastered: string;
  allConcepts: string;
  prevCard: string;
  nextCard: string;
  noCards: string;

  // OverviewTab
  oversiktLabel: string;
  kortFortalt: string;
  generatingSummary: string;
  summaryError: string;
  statNew: string;
  statReview: string;
  statMastered: string;
  statDueToday: string;
  conceptsHeading: string;
  masteredOf: (n: number, total: number) => string;
  underReviewCount: (n: number) => string;
  confirmedCount: (n: number) => string;

  // DownloadTab
  downloadTitle: string;
  downloadDesc: string;
  downloadBtn: string;

  // UploadZone
  uploadInstruction: string;
  uploadSubtext: string;

  // Upload page
  uploadPageTitle: string;
  uploadPageDesc: string;
  startLearning: string;
  noApiKeyError: string;
  parsingLabel: string;
  uploadGenericError: string;
  uploadQuotaError: string;
  uploadSaveError: string;
  uploadApiError: string;

  // Course page
  backHome: string;

  // Home page
  yourCourses: string;
  noCourses: string;
  courseCount: (n: number) => string;
  newCourse: string;
  uploadFirst: string;
  uploadFirstDesc: string;
  deleteCourse: string;
  dailySession: string;
  dueCount: (n: number) => string;
  mixedSession: string;
  startSession: string;
  newCardsDueLater: string;
  masteredLabel: (m: number, t: number) => string;
  underReviewShort: (n: number) => string;

  // Today page
  todayTitle: string;
  todaySubtitle: string;
  backToOverview: string;
  noCardsToday: string;
  noCardsMasterFirst: string;
  todayComplete: string;
  reviewedCards: (n: number) => string;
  doneBtn: string;
  backBtn: string;
  fromCourse: string;
  justMastered: (title: string) => string;

  // LearningCurve
  learningCurveLabel: string;
  lastWeeks: (n: number) => string;
  noMasteredYet: string;
  conceptsMastered: (n: number) => string;
  thisWeek: (n: number) => string;

  // StudyHeatmap
  studyActivityLabel: string;
  streakDays: (n: number) => string;
  streakKeepGoing: string;
  noStreak: string;
  heatmapRegistrations: (n: number) => string;
  weekdayLabels: string[];
}

export const no: Translations = {
  appName: "Lærbar",
  tagline: "Bevis at du kan det",

  navOm: "Om",
  navHjelp: "Hjelp",
  navApi: "API",

  omTitle: "Om Lærbar",
  omDesc:
    "Lærbar er et digitalt verktøy som bruker KI til å gjøre fagstoff om til interaktive læringsløp. Last opp en PDF, og bevis at du kan kjernekonseptene gjennom aktiv gjenkalling og umiddelbar tilbakemelding.",
  omAuthorName: "Kenneth Bareksten",
  omAuthorDesc:
    "Lærer og hobbyprogrammerer som lager digitale verktøy for å gjøre hverdagen litt enklere og mer kreativ.",

  hjelpTitle: "Slik bruker du Lærbar",

  settingsTitle: "Innstillinger",
  settingsDesc:
    "Legg inn din Google Gemini API-nøkkel. Nøkkelen lagres kun lokalt i nettleseren din.",
  settingsGeminiSection: "Google Gemini",
  settingsKeyLabel: "API-nøkkel",
  settingsKeySet: (p) => `Nøkkel lagret (${p}...)`,
  settingsKeyMissing: "Ingen nøkkel lagret",
  settingsRemoveKey: "Fjern nøkkel",
  settingsModelLabel: "Modell",
  settingsSave: "Lagre",
  settingsCancel: "Avbryt",
  settingsBackupTitle: "Sikkerhetskopi",
  settingsBackupDesc:
    "Alle kurs lagres kun i nettleseren din. Last ned en backup jevnlig — hvis du tømmer nettleser-data uten backup, mister du alt.",
  settingsDownloadBackup: "↓ Last ned backup",
  settingsImportBackup: "↑ Importer backup",
  settingsBackupOk: (n) => `${n} kurs lastet ned.`,
  settingsNoneNew: (n) => `Ingen nye kurs (${n} fantes allerede).`,
  settingsImportOk: (imp, skip, invalid) => {
    const parts = [`Importerte ${imp} ${imp === 1 ? "kurs" : "kurs"}`];
    if (skip > 0) parts.push(`hoppet over ${skip} ${skip === 1 ? "duplikat" : "duplikater"}`);
    if (invalid > 0) parts.push(`${invalid} ${invalid === 1 ? "ugyldig oppføring" : "ugyldige oppføringer"} hoppet over`);
    return parts.join(", ") + ".";
  },
  settingsBackupError: "Kunne ikke lage backup.",
  settingsImportError: "Ugyldig backup-fil.",

  tabOversikt: "Oversikt",
  tabLaer: "Lær",
  tabRepeter: "Repeter",
  tabFlashcards: "Flashcards",
  tabLastNed: "Last ned",

  cardQuestion: "Spørsmål · klikk for å snu",
  cardAnswer: "Svar · klikk for å snu",
  flipToGrade: "Snu kortet for å vurdere",
  forgot: "Husket ikke",
  uncertain: "Usikkert",
  remembered: "Kunne det",
  mastered: "Mestret",
  inDays: (n) => `om ${n} ${n === 1 ? "dag" : "dager"}`,
  nextLaterToday: "Neste kort blir klart senere i dag.",
  nextTomorrow: "Neste kort er klart i morgen.",
  nextInDays: (n) => `Neste kort er klart om ${n} dager.`,
  allReviewed: "Alle kort er repetert.",

  conceptOf: (pos, total) => `Konsept ${pos} av ${total}`,
  confidenceLabel: "Før du sjekker: hvor trygg føler du deg på svaret ditt?",
  confidenceSubLabel:
    "Tren deg på å forutse hvordan du ligger an — AI-en tar det med i vurderingen og sier om du traff på din egen selvvurdering.",
  confidenceOptions: [
    { value: 1, label: "Usikker", hint: "Gjetter mer enn jeg kan" },
    { value: 2, label: "Delvis", hint: "Kan noe, er litt usikker" },
    { value: 3, label: "Trygg", hint: "Kan dette godt" },
  ],
  answerPlaceholder: "Skriv svaret ditt her…",
  checkBtn: "Sjekk svaret",
  checkBtnLoading: "Evaluerer…",
  confirmMastery: "✓ Bevist — til repetisjon",
  tryAgain: "↻ Prøv igjen",
  goDeeper: "🧠 Gå dypere",
  fetchingQuestion: "Henter spørsmål…",
  anchorQuestion: "Forankringsspørsmål",
  elaborationPlaceholder: "Svar fritt — dette er kun for å forankre, ikke for poeng…",
  submitAnswer: "Send svar",
  evaluating: "Vurderer…",
  allProven: "Alle konsepter er bevist!",
  allProvenSub: "Nå står de i repetisjonskøen. Gå til Repeter for å bekrefte mestringen.",
  chatTitle: "Spør AI-en",
  chatSubtitle: "Om konseptet eller noe fra artikkelen.",
  chatEmpty:
    "Trenger du et hint, vil teste forståelsen din, eller lure på en detalj fra teksten? Spør her.",
  chatInputPlaceholder: "Hint, tanke eller spørsmål…",
  chatLoading: "AI skriver…",
  sendBtn: "Send",
  quickCheck: "Hurtigsjekk",
  revealBtn: "Vis svar",
  answerKey: "Fasit",

  repetitionTitle: "Repetisjon",
  repetitionOf: (pos, total) => `${pos} av ${total} klar i dag`,
  nothingYet: "Ingenting å repetere ennå",
  nothingYetSub: "Bevis først at du kan konseptene i Lær-fanen. Derfra legger de seg inn til repetisjon.",
  allDone: "Dagens repetisjon fullført!",
  noneReadyToday: "Ingen kort klar i dag",
  lapse: (n) => `${n} ${n === 1 ? "bom" : "bommer"}`,
  confirmedOf: (n, t) => `${n}/${t} bekreftet`,

  flashcardsTitle: "Flashcards",
  flashcardsOf: (pos, total) => `${pos} av ${total}`,
  focusUnmastered: "Fokus på umestrerte konsepter",
  allConcepts: "Alle konsepter",
  prevCard: "← Forrige",
  nextCard: "Neste →",
  noCards: "Ingen flashcards tilgjengelig.",

  oversiktLabel: "Oversikt",
  kortFortalt: "Kort fortalt",
  generatingSummary: "Genererer sammendrag…",
  summaryError: "Klarte ikke å lage sammendrag akkurat nå. Prøv igjen senere.",
  statNew: "Nye",
  statReview: "Under repetisjon",
  statMastered: "Mestret",
  statDueToday: "Klar i dag",
  conceptsHeading: "Kjernekonsepter",
  masteredOf: (n, total) => `${n} av ${total} mestret`,
  underReviewCount: (n) => ` · ${n} under repetisjon`,
  confirmedCount: (n) => `${n}/2 bekreftet`,

  downloadTitle: "Last ned",
  downloadDesc:
    "Last ned kurset som en selvinneholdt HTML-fil du kan åpne offline. Inneholder alle konsepter, spørsmål, svar og flashcards.",
  downloadBtn: "Last ned HTML",

  uploadInstruction: "Klikk eller dra hit · PDF (maks 12MB)",
  uploadSubtext: "Kun tekst leses — illustrasjoner analyseres ikke",

  uploadPageTitle: "Ta et læringsløp",
  uploadPageDesc: "Last opp en PDF, og AI trekker ut kjernekonseptene du må bevise at du kan.",
  startLearning: "Start læringsløp",
  noApiKeyError: "Legg inn API-nøkkel under API-innstillinger først.",
  parsingLabel: "Analyserer fagstoffet og finner kjernekonsepter…",
  uploadGenericError: "Noe gikk galt. Prøv igjen.",
  uploadQuotaError:
    "Nettleseren har ikke plass til flere kurs. Slett et gammelt kurs og prøv igjen.",
  uploadSaveError: "Klarte ikke å lagre kurset. Prøv igjen.",
  uploadApiError: "Noe gikk galt. Sjekk API-nøkkelen og prøv igjen.",

  backHome: "← Forsiden",
  yourCourses: "Dine kurs",
  noCourses: "Ingen kurs ennå",
  courseCount: (n) => `${n} kurs lagret`,
  newCourse: "+ Nytt kurs",
  uploadFirst: "Last opp ditt første fagstoff",
  uploadFirstDesc: "Last opp en PDF, og AI trekker ut kjernekonseptene du må bevise at du kan.",
  deleteCourse: "Slett kurs",
  dailySession: "Dagens økt",
  dueCount: (n) => `${n} kort klar${n === 1 ? "t" : "e"} i dag`,
  mixedSession: "Blandet økt på tvers av alle kursene dine.",
  startSession: "Start økt →",
  newCardsDueLater: "Nye kort forfaller senere i dag.",
  masteredLabel: (m, total) => `${m}/${total} mestret`,
  underReviewShort: (n) => ` · ${n} under repetisjon`,

  todayTitle: "Dagens økt",
  todaySubtitle: "Blandet repetisjon på tvers av alle kursene dine",
  backToOverview: "← Tilbake til oversikt",
  noCardsToday: "Ingen kort klare i dag",
  noCardsMasterFirst:
    "Mester først noen konsepter i Lær-fanen, så dukker de opp her.",
  todayComplete: "Dagens økt fullført",
  reviewedCards: (n) => `Du gikk gjennom ${n} kort.`,
  doneBtn: "Ferdig",
  backBtn: "Til oversikten",
  fromCourse: "Fra kurs",
  justMastered: (title) => `✓ «${title}» er nå mestret`,

  learningCurveLabel: "Læringskurve",
  lastWeeks: (n) => `Siste ${n} uker`,
  noMasteredYet: "Ingen konsepter mestret enda. Mestre ditt første i Lær-fanen.",
  conceptsMastered: (n) => `${n === 1 ? "konsept mestret" : "konsepter mestret"}`,
  thisWeek: (n) => ` · +${n} denne uka`,

  studyActivityLabel: "Studieaktivitet",
  streakDays: (n) => `${n} ${n === 1 ? "dag på rad" : "dager på rad"}`,
  streakKeepGoing: " (studér i dag for å holde den)",
  noStreak: "Ingen aktiv streak. Svar på ett kort for å starte.",
  heatmapRegistrations: (n) => `${n} ${n === 1 ? "registrering" : "registreringer"}`,
  weekdayLabels: ["M", "T", "O", "T", "F", "L", "S"],
};

export const en: Translations = {
  appName: "Lærbar",
  tagline: "Prove that you know it",

  navOm: "About",
  navHjelp: "Help",
  navApi: "API",

  omTitle: "About Lærbar",
  omDesc:
    "Lærbar is a digital tool that uses AI to turn study material into interactive learning paths. Upload a PDF and prove you know the core concepts through active recall and immediate feedback.",
  omAuthorName: "Kenneth Bareksten",
  omAuthorDesc:
    "Teacher and hobbyist developer building digital tools to make everyday life a little easier and more creative.",

  hjelpTitle: "How to use Lærbar",

  settingsTitle: "Settings",
  settingsDesc:
    "Enter your Google Gemini API key. The key is stored locally in your browser only.",
  settingsGeminiSection: "Google Gemini",
  settingsKeyLabel: "API key",
  settingsKeySet: (p) => `Key saved (${p}...)`,
  settingsKeyMissing: "No key saved",
  settingsRemoveKey: "Remove key",
  settingsModelLabel: "Model",
  settingsSave: "Save",
  settingsCancel: "Cancel",
  settingsBackupTitle: "Backup",
  settingsBackupDesc:
    "All courses are stored in your browser only. Download a backup regularly — if you clear browser data without a backup, everything is lost.",
  settingsDownloadBackup: "↓ Download backup",
  settingsImportBackup: "↑ Import backup",
  settingsBackupOk: (n) => `${n} ${n === 1 ? "course" : "courses"} downloaded.`,
  settingsNoneNew: (n) => `No new courses (${n} already existed).`,
  settingsImportOk: (imp, skip, invalid) => {
    const parts = [`Imported ${imp} ${imp === 1 ? "course" : "courses"}`];
    if (skip > 0) parts.push(`skipped ${skip} ${skip === 1 ? "duplicate" : "duplicates"}`);
    if (invalid > 0) parts.push(`${invalid} invalid ${invalid === 1 ? "entry" : "entries"} skipped`);
    return parts.join(", ") + ".";
  },
  settingsBackupError: "Could not create backup.",
  settingsImportError: "Invalid backup file.",

  tabOversikt: "Overview",
  tabLaer: "Learn",
  tabRepeter: "Review",
  tabFlashcards: "Flashcards",
  tabLastNed: "Download",

  cardQuestion: "Question · click to flip",
  cardAnswer: "Answer · click to flip",
  flipToGrade: "Flip the card to grade",
  forgot: "Forgot",
  uncertain: "Uncertain",
  remembered: "Got it",
  mastered: "Mastered",
  inDays: (n) => `in ${n} ${n === 1 ? "day" : "days"}`,
  nextLaterToday: "Next card is due later today.",
  nextTomorrow: "Next card is due tomorrow.",
  nextInDays: (n) => `Next card is due in ${n} days.`,
  allReviewed: "All cards reviewed.",

  conceptOf: (pos, total) => `Concept ${pos} of ${total}`,
  confidenceLabel: "Before you check: how confident do you feel about your answer?",
  confidenceSubLabel:
    "Train yourself to predict how you are doing — the AI takes it into account and tells you whether you were well calibrated.",
  confidenceOptions: [
    { value: 1, label: "Unsure", hint: "Guessing more than I know" },
    { value: 2, label: "Partial", hint: "Know something, a bit uncertain" },
    { value: 3, label: "Confident", hint: "Know this well" },
  ],
  answerPlaceholder: "Write your answer here…",
  checkBtn: "Check answer",
  checkBtnLoading: "Evaluating…",
  confirmMastery: "✓ Proved — add to review",
  tryAgain: "↻ Try again",
  goDeeper: "🧠 Go deeper",
  fetchingQuestion: "Fetching question…",
  anchorQuestion: "Elaboration question",
  elaborationPlaceholder: "Answer freely — this is only for deeper understanding, not scored…",
  submitAnswer: "Submit answer",
  evaluating: "Evaluating…",
  allProven: "All concepts proved!",
  allProvenSub: "They are now in the review queue. Go to Review to confirm mastery.",
  chatTitle: "Ask the AI",
  chatSubtitle: "About the concept or something from the article.",
  chatEmpty:
    "Need a hint, want to test your understanding, or curious about a detail from the text? Ask here.",
  chatInputPlaceholder: "Hint, thought, or question…",
  chatLoading: "AI is writing…",
  sendBtn: "Send",
  quickCheck: "Quick check",
  revealBtn: "Show answer",
  answerKey: "Answer key",

  repetitionTitle: "Review",
  repetitionOf: (pos, total) => `${pos} of ${total} ready today`,
  nothingYet: "Nothing to review yet",
  nothingYetSub:
    "First prove you know the concepts in the Learn tab. From there they enter the review queue.",
  allDone: "Today's review complete!",
  noneReadyToday: "No cards ready today",
  lapse: (n) => `${n} ${n === 1 ? "lapse" : "lapses"}`,
  confirmedOf: (n, t) => `${n}/${t} confirmed`,

  flashcardsTitle: "Flashcards",
  flashcardsOf: (pos, total) => `${pos} of ${total}`,
  focusUnmastered: "Focus on unmastered concepts",
  allConcepts: "All concepts",
  prevCard: "← Previous",
  nextCard: "Next →",
  noCards: "No flashcards available.",

  oversiktLabel: "Overview",
  kortFortalt: "In brief",
  generatingSummary: "Generating summary…",
  summaryError: "Could not generate summary right now. Try again later.",
  statNew: "New",
  statReview: "In review",
  statMastered: "Mastered",
  statDueToday: "Due today",
  conceptsHeading: "Core concepts",
  masteredOf: (n, total) => `${n} of ${total} mastered`,
  underReviewCount: (n) => ` · ${n} in review`,
  confirmedCount: (n) => `${n}/2 confirmed`,

  downloadTitle: "Download",
  downloadDesc:
    "Download the course as a self-contained HTML file you can open offline. Includes all concepts, questions, answers, and flashcards.",
  downloadBtn: "Download HTML",

  uploadInstruction: "Click or drag here · PDF (max 12MB)",
  uploadSubtext: "Only text is read — illustrations are not analysed",

  uploadPageTitle: "Start a learning path",
  uploadPageDesc: "Upload a PDF and the AI extracts the core concepts you must prove you know.",
  startLearning: "Start learning path",
  noApiKeyError: "Add an API key in API settings first.",
  parsingLabel: "Analysing the material and finding core concepts…",
  uploadGenericError: "Something went wrong. Please try again.",
  uploadQuotaError:
    "Your browser is out of storage space. Delete an old course and try again.",
  uploadSaveError: "Could not save the course. Please try again.",
  uploadApiError: "Something went wrong. Check your API key and try again.",

  backHome: "← Home",
  yourCourses: "Your courses",
  noCourses: "No courses yet",
  courseCount: (n) => `${n} ${n === 1 ? "course" : "courses"} saved`,
  newCourse: "+ New course",
  uploadFirst: "Upload your first study material",
  uploadFirstDesc: "Upload a PDF and the AI extracts the core concepts you must prove you know.",
  deleteCourse: "Delete course",
  dailySession: "Today's session",
  dueCount: (n) => `${n} ${n === 1 ? "card" : "cards"} ready today`,
  mixedSession: "Mixed session across all your courses.",
  startSession: "Start session →",
  newCardsDueLater: "New cards are due later today.",
  masteredLabel: (m, total) => `${m}/${total} mastered`,
  underReviewShort: (n) => ` · ${n} in review`,

  todayTitle: "Today's session",
  todaySubtitle: "Mixed review across all your courses",
  backToOverview: "← Back to overview",
  noCardsToday: "No cards ready today",
  noCardsMasterFirst: "First master some concepts in the Learn tab and they will appear here.",
  todayComplete: "Today's session complete",
  reviewedCards: (n) => `You reviewed ${n} ${n === 1 ? "card" : "cards"}.`,
  doneBtn: "Done",
  backBtn: "To overview",
  fromCourse: "From course",
  justMastered: (title) => `✓ "${title}" is now mastered`,

  learningCurveLabel: "Learning curve",
  lastWeeks: (n) => `Last ${n} weeks`,
  noMasteredYet: "No concepts mastered yet. Master your first in the Learn tab.",
  conceptsMastered: (n) => `${n === 1 ? "concept mastered" : "concepts mastered"}`,
  thisWeek: (n) => ` · +${n} this week`,

  studyActivityLabel: "Study activity",
  streakDays: (n) => `${n} ${n === 1 ? "day in a row" : "days in a row"}`,
  streakKeepGoing: " (study today to keep it)",
  noStreak: "No active streak. Answer one card to start.",
  heatmapRegistrations: (n) => `${n} ${n === 1 ? "entry" : "entries"}`,
  weekdayLabels: ["M", "T", "W", "T", "F", "S", "S"],
};
