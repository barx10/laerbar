# Language Toggle (NO/EN) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a NO|EN toggle to the Navbar that switches the entire UI and all AI responses between Norwegian and English.

**Architecture:** Lightweight custom i18n — a typed `Translations` interface in `lib/i18n.ts`, a `LanguageProvider` in `lib/language-context.tsx` wrapping the app, `useLanguage()` hook in all components, and `X-Language` header on every AI fetch. No external libraries.

**Tech Stack:** React Context, localStorage, Next.js App Router, TypeScript.

---

### Task 1: Create `lib/i18n.ts` — full translation dictionaries

**Files:**
- Create: `lib/i18n.ts`

**Step 1: Write the file**

```ts
// lib/i18n.ts
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
  settingsImportOk: (imp: number, skip: number) => string;
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
  settingsImportOk: (imp, skip) =>
    `Importerte ${imp} kurs. Hoppet over ${skip} duplikater.`,
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

  uploadInstruction: "Klikk eller dra hit · PDF (maks 20MB)",
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
  settingsNoneNew: (n) =>
    `No new courses (${n} ${n === 1 ? "already existed" : "already existed"}).`,
  settingsImportOk: (imp, skip) =>
    `Imported ${imp} ${imp === 1 ? "course" : "courses"}. Skipped ${skip} ${skip === 1 ? "duplicate" : "duplicates"}.`,
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

  uploadInstruction: "Click or drag here · PDF (max 20MB)",
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
```

**Step 2: Verify TypeScript compiles**

```bash
cd /Users/kennethbareksten/Koding/e-learning && npx tsc --noEmit
```
Expected: no errors (file is self-contained, no imports yet).

**Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add NO/EN translation dictionaries"
```

---

### Task 2: Create `lib/language-context.tsx`

**Files:**
- Create: `lib/language-context.tsx`

**Step 1: Write the file**

```tsx
// lib/language-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { no, en, type Translations } from "./i18n";

type Lang = "no" | "en";

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}>({ lang: "no", setLang: () => {}, t: no });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("no");

  useEffect(() => {
    const stored = localStorage.getItem("laerbar_lang") as Lang | null;
    if (stored === "en" || stored === "no") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    localStorage.setItem("laerbar_lang", l);
    setLangState(l);
    document.documentElement.lang = l;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: lang === "en" ? en : no }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
```

**Step 2: Wrap app in `app/layout.tsx`**

Modify `app/layout.tsx`:
- Add import: `import { LanguageProvider } from "@/lib/language-context";`
- Remove `lang="no"` from `<html>` (the provider sets it dynamically via `document.documentElement.lang`)
- Keep `lang="no"` as the initial SSR value, the provider updates it client-side
- Wrap `{children}` inside `<LanguageProvider>`:

```tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no" className={`${playfair.variable} ${outfit.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
```

**Step 3: Verify**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add lib/language-context.tsx app/layout.tsx
git commit -m "feat: add LanguageProvider and wrap app layout"
```

---

### Task 3: Update Navbar — toggle + translations

**Files:**
- Modify: `components/shared/Navbar.tsx`

**Step 1: Add imports and define help/om content per language**

At the top of the file, after existing imports, add:

```tsx
import { useLanguage } from "@/lib/language-context";
```

**Step 2: Replace Navbar body**

The Om-modal and Hjelp-modal have long JSX content. Define them inline using `lang`. Replace the entire `Navbar` function with the version below. Key changes:
- Add `const { lang, setLang, t } = useLanguage();`
- Add `NO | EN` toggle buttons between "Hjelp" and "API"
- All hardcoded strings replaced with `t.*`
- Om-modal body and Hjelp-modal steps use `lang === "en"` branches

```tsx
export default function Navbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [omOpen, setOmOpen] = useState(false);
  const [hjelpOpen, setHjelpOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  return (
    <>
      <header className="bg-dg text-cream px-6 py-5 flex justify-between items-end border-b-[3px] border-gold">
        <div>
          <h1 className="font-heading text-2xl leading-tight">{t.appName}</h1>
          <div className="text-xs text-gl mt-1 opacity-85">{t.tagline}</div>
        </div>
        <div className="flex gap-2.5 items-center">
          {/* Language toggle */}
          <div className="flex border border-white/30 rounded overflow-hidden text-xs font-medium">
            <button
              onClick={() => setLang("no")}
              className={`px-2.5 py-1.5 transition-all ${
                lang === "no"
                  ? "bg-gold text-dg"
                  : "text-cream/80 hover:text-gold"
              }`}
            >
              NO
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1.5 transition-all border-l border-white/30 ${
                lang === "en"
                  ? "bg-gold text-dg"
                  : "text-cream/80 hover:text-gold"
              }`}
            >
              EN
            </button>
          </div>
          <button
            onClick={() => setOmOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            {t.navOm}
          </button>
          <button
            onClick={() => setHjelpOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            {t.navHjelp}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-cream/80 border border-white/30 rounded px-4 py-1.5 text-xs font-medium hover:border-gold hover:text-gold transition-all"
          >
            {t.navApi}
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Om-modal */}
      {omOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setOmOpen(false)}
        >
          <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setOmOpen(false)} className="absolute top-3 right-3.5 text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            <div className="mb-5">
              <Image src="/laererliv-logo.png" alt="Lærerliv" width={160} height={60} className="object-contain" />
            </div>
            <h2 className="font-heading text-xl text-dg mb-3">{t.omTitle}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">{t.omDesc}</p>
            <div className="border-t border-black/8 pt-4 mb-5">
              <p className="text-sm font-semibold text-dg mb-1">{t.omAuthorName}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{t.omAuthorDesc}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <a href="https://www.laererliv.no" target="_blank" rel="noopener noreferrer" className="text-dg hover:text-gold transition-colors underline underline-offset-2">www.laererliv.no</a>
              <a href="mailto:kenneth@laererliv.no" className="text-dg hover:text-gold transition-colors underline underline-offset-2">kenneth@laererliv.no</a>
            </div>
          </div>
        </div>
      )}

      {/* Hjelp-modal */}
      {hjelpOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setHjelpOpen(false)}
        >
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setHjelpOpen(false)} className="absolute top-3 right-3.5 text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            <h2 className="font-heading text-xl text-dg mb-5">{t.hjelpTitle}</h2>
            <div className="flex flex-col gap-5">
              {lang === "en" ? <HelpStepsEn /> : <HelpStepsNo />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 3: Add `HelpStepsNo` and `HelpStepsEn` components at the bottom of the file**

Replace the existing `Step` helper and add both:

```tsx
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-dg text-cream flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">{n}</span>
      <div>
        <p className="font-heading text-sm text-dg mb-1">{title}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function HelpStepsNo() {
  return (
    <>
      <Step n={1} title="Sett inn API-nøkkel">Trykk <strong>API</strong> øverst til høyre. Lim inn din Google Gemini API-nøkkel — den lagres kun lokalt i nettleseren. Nøkkelen får du gratis på <span className="text-dg font-medium">aistudio.google.com</span>.</Step>
      <Step n={2} title="Last opp fagstoff">Trykk <strong>Nytt kurs</strong> og dra inn en PDF (maks 20 MB). KI trekker ut 5–10 kjernekonsepter og lagrer samtidig teksten så du senere kan spørre AI-en direkte om artikkelen.</Step>
      <Step n={3} title="Lær: vurder selv før du sjekker">I <strong>Lær</strong>-fanen får du ett åpent spørsmål om gangen. Før du sender svaret, velger du hvor trygg du er: <em>Usikker / Delvis / Trygg</em>. AI-en tar selvvurderingen med i tilbakemeldingen og sier om du traff.</Step>
      <Step n={4} title="Mestret krever to bekreftelser">Et konsept regnes som mestret først etter <strong>to</strong> vellykkede gjenkallinger — første i Lær, andre etter minst én dag i Repeter.</Step>
      <Step n={5} title="Dagens kø på forsiden">Når kort forfaller viser forsiden en <strong>Dagens økt</strong>-knapp. Den blander kort på tvers av alle kurs (interleaving) og prioriterer kort du har bommet på før.</Step>
      <Step n={6} title="Smart spacing i Repeter">Hvert kort har en egen læringskurve. Svarer du <em>Kunne det</em> konsistent, vokser intervallet raskt (3 → 6 → 17 dager …). Svarer du <em>Husket ikke</em>, krymper det ned igjen.</Step>
      <Step n={7} title="Spør AI-en — to varianter">I <strong>Lær</strong>: <em>Usikker? Spør AI-en</em> gir deg hint uten å røpe svaret. I <strong>Oversikt</strong>: <em>Spør om kurset</em> svarer på frie spørsmål om selve artikkelen.</Step>
      <Step n={8} title="Sikkerhetskopi og offline">Alt ligger i nettleseren din, så ta jevnlig <strong>Last ned sikkerhetskopi</strong> under API-menyen. Et helt kurs kan også eksporteres som selvinneholdt HTML fra <strong>Last ned</strong>-fanen.</Step>
    </>
  );
}

function HelpStepsEn() {
  return (
    <>
      <Step n={1} title="Add your API key">Click <strong>API</strong> in the top right. Paste your Google Gemini API key — it is stored locally in your browser only. Get the key for free at <span className="text-dg font-medium">aistudio.google.com</span>.</Step>
      <Step n={2} title="Upload study material">Click <strong>New course</strong> and drop in a PDF (max 20 MB). The AI extracts 5–10 core concepts and saves the text so you can later chat with the AI directly about the article.</Step>
      <Step n={3} title="Learn: rate yourself before checking">In the <strong>Learn</strong> tab you get one open question at a time. Before submitting your answer, choose your confidence: <em>Unsure / Partial / Confident</em>. The AI factors this in and tells you whether you were well calibrated.</Step>
      <Step n={4} title="Mastered requires two confirmations">A concept is only considered mastered after <strong>two</strong> successful recalls — first in Learn, then after at least one day in Review.</Step>
      <Step n={5} title="Today's queue on the home screen">When cards are due, the home screen shows a <strong>Today's session</strong> button. It mixes cards across all courses (interleaving) and prioritises cards you have missed before.</Step>
      <Step n={6} title="Smart spacing in Review">Each card has its own learning curve. Answer <em>Got it</em> consistently and the interval grows quickly (3 → 6 → 17 days…). Answer <em>Forgot</em> and it resets.</Step>
      <Step n={7} title="Ask the AI — two modes">In <strong>Learn</strong>: the chat sidebar gives hints without revealing the answer. In <strong>Overview</strong>: ask free questions about the article itself based on the stored text.</Step>
      <Step n={8} title="Backup and offline">Everything is in your browser, so regularly download a backup from the API menu. A full course can also be exported as a self-contained HTML file from the <strong>Download</strong> tab.</Step>
    </>
  );
}
```

**Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add components/shared/Navbar.tsx
git commit -m "feat: language toggle in navbar + translated navbar strings"
```

---

### Task 4: Update SettingsModal

**Files:**
- Modify: `components/shared/SettingsModal.tsx`

**Step 1: Add import**

```tsx
import { useLanguage } from "@/lib/language-context";
```

**Step 2: Add hook call inside component**

```tsx
const { t } = useLanguage();
```

**Step 3: Replace all hardcoded strings**

| Old string | New |
|---|---|
| `"Innstillinger"` | `t.settingsTitle` |
| `"Legg inn din Google Gemini..."` | `t.settingsDesc` |
| `"Google Gemini"` | `t.settingsGeminiSection` |
| `` `Nøkkel lagret (${...}...)` `` | `t.settingsKeySet(apiKey.slice(0,6))` |
| `"Ingen nøkkel lagret"` | `t.settingsKeyMissing` |
| `"API-nøkkel"` | `t.settingsKeyLabel` |
| `title="Fjern nøkkel"` | `title={t.settingsRemoveKey}` |
| `"Modell"` | `t.settingsModelLabel` |
| `"Lagre"` | `t.settingsSave` |
| `"Avbryt"` | `t.settingsCancel` |
| `"Sikkerhetskopi"` | `t.settingsBackupTitle` |
| `"Alle kurs lagres kun..."` | `t.settingsBackupDesc` |
| `"↓ Last ned backup"` | `t.settingsDownloadBackup` |
| `"↑ Importer backup"` | `t.settingsImportBackup` |

In `downloadBackup()`, replace:
```tsx
setBackupMsg({ kind: "ok", text: `${count} kurs lastet ned.` });
// and
setBackupMsg({ kind: "err", text: "Kunne ikke lage backup." });
```
with:
```tsx
setBackupMsg({ kind: "ok", text: t.settingsBackupOk(count) });
// and
setBackupMsg({ kind: "err", text: t.settingsBackupError });
```

In `handleImport()`, replace the result messages:
```tsx
text: result.imported === 0 && result.skipped > 0
  ? t.settingsNoneNew(result.skipped)
  : t.settingsImportOk(result.imported, result.skipped),
// and error:
text: err instanceof Error ? err.message : t.settingsImportError,
```

**Step 4: Commit**

```bash
git add components/shared/SettingsModal.tsx
git commit -m "feat: translate SettingsModal"
```

---

### Task 5: Update CourseTabs

**Files:**
- Modify: `components/course/CourseTabs.tsx`

**Step 1: Add import and hook**

```tsx
import { useLanguage } from "@/lib/language-context";
// inside CourseTabs:
const { t } = useLanguage();
```

**Step 2: Replace the `TABS` constant**

Remove the top-level `TABS` constant. Instead, derive tab labels from `t` inside the component:

```tsx
const TABS = [
  { id: "oversikt" as const, label: t.tabOversikt },
  { id: "laer" as const, label: t.tabLaer },
  { id: "repeter" as const, label: t.tabRepeter },
  { id: "flashcards" as const, label: t.tabFlashcards },
  { id: "last-ned" as const, label: t.tabLastNed },
];
```

Keep `type TabId` as is (it derives from the `id` values which don't change).

**Step 3: Commit**

```bash
git add components/course/CourseTabs.tsx
git commit -m "feat: translate CourseTabs"
```

---

### Task 6: Update LearnTab — translations + fetch headers

**Files:**
- Modify: `components/course/LearnTab.tsx`

**Step 1: Add import and hook**

```tsx
import { useLanguage } from "@/lib/language-context";
// inside LearnTab:
const { lang, t } = useLanguage();
```

**Step 2: Remove the top-level `CONFIDENCE_OPTIONS` constant**

Delete the const at the top of the file. Use `t.confidenceOptions` in the JSX instead.

**Step 3: Add `X-Language` header to all four fetch calls**

In `evaluate()`:
```tsx
headers: {
  "Content-Type": "application/json",
  "X-API-Key": apiKey,
  "X-Model": model,
  "X-Language": lang,
},
```

Apply the same change to `startElaboration()`, `submitElaboration()`, and `sendChat()`.

In `generateVariants()` (the standalone function that takes `concept` and `onConceptUpdate`), add `lang` as a third parameter and pass it through to the fetch. Update the call site in `confirmMastery()` to pass `lang`:
```tsx
void generateVariants(withFirstPass, onConceptUpdate, lang);
```

**Step 4: Replace all hardcoded strings in JSX**

Use this mapping:

| Old | New |
|---|---|
| `"Konsept {pos} av {total}"` | `t.conceptOf(positionLabel, totalCount)` — remove the separate `positionLabel` div text |
| `"Alle konsepter er bevist!"` | `t.allProven` |
| `"Nå står de i repetisjonskøen..."` | `t.allProvenSub` |
| `"Før du sjekker: hvor trygg..."` | `t.confidenceLabel` |
| `"Tren deg på å forutse..."` | `t.confidenceSubLabel` |
| `{opt.label}` / `{opt.hint}` | from `t.confidenceOptions` (replace `CONFIDENCE_OPTIONS.map` with `t.confidenceOptions.map`) |
| `placeholder="Skriv svaret ditt her…"` | `placeholder={t.answerPlaceholder}` |
| `title={!confidence ? "Velg tiltro først" : undefined}` | remove (omit) |
| `"Evaluerer…"` / `"Sjekk svaret"` | `loading ? t.checkBtnLoading : t.checkBtn` |
| `"✓ Bevist — til repetisjon"` | `t.confirmMastery` |
| `"↻ Prøv igjen"` | `t.tryAgain` |
| `elaborationLoading ? "Henter spørsmål…" : "🧠 Gå dypere"` | `elaborationLoading ? t.fetchingQuestion : t.goDeeper` |
| `"Forankringsspørsmål"` | `t.anchorQuestion` |
| `placeholder="Svar fritt…"` | `placeholder={t.elaborationPlaceholder}` |
| `elaborationFeedbackLoading ? "Vurderer…" : "Send svar"` | `elaborationFeedbackLoading ? t.evaluating : t.submitAnswer` |
| `"Spør AI-en"` | `t.chatTitle` |
| `"Om konseptet eller noe fra artikkelen."` | `t.chatSubtitle` |
| `"Trenger du et hint..."` | `t.chatEmpty` |
| `placeholder="Hint, tanke eller spørsmål…"` | `placeholder={t.chatInputPlaceholder}` |
| `"AI skriver…"` | `t.chatLoading` |
| `"Send"` | `t.sendBtn` |

In `HurtigsjekCard`:
- Add `const { t } = useLanguage();` inside the component
- `"Hurtigsjekk"` → `t.quickCheck`
- `"Vis svar"` → `t.revealBtn`
- `"Fasit"` → `t.answerKey`
- `"Husket ikke"` → `t.forgot`
- `"Usikkert"` → `t.uncertain`
- `"Kunne det"` → `t.remembered`

**Step 5: Commit**

```bash
git add components/course/LearnTab.tsx
git commit -m "feat: translate LearnTab + add X-Language to AI fetches"
```

---

### Task 7: Update RepetitionTab

**Files:**
- Modify: `components/course/RepetitionTab.tsx`

**Step 1: Add import + hook inside `RepetitionTab`**

```tsx
import { useLanguage } from "@/lib/language-context";
const { t } = useLanguage();
```

**Step 2: Replace all hardcoded strings**

| Old | New |
|---|---|
| `"Ingenting å repetere ennå"` | `t.nothingYet` |
| `"Bevis først at du kan..."` | `t.nothingYetSub` |
| `done ? "Dagens repetisjon fullført!" : "Ingen kort klar i dag"` | `done ? t.allDone : t.noneReadyToday` |
| nextDays conditional block | use `t.nextLaterToday`, `t.nextTomorrow`, `t.nextInDays(n)`, `t.allReviewed` |
| `"Repetisjon"` | `t.repetitionTitle` |
| `"{index+1} av {queue.length} klar i dag"` | `t.repetitionOf(index+1, queue.length)` |
| `{lapses} {lapses === 1 ? "bom" : "bommer"}` | `t.lapse(lapses)` |
| `${confirmations}/${MASTERY_THRESHOLD} bekreftet` | `t.confirmedOf(confirmations, MASTERY_THRESHOLD)` |
| `"Mestret"` | `t.mastered` |
| `"Spørsmål · klikk for å snu"` | `t.cardQuestion` |
| `"Svar · klikk for å snu"` | `t.cardAnswer` |
| `"Husket ikke"` | `t.forgot` |
| `"Usikkert"` | `t.uncertain` |
| `"Kunne det"` | `t.remembered` |
| `` `om ${previewInterval(...)} dag` `` | `t.inDays(previewInterval(...))` |
| `` `om ${previewInterval(...)} dager` `` | `t.inDays(previewInterval(...))` |
| `"Snu kortet for å vurdere"` | `t.flipToGrade` |

**Step 3: Commit**

```bash
git add components/course/RepetitionTab.tsx
git commit -m "feat: translate RepetitionTab"
```

---

### Task 8: Update FlashcardsTab + DownloadTab

**Files:**
- Modify: `components/course/FlashcardsTab.tsx`
- Modify: `components/course/DownloadTab.tsx`

**FlashcardsTab — add hook and replace strings:**

```tsx
import { useLanguage } from "@/lib/language-context";
const { t } = useLanguage();
```

| Old | New |
|---|---|
| `"Flashcards"` | `t.flashcardsTitle` |
| `"{index+1} av {cards.length}"` | `t.flashcardsOf(index+1, cards.length)` |
| `"Fokus på umestrerte konsepter"` | `t.focusUnmastered` |
| `"Alle konsepter"` | `t.allConcepts` |
| `"Ingen flashcards tilgjengelig."` | `t.noCards` |
| `"Spørsmål · klikk for å snu"` | `t.cardQuestion` |
| `"Svar · klikk for å snu"` | `t.cardAnswer` |
| `"← Forrige"` | `t.prevCard` |
| `"Neste →"` | `t.nextCard` |

**DownloadTab — add hook and replace strings:**

```tsx
import { useLanguage } from "@/lib/language-context";
const { t } = useLanguage();
```

| Old | New |
|---|---|
| `"Last ned"` | `t.downloadTitle` |
| `"Last ned kurset som..."` | `t.downloadDesc` |
| `"Last ned HTML"` | `t.downloadBtn` |

**Step 3: Commit**

```bash
git add components/course/FlashcardsTab.tsx components/course/DownloadTab.tsx
git commit -m "feat: translate FlashcardsTab and DownloadTab"
```

---

### Task 9: Update OverviewTab + fetch header

**Files:**
- Modify: `components/course/OverviewTab.tsx`

**Step 1: Add hook to `OverviewTab`**

```tsx
import { useLanguage } from "@/lib/language-context";
const { lang, t } = useLanguage();
```

**Step 2: Add `X-Language` to the summary fetch**

```tsx
headers: {
  "Content-Type": "application/json",
  "X-API-Key": apiKey,
  "X-Model": model,
  "X-Language": lang,
},
```

**Step 3: Replace hardcoded strings**

In `OverviewTab`:

| Old | New |
|---|---|
| `"Oversikt"` (the `<p>` label) | `t.oversiktLabel` |
| `"Kort fortalt"` | `t.kortFortalt` |
| `"Genererer sammendrag…"` | `t.generatingSummary` |
| `"Klarte ikke å lage sammendrag..."` | `t.summaryError` |
| `label="Nye"` | `label={t.statNew}` |
| `label="Under repetisjon"` | `label={t.statReview}` |
| `label="Mestret"` | `label={t.statMastered}` |
| `label="Klar i dag"` | `label={t.statDueToday}` |
| `"Kjernekonsepter"` | `t.conceptsHeading` |
| `{mastered} av {total} mestret` | `t.masteredOf(mastered, total)` |
| `· ${review} under repetisjon` | `review > 0 ? t.underReviewCount(review) : ""` |

In `ConceptCard` — add `const { t } = useLanguage();` and replace:

| Old | New |
|---|---|
| `${n}/2 bekreftet` | `t.confirmedCount(concept.mastery_confirmations ?? 0)` |

**Step 4: Commit**

```bash
git add components/course/OverviewTab.tsx
git commit -m "feat: translate OverviewTab + X-Language on summary fetch"
```

---

### Task 10: Update UploadZone + upload/page.tsx

**Files:**
- Modify: `components/upload/UploadZone.tsx`
- Modify: `app/upload/page.tsx`

**UploadZone — add `"use client"` directive + hook:**

The file already uses `useRef`/`useState` so it must be client-side. Add at the top:

```tsx
"use client";
```

Then add hook and replace strings:

```tsx
import { useLanguage } from "@/lib/language-context";
const { t } = useLanguage();
```

| Old | New |
|---|---|
| `"Klikk eller dra hit · PDF (maks 20MB)"` | `t.uploadInstruction` |
| `"Kun tekst leses — illustrasjoner analyseres ikke"` | `t.uploadSubtext` |

**upload/page.tsx — add hook and update**

```tsx
import { useLanguage } from "@/lib/language-context";
const { lang, t } = useLanguage();
```

Add `"X-Language": lang` to the generate fetch headers:

```tsx
headers: { "X-API-Key": apiKey, "X-Model": model, "X-Language": lang },
```

Replace all hardcoded strings:

| Old | New |
|---|---|
| `"Legg inn API-nøkkel under API-innstillinger først."` | `t.noApiKeyError` |
| `"Ta et læringsløp"` | `t.uploadPageTitle` |
| `"Last opp en PDF, og AI trekker ut..."` | `t.uploadPageDesc` |
| `label="Analyserer fagstoffet og finner kjernekonsepter…"` | `label={t.parsingLabel}` |
| `"Start læringsløp"` (button) | `t.startLearning` |
| `data.error ?? "Noe gikk galt. Prøv igjen."` | `data.error ?? t.uploadGenericError` |
| `"Nettleseren har ikke plass..."` | `t.uploadQuotaError` |
| `"Klarte ikke å lagre kurset. Prøv igjen."` | `t.uploadSaveError` |
| `"Noe gikk galt. Sjekk API-nøkkelen..."` | `t.uploadApiError` |

**Step 3: Commit**

```bash
git add components/upload/UploadZone.tsx app/upload/page.tsx
git commit -m "feat: translate UploadZone and upload page + X-Language on generate"
```

---

### Task 11: Update home page (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add import + hook to `Home`**

```tsx
import { useLanguage } from "@/lib/language-context";
const { t } = useLanguage();
```

**Step 2: Replace strings in `Home`**

| Old | New |
|---|---|
| `"Dine kurs"` | `t.yourCourses` |
| `"Ingen kurs ennå"` | `t.noCourses` |
| `` `${courses.length} kurs lagret` `` | `t.courseCount(courses.length)` |
| `"+ Nytt kurs"` | `t.newCourse` |
| `"Last opp ditt første fagstoff"` | `t.uploadFirst` |
| `"Last opp en PDF, og AI trekker ut..."` | `t.uploadFirstDesc` |
| `"Start læringsløp"` | `t.startLearning` |
| `title="Slett kurs"` | `title={t.deleteCourse}` |
| `` `${mastered}/${total} mestret` `` | `t.masteredLabel(mastered, total)` |
| `` · ${review} under repetisjon `` | `review > 0 ? t.underReviewShort(review) : ""` |
| `toLocaleDateString("nb-NO")` | `toLocaleDateString(lang === "en" ? "en-GB" : "nb-NO")` — import `lang` too |

**Step 3: Replace strings in `DailyQueue`**

Add `t` and `lang` as props to `DailyQueue` (or call `useLanguage()` inside it):

Inside `DailyQueue`, add:
```tsx
const { t } = useLanguage();
```

Then replace:

| Old | New |
|---|---|
| `"Dagens økt"` | `t.dailySession` |
| `` `${dueToday} kort klar${...} i dag` `` | `t.dueCount(dueToday)` |
| `"Blandet økt på tvers av alle kursene dine."` | `t.mixedSession` |
| `"Start økt →"` | `t.startSession` |
| `"Nye kort forfaller senere i dag."` | `t.newCardsDueLater` |
| nextDays block | `t.nextLaterToday` / `t.nextTomorrow` / `t.nextInDays(n)` / `t.allReviewed` |

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: translate home page"
```

---

### Task 12: Update today/page.tsx

**Files:**
- Modify: `app/today/page.tsx`

**Step 1: Add hook to `TodayPage`, `EmptyState`, `DoneState`, `ReviewCard`**

Each sub-component is a local function. Add `const { t } = useLanguage();` inside each one that has Norwegian strings.

Import at the top:
```tsx
import { useLanguage } from "@/lib/language-context";
```

**Step 2: Replace strings**

In `TodayPage`:

| Old | New |
|---|---|
| `"← Tilbake til oversikt"` | `t.backToOverview` |
| `"Dagens økt"` | `t.todayTitle` |
| `"Blandet repetisjon på tvers av alle kursene dine"` | `t.todaySubtitle` |

In `EmptyState`:

| Old | New |
|---|---|
| `"Ingen kort klare i dag"` | `t.noCardsToday` |
| nextDays block | `t.nextLaterToday` / `t.nextTomorrow` / `t.nextInDays(n)` / `t.noCardsMasterFirst` |
| `"Til oversikten"` | `t.backBtn` |

In `DoneState`:

| Old | New |
|---|---|
| `"Dagens økt fullført"` | `t.todayComplete` |
| `` `Du gikk gjennom ${total} kort.` `` | `t.reviewedCards(total)` |
| nextDays block | `t.nextLaterToday` etc. |
| `"Ferdig"` | `t.doneBtn` |

In `ReviewCard`:

| Old | New |
|---|---|
| `"Fra kurs"` | `t.fromCourse` |
| `{lapses} {lapses === 1 ? "bom" : "bommer"}` | `t.lapse(lapses)` |
| `${confirmations}/${MASTERY_THRESHOLD} bekreftet` | `t.confirmedOf(confirmations, MASTERY_THRESHOLD)` |
| `"Mestret"` | `t.mastered` |
| `"{index+1} av {total} klar i dag"` | `t.repetitionOf(index+1, total)` |
| `"Spørsmål · klikk for å snu"` | `t.cardQuestion` |
| `"Svar · klikk for å snu"` | `t.cardAnswer` |
| `"Husket ikke"` | `t.forgot` |
| `"Usikkert"` | `t.uncertain` |
| `"Kunne det"` | `t.remembered` |
| `` `om ${previewInterval(...)} dag` `` | `t.inDays(previewInterval(...))` |
| `` `om ${previewInterval(...)} dager` `` | `t.inDays(previewInterval(...))` |
| `"Snu kortet for å vurdere"` | `t.flipToGrade` |
| `` `✓ «${justMastered}» er nå mestret` `` | `t.justMastered(justMastered)` |

**Step 3: Commit**

```bash
git add app/today/page.tsx
git commit -m "feat: translate today page"
```

---

### Task 13: Update LearningCurve + StudyHeatmap

**Files:**
- Modify: `components/shared/LearningCurve.tsx`
- Modify: `components/shared/StudyHeatmap.tsx`

**LearningCurve:**

Add hook and replace:

| Old | New |
|---|---|
| `"Læringskurve"` | `t.learningCurveLabel` |
| `` `Siste ${weeks} uker` `` | `t.lastWeeks(weeks)` |
| `"Ingen konsepter mestret enda..."` | `t.noMasteredYet` |
| `"konsept mestret"` / `"konsepter mestret"` | `t.conceptsMastered(total)` |
| `` · +${deltaWeek} denne uka `` | `deltaWeek > 0 ? t.thisWeek(deltaWeek) : ""` |

**StudyHeatmap:**

Add hook and replace:

| Old | New |
|---|---|
| `"Studieaktivitet"` | `t.studyActivityLabel` |
| `` `Siste ${weeks} uker` `` | `t.lastWeeks(weeks)` |
| `"dag på rad"` / `"dager på rad"` | `t.streakDays(streak)` (replace the whole span) |
| `" (studér i dag for å holde den)"` | `t.streakKeepGoing` |
| `"Ingen aktiv streak..."` | `t.noStreak` |
| `` `${cell.date}: ${cell.count} ${...}` `` | `` `${cell.date}: ${t.heatmapRegistrations(cell.count)}` `` |
| `const WEEKDAY_LABELS = [...]` | replace with `const { t } = useLanguage(); const WEEKDAY_LABELS = t.weekdayLabels;` — move inside component |

**Step 3: Commit**

```bash
git add components/shared/LearningCurve.tsx components/shared/StudyHeatmap.tsx
git commit -m "feat: translate LearningCurve and StudyHeatmap"
```

---

### Task 14: API routes — add X-Language support (all 6)

**Files:**
- Modify: `app/api/generate/route.ts`
- Modify: `app/api/evaluate/route.ts`
- Modify: `app/api/elaborate/route.ts`
- Modify: `app/api/chat/route.ts`
- Modify: `app/api/rephrase-question/route.ts`
- Modify: `app/api/summary/route.ts`

**Pattern for each route:**

At the start of the `POST` function, after existing header reads:

```ts
const lang = req.headers.get("X-Language") ?? "no";
```

Then select the prompt:

```ts
const prompt = lang === "en" ? PROMPT_EN : PROMPT_NO;
```

---

**`generate/route.ts`:**

Add `lang` extraction, then replace the concept extraction text:

```ts
const lang = req.headers.get("X-Language") ?? "no";

const conceptPrompt = lang === "en"
  ? `You are a pedagogical expert. Analyse this study material and extract the 5 to 10 most important core concepts.

For each concept create:
- A clear concept name (title)
- An open question requiring understanding, not just recall (question)
- A thorough answer with nuance and context (answer)
- A clue that helps without revealing the answer (hint)
- A short question for the flashcard front (flashcard_front)
- A short answer for the flashcard back (flashcard_back)

Create a fitting title for the document (title).
Questions should challenge reflection, not just "what is X?" but "why / how / in what context?"

Do not use dashes in any field — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. Only regular hyphens (-) in compound words are allowed.

Answer in English.`
  : `Du er en pedagogisk ekspert. Analyser dette fagstoffet og trekk ut de 5 til 10 viktigste kjernekonseptene.

For hvert konsept skal du lage:
- Et klart konseptnavn (title)
- Et åpent spørsmål som krever forståelse, ikke bare hukommelse (question)
- Et utdypende svar med nyanser og kontekst (answer)
- En ledetråd som hjelper uten å avsløre svaret (hint)
- Et kort spørsmål for flashcard (flashcard_front)
- Et kort svar for flashcard (flashcard_back)

Lag et passe tittel for dokumentet (title).
Spørsmålene skal utfordre til refleksjon, ikke bare "hva er X?" men "hvorfor/hvordan/hvilken sammenheng?"

Ikke bruk tankestreker i noe felt. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.

Svar på norsk.`;
```

Replace the `text` field in the concept generation `messages` array with `conceptPrompt`.

The `extractSourceText` function uses a neutral instruction (just "return verbatim text") — no language needed there.

---

**`evaluate/route.ts`:**

This is the most complex route. Add CONFIDENCE_LEVEL maps for both languages:

```ts
const lang = req.headers.get("X-Language") ?? "no";

const CONFIDENCE_LEVEL_NO: Record<number, { label: string; tier: "lav" | "middels" | "høy" }> = {
  1: { label: "usikker", tier: "lav" },
  2: { label: "delvis trygg", tier: "middels" },
  3: { label: "trygg", tier: "høy" },
};

const CONFIDENCE_LEVEL_EN: Record<number, { label: string; tier: "low" | "medium" | "high" }> = {
  1: { label: "uncertain", tier: "low" },
  2: { label: "partially confident", tier: "medium" },
  3: { label: "confident", tier: "high" },
};

const CONFIDENCE_LEVEL = lang === "en" ? CONFIDENCE_LEVEL_EN : CONFIDENCE_LEVEL_NO;
```

Remove the top-level `CONFIDENCE_LEVEL` constant. Then build the prompt:

```ts
const level = confidence ? CONFIDENCE_LEVEL[confidence] : null;

const confidenceLine = level
  ? lang === "en"
    ? `\nOn a three-step confidence scale, uncertain (low), partially confident (medium), confident (high), you rated yourself "${level.label}" before answering. This is ${level.tier} confidence.`
    : `\nPå en tryggetsskala med tre steg, usikker (lav), delvis trygg (middels), trygg (høy), oppga du "${level.label}" før du svarte. Dette er ${level.tier} selvtillit.`
  : "";

const calibrationGuide = level
  ? lang === "en"
    ? `

Calibration (required, one sentence woven into the prose, not a separate heading):

The person's confidence was ${level.tier}. Choose exactly one phrase from the table:

| Confidence | Answer covers the core (→ ✓) | Answer does not cover the core (→ ↻) |
|-----------|-------------------------------|--------------------------------------|
| low       | "you knew more than you thought" | "well calibrated"                 |
| medium    | "well calibrated"              | "well calibrated"                    |
| high      | "well calibrated"              | "you were more confident than the evidence supports" |

The closing sentence (✓ or ↻) MUST match the row you choose. You can never write "you were more confident than the evidence supports" and then close with "✓ You have demonstrated good understanding" — that is self-contradictory. When in doubt, choose "well calibrated".`
    : `

Kalibrering (obligatorisk, én setning flettet inn i prosaen, ikke egen overskrift):

Brukerens selvtillit var ${level.tier}. Velg eksakt én formulering ut fra tabellen:

| Selvtillit | Svaret dekker kjernen (→ ✓) | Svaret dekker ikke kjernen (→ ↻) |
|-----------|------------------------------|----------------------------------|
| lav       | "du kunne mer enn du trodde" | "godt kalibrert"                 |
| middels   | "godt kalibrert"             | "godt kalibrert"                 |
| høy       | "godt kalibrert"             | "du var tryggere enn grunnlaget tilsier" |

Avslutningssetningen (✓ eller ↻) MÅ stemme med raden du velger fra. Du kan aldri skrive "du var tryggere enn grunnlaget tilsier" og samtidig avslutte med "✓ Du har vist god forståelse", det er selvmotsigende. Hvis du er i tvil, velg "godt kalibrert".`
  : "";

const prompt = lang === "en"
  ? `You are an experienced academic tutor. Address the person directly in second person ("you"). Never refer to "the student", "the user", or "the learner" in the third person. Always address the person directly ("you have", "your answer", "you could elaborate").

IMPORTANT about perspective: The person answering is not necessarily the subject of their own answer. If the answer is about "students", "patients", "customers", "employees", "users" etc., this is the content of the subject matter — not a description of the person you are speaking with. Preserve the subjects as they appear in the answer. Never write "your motivation" or "your future" when the answer is actually about a third group.

Concept: ${concept}
Question: ${question}
Answer key (for your use, do not quote directly): ${correctAnswer}
Answer given: ${userAnswer}${confidenceLine}

Important about paraphrase: The answer key is the substance, not a specific wording. If the answer expresses the same point in different words, it counts as coverage, not a gap. Look for substantive gaps, not phrasing differences.

Write the feedback as flowing prose in 3 to 5 sentences. No bullet points. No headings like "What you got right:", "Self-assessment:", or "Conclusion:". Write as if speaking face to face.

Structure:
- At most one acknowledgment, brief and specific, at the very start (one sentence, no layers of praise). No exaggerations ("brilliant", "great job"), no emoji. Just a measured note of what was captured.
- The rest should be constructive. If the answer is missing something essential (beyond mere paraphrase), point it out concretely. If the answer covers the core, do not fabricate a gap, but point to where the phrasing can be sharpened, go one level deeper, or connect the point to something else in the material. Even a good answer has room to stretch.${calibrationGuide}

End with one clear closing sentence on its own line, without a bullet point:
- "✓ You have demonstrated good understanding." if the answer substantially covers the core.
- "↻ Try to [specific action]." if something essential is missing. Be specific about what to elaborate, not generic.

DASHES that MUST NOT be used: Do not use dashes — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. This applies throughout, including the closing sentence. Only regular hyphens (-) in compound words are allowed.

Be constructive, concrete, and human. Write in English, always in second person.`
  : `Du er en erfaren faglig veileder. Du henvender deg direkte til en voksen som tilegner seg ny kunnskap, i du-form. Skriv aldri om "eleven", "studenten" eller "brukeren" i tredjeperson. Snakk alltid til personen ("du har", "svaret ditt", "du kunne utdype").

VIKTIG om perspektiv: Personen som svarer er ikke nødvendigvis subjektet i sitt eget svar. Hvis svaret handler om "elever", "pasienter", "kunder", "ansatte", "brukere" osv., så er dette innholdet i fagstoffet. Det er ikke en beskrivelse av personen du snakker med, og deres motivasjon, fremtid eller hverdag. Bevar subjektene som de står i svaret. Skriv aldri "din motivasjon" eller "din fremtid" når svaret faktisk handler om en tredje gruppe.

Konsept: ${concept}
Spørsmål: ${question}
Fasit (til din bruk, ikke siteres): ${correctAnswer}
Svaret som ble skrevet: ${userAnswer}${confidenceLine}

Viktig om omformuleringer: Fasiten er fasit, ikke en bestemt ordlyd. Hvis svaret uttrykker samme poeng med andre ord, er det dekning, ikke et hull. Du skal lete etter substansielle hull, ikke ordforskjeller.

Skriv tilbakemeldingen som løpende prosa på 3 til 5 setninger. Ikke bruk kulepunkter. Ikke bruk overskrifter som "Hva du har riktig:", "Selvvurdering:" eller "Avslutning:". Skriv som om du snakker ansikt til ansikt.

Struktur:
- Maks én anerkjennelse, kort og konkret, helt i starten (én setning, ikke flere lag med ros). Ingen overdrivelser ("strålende", "veldig bra"), ingen smil og emoji. Bare nøkternt hva som ble fanget.
- Resten skal være konstruktiv. Hvis svaret mangler noe vesentlig (utover ren omformulering), pek på det konkret. Hvis svaret faktisk dekker kjernen, ikke fabrikkér et hull, men pek på hvor du kan skjerpe formuleringen, gå et hakk dypere, eller knytte poenget til noe annet i fagstoffet. Selv et godt svar har strekkmuligheter.${calibrationGuide}

Avslutt med én tydelig avslutningssetning på egen linje, uten kulepunkt:
- "✓ Du har vist god forståelse." hvis svaret i hovedsak dekker kjernen.
- "↻ Prøv å [konkret hva]." hvis det mangler noe vesentlig. Vær spesifikk i det som skal utdypes, ikke generisk.

STREKK OG TEGN som IKKE skal brukes i svaret: Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.

Vær konstruktiv, konkret og menneskelig. Skriv på norsk, alltid i du-form.`;
```

Replace the `prompt` field in `streamText({ model, prompt: ... })` with the variable `prompt`.

---

**`elaborate/route.ts`:**

```ts
const lang = req.headers.get("X-Language") ?? "no";
const NO_DASHES = lang === "en"
  ? `DASHES that MUST NOT be used: Do not use dashes — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. Only regular hyphens (-) in compound words are allowed.`
  : `STREKK OG TEGN som IKKE skal brukes: Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.`;
```

Mode 1 prompt (generate elaboration question):
```ts
const elaborationPrompt = lang === "en"
  ? `You are an experienced academic tutor. You have just evaluated an answer from an adult learner and want to help deepen their understanding through elaboration.

Concept: ${concept}
Original question: ${question}
Answer key: ${correctAnswer}
Answer given: ${userAnswer}

Choose ONE of these three elaboration question types based on what fits best for this concept and answer:

(a) A "why" question that forces out the underlying mechanism or reason.
(b) Ask for a concrete example from everyday life or practice (best when the concept is applicable).
(c) Ask for a description of the most common misunderstanding and why it is wrong (best for nuanced concepts where misunderstandings are close to the truth).

Choose the variant that will produce the strongest learning for this concept and answer. Do not explain the choice. Write only the question itself, one to two sentences, in second person.

${NO_DASHES}

Write in English.`
  : `Du er en erfaren faglig veileder. Du har nettopp evaluert et svar fra en voksen som tilegner seg ny kunnskap, og vil hjelpe personen å forankre forståelsen dypere gjennom elaborering.

Konsept: ${concept}
Opprinnelig spørsmål: ${question}
Fasit: ${correctAnswer}
Svaret som ble skrevet: ${userAnswer}

Velg ETT av disse tre elaboreringsspørsmålene basert på hva som passer best for konseptet og svaret:

(a) Et "hvorfor"-spørsmål som tvinger frem den underliggende mekanismen eller årsaken.
(b) Be om et konkret eksempel fra egen hverdag eller praksis (passer best når konseptet er anvendbart).
(c) Be om en beskrivelse av den vanligste feiltolkningen og hvorfor den er feil (passer best for nyanserte begreper der misforståelser ligger nært).

Velg den varianten som vil gi sterkest læring for nettopp dette konseptet og svaret. Ikke forklar valget. Skriv bare selve spørsmålet, en til to setninger, direkte i du-form.

${NO_DASHES}

Skriv på norsk.`;
```

Mode 2 prompt (elaboration feedback):
```ts
const feedbackPrompt = lang === "en"
  ? `You are an experienced academic tutor helping an adult anchor a concept more deeply. Address the person directly in second person.

Concept: ${concept}
Original question: ${question}
Answer key: ${correctAnswer}

You asked this elaboration question: ${elaborationQuestion}

Their answer was: ${userElaboration}

Give brief, concrete feedback in 2 to 3 sentences. Acknowledge what is strong in the connection, and add a nuance, an example, or a clarification that stretches their understanding further. Do not grade, do not say whether it was "right" or "wrong". This is elaboration, not a test.

${NO_DASHES}

Write as natural prose in English.`
  : `Du er en erfaren faglig veileder som hjelper en voksen å forankre et konsept dypere. Du henvender deg direkte i du-form.

Konsept: ${concept}
Opprinnelig spørsmål: ${question}
Fasit: ${correctAnswer}

Du stilte dette elaboreringsspørsmålet: ${elaborationQuestion}

Svaret var: ${userElaboration}

Gi en kort, konkret tilbakemelding på 2 til 3 setninger. Anerkjenn det som er sterkt i koblingen, og legg eventuelt til en nyanse, et eksempel eller en presisering som strekker forståelsen videre. Ikke gi karakter, ikke si om det var "riktig" eller "galt". Dette er forankring, ikke prøve.

${NO_DASHES}

Skriv som naturlig prosa på norsk.`;
```

Replace the `prompt` values in both `generateText` and `streamText` calls with the variables above.

---

**`chat/route.ts`:**

```ts
const lang = req.headers.get("X-Language") ?? "no";
```

Replace the `sourceBlock` strings and the `system` prompt:

```ts
const sourceBlock = trimmedSource
  ? lang === "en"
    ? `\n\nSource text (extracted from the uploaded document. Use this as the primary source for article-specific questions about author, year, numbers, quotes, and definitions used in the text):\n"""\n${trimmedSource}\n"""`
    : `\n\nKildetekst (ekstrahert fra det opplastede dokumentet. Bruk dette som primærkilde for artikkel-spesifikke spørsmål som forfatter, årstall, antall studier, sitater, tall og definisjoner brukt i teksten):\n"""\n${trimmedSource}\n"""`
  : lang === "en"
    ? `\n\nNote: The source document is not available in this conversation, only the concept and answer key. If asked about details that require the text (e.g. exact numbers, author, number of studies cited), state clearly that you do not have access to the document.`
    : `\n\nMerk: Selve kildedokumentet er ikke tilgjengelig i denne samtalen, bare konseptet og fasiten. Hvis du blir spurt om detaljer som krever teksten (f.eks. eksakte tall, forfatter, antall studier som ble sitert), si tydelig at du ikke har tilgang til dokumentet.`;

const systemPrompt = lang === "en"
  ? `You are a helpful AI tutor for adults acquiring new knowledge. Address the person directly in second person, never as "the student", "the user", or "the learner" in the third person.

The person is learning about the concept "${concept}".
The answer key for this concept is (for your use, do not quote in full): ${conceptAnswer}${sourceBlock}

The message may be a question, a thought, a partial understanding, or just a comment.

Important:
- If the question is a factual question (e.g. "who wrote", "how long", "what is", "when", "who") or a meta-question about the text/article: answer directly and concisely. Use the source text above as the primary source for article-specific details.
- If the person is in the middle of trying to explain or understand the concept itself, and asks for a hint or guidance: do not give away the answer. Guide, ask a counter-question, give a hint that takes them one step further.
- Do not ask counter-questions just to be Socratic. Only when the person is genuinely working toward understanding the concept and needs a nudge.
- For article-specific questions: do not invent authors, years, or numbers not in the text. If the source text is truncated and the answer may be in the missing part, say so clearly.
- Do not start responses with phrases like "Great question!", "Good thinking!" or similar praise.
- If you are not certain about something, say so clearly. Do not guess.
- Do not use dashes in the response — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. Only regular hyphens (-) in compound words are allowed.
- Be concise and concrete. Write in English, always in second person.`
  : `Du er en hjelpsom AI-tutor for voksne som tilegner seg ny kunnskap. Du henvender deg direkte i du-form, aldri "eleven", "studenten" eller "brukeren" i tredjeperson.

Personen du snakker med holder på å lære om konseptet "${concept}".
Fasiten for dette konseptet er (til din bruk, ikke siteres direkte i sin helhet): ${conceptAnswer}${sourceBlock}

Meldingen kan være et spørsmål, en tanke, en delvis forståelse, eller bare en kommentar.

Viktig:
- Hvis spørsmålet er et faktaspørsmål (f.eks. "hvem skrev", "hvor lenge", "hva er", "når", "hvem") eller et meta-spørsmål om teksten/artikkelen: svar direkte og kortfattet. Bruk kildeteksten over som primærkilde hvis det er en artikkel-spesifikk detalj.
- Hvis personen er midt i å prøve å forklare eller forstå selve konseptet, og spør om hint eller veiledning: ikke gi fasitsvaret rett ut. Veiled, still et motspørsmål, gi et hint som tar dem ett skritt videre.
- Ikke still motspørsmål bare for å være sokratisk. Kun når personen faktisk jobber seg mot å forstå konseptet og trenger dytt.
- For artikkel-spesifikke spørsmål: ikke finn på forfattere, årstall eller tall som ikke står i teksten. Hvis kildeteksten er avkuttet og svaret kan ligge i det som mangler, si det tydelig.
- Ikke start svaret med fraser som "Bra spørsmål!", "Godt tenkt!" eller lignende ros.
- Hvis du ikke vet noe sikkert, si det tydelig. Ikke gjett.
- Ikke bruk tankestreker i svaret. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.
- Vær kortfattet og konkret. Svar på norsk, alltid i du-form.`;
```

Replace `system: \`Du er en hjelpsom...\`` in `streamText` with `system: systemPrompt`.

---

**`rephrase-question/route.ts`:**

```ts
const lang = req.headers.get("X-Language") ?? "no";

const rephrasePrompt = lang === "en"
  ? `Create three alternative phrasings of the same flashcard question. The purpose is for the learner to encounter the same concept with different wording each time, so that learning becomes deep understanding rather than memorising a specific sentence.

Concept: ${concept}
Original question: ${question}
Answer key (preserved. All three variants must have this as a valid answer): ${answer}

Create three different phrasings. Use three different angles from this list:
- "Explain this to a ten-year-old."
- "What is the motivation behind ${concept.toLowerCase()}?"
- "How would you explain ${concept.toLowerCase()} with a concrete example?"
- "What distinguishes ${concept.toLowerCase()} from related concepts?"
- "What happens if we remove or ignore ${concept.toLowerCase()}?"
- "Why does ${concept.toLowerCase()} matter in practice?"

Choose three angles that genuinely fit the concept (do not force angles that produce an awkward question).

Requirements:
- Each variant is one question, max approximately 180 characters, short enough for a flashcard.
- The answer key must still be a valid answer to each variant.
- Write in English.
- Do not include the answer in the question.
- Do not number the variants. Return them as plain text.
- Do not use dashes (em-dash — or en-dash –) in any variant. Use commas, periods, colons, or parentheses.`
  : `Du skal lage tre alternative formuleringer av samme flashcard-spørsmål. Formålet er at den som lærer møter samme konsept med ulik ordlyd hver gang, så læringen blir dyp forståelse i stedet for å huske en bestemt setning.

Konsept: ${concept}
Originalt spørsmål: ${question}
Fasit (bevares. Alle tre variantene må ha dette som gyldig svar): ${answer}

Lag tre ulike formuleringer. Bruk tre forskjellige vinkler fra denne listen:
- "Forklar dette for en tiåring."
- "Hva er motivasjonen bak ${concept.toLowerCase()}?"
- "Hvordan vil du forklare ${concept.toLowerCase()} med et konkret eksempel?"
- "Hva skiller ${concept.toLowerCase()} fra nære begreper?"
- "Hva skjer hvis vi fjerner eller overser ${concept.toLowerCase()}?"
- "Hvorfor er ${concept.toLowerCase()} viktig i praksis?"

Velg tre vinkler som faktisk passer konseptet (ikke tving fram vinkler som gir rart spørsmål).

Krav:
- Hver variant er ett spørsmål, maks ca. 180 tegn, kort nok til et flashcard.
- Fasiten må fortsatt være et gyldig svar på hver variant.
- Skriv på norsk.
- Ikke inkluder svaret i spørsmålet.
- Ikke nummerer variantene. Returner dem som ren tekst.
- Ikke bruk tankestreker (em-dash — eller en-dash –) i noen variant. Bruk komma, punktum, kolon eller parenteser.`;
```

Replace the `prompt` in `generateObject` with `rephrasePrompt`.

---

**`summary/route.ts`:**

```ts
const lang = req.headers.get("X-Language") ?? "no";

const summaryPrompt = lang === "en"
  ? `Write a brief summary of the text below. 2 to 3 sentences, flowing prose, no bullet points or headings. Capture the main theme and main argument, not just the title. Write objectively in third person, such as "The text argues that..." or "The author shows that..." or "The article describes...". Do not address the reader and do not use second person.

Do not use dashes (em-dash — or en-dash –). Use commas, periods, colons, or parentheses instead.

Answer in English.

Text:
"""
${trimmed}
"""`
  : `Lag et kort sammendrag av teksten under. 2 til 3 setninger, løpende prosa, ingen kulepunkter eller overskrifter. Fang hovedtemaet og hovedargumentet, ikke bare tittelen. Skriv objektivt i tredjeperson, som "Teksten argumenterer for..." eller "Forfatteren viser at..." eller "Artikkelen beskriver...". Ikke henvend deg til leseren og ikke bruk du-form.

Ikke bruk tankestreker (em-dash — eller en-dash –). Bruk komma, punktum, kolon eller parenteser i stedet.

Svar på norsk.

Tekst:
"""
${trimmed}
"""`;
```

Replace the `prompt` in `generateText` with `summaryPrompt`.

---

**Step: Verify and commit all API routes**

```bash
npx tsc --noEmit
git add app/api/generate/route.ts app/api/evaluate/route.ts app/api/elaborate/route.ts app/api/chat/route.ts app/api/rephrase-question/route.ts app/api/summary/route.ts
git commit -m "feat: add X-Language support to all API routes with EN prompts"
```

---

### Task 15: Final verification

**Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 2: Build check**

```bash
npm run build
```

Expected: successful build.

**Step 3: Manual UI verification — Norwegian**

Start dev server: `npm run dev`

- Confirm toggle shows NO as active by default
- Home page, upload page, course page, today page all in Norwegian
- Upload a PDF → concepts extracted in Norwegian
- Learn tab: evaluate an answer → feedback in Norwegian
- Repetition tab: grade a card → button labels in Norwegian

**Step 4: Manual UI verification — English**

- Click EN toggle
- Confirm all UI strings switch to English
- Upload a NEW PDF → concepts, questions, answers extracted in English
- Learn tab: evaluate an answer → feedback in English
- Check that existing Norwegian courses still show Norwegian content (correct — only UI strings change)
- Repetition tab: grade a card → "Forgot / Uncertain / Got it" in English, "in X days" intervals in English
- Heatmap weekday labels: M T W T F S S

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete NO/EN language toggle"
```
