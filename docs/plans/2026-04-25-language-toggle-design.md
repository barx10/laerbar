# Language Toggle Design — Norwegian / English

**Date:** 2026-04-25

## Goal

Allow non-Norwegian speakers to use Lærbar fully in English. The language toggle affects the entire UI, all AI responses, and all content generated at upload time.

## Approach

Lightweight custom i18n with React Context. No external i18n libraries. No changes to URL structure.

## Architecture

### `lib/i18n.ts`

Two typed string dictionaries: `no` (source of truth) and `en`. TypeScript enforces parity — `type Translations = typeof no`, and `en: Translations` means the compiler reports any missing key.

Dynamic strings (e.g. "om X dager") are functions on the dictionary:
```ts
inDays: (n: number) => `om ${n} dager`   // no
inDays: (n: number) => `in ${n} days`    // en
```

### `lib/language-context.tsx`

- `LanguageProvider` reads `"laerbar_lang"` from localStorage on mount (default `"no"`), writes on change.
- Exposes `{ lang, setLang, t }` via `useLanguage()` hook.
- Wrapped around the app in `app/layout.tsx`.

### Navbar toggle

A `NO | EN` button in the navbar header, right side. Calls `setLang()` on click. Active language shown with gold highlight.

### Components

All components call `useLanguage()` and use `t.key` instead of hardcoded Norwegian strings. The `CONFIDENCE_OPTIONS` array in `LearnTab` (with `label` and `hint` per confidence level) is defined inside the i18n dictionaries since it's rendered in the UI.

### API routes

All six routes read `X-Language` header:
```ts
const lang = req.headers.get("X-Language") ?? "no";
const prompt = lang === "en" ? PROMPT_EN : PROMPT_NO;
```

English prompts are written from scratch — same intent and calibration logic as Norwegian, not word-for-word translations.

All `fetch()` calls from client components include `"X-Language": lang` header, reading from the current language context.

## Scope of routes

| Route | Role |
|---|---|
| `/api/generate` | Extracts concepts, questions, answers, hints, flashcards from PDF — language of stored content is determined here |
| `/api/evaluate` | Main answer feedback — complex prompt with calibration table and perspective rules |
| `/api/elaborate` | Follow-up elaboration question + feedback |
| `/api/chat` | Chat sidebar in LearnTab |
| `/api/rephrase-question` | Generates `question_variants` — called silently after first proof |
| `/api/summary` | 2-3 sentence course summary shown in OverviewTab |

## Content language locking

Course content (concepts, questions, answers, flashcards) is generated at upload time and stored in localStorage. It is locked to the language active at the time of upload. Switching language later does not retroactively re-generate existing courses — this is expected behavior.

## Scope of UI translation

All components with hardcoded Norwegian strings:

- `Navbar` — tagline, Om/Hjelp/API buttons, full Om-modal and Hjelp-modal content
- `SettingsModal` — all labels, status text, backup section
- `LearnTab` — confidence options, answer flow, evaluation buttons, elaboration, chat sidebar, HurtigsjekCard
- `RepetitionTab` — card labels, grading buttons, next-interval strings, empty/done states
- `CourseTabs` — tab labels
- `FlashcardsTab`, `OverviewTab`, `DownloadTab` — all UI strings
- `app/page.tsx`, `app/upload/page.tsx`, `app/today/page.tsx`, `app/course/[id]/page.tsx` — all page-level strings
- `ParsingAnimation`, `UploadZone`, `Footer`, `LearningCurve`, `StudyHeatmap` — remaining shared components

## Non-goals

- Locale-based URL routing (`/en/...`)
- Automatic browser language detection
- Re-translation of existing Norwegian courses
- Pluralization library support (handled manually for the few dynamic strings)
