# Læringskurve på forsiden — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Legg til et "Læringskurve"-kort på forsiden som viser cumulative antall mestrede konsepter over siste 26 uker som en SVG-sparkline, ved siden av eksisterende studie-heatmap.

**Architecture:** Avled mestringsdato per konsept fra eksisterende `attempts`-log (ingen type-endringer). Bygg daglig cumulative-serie på tvers av alle kurs. Render som inline SVG (ingen chart-lib). Plasser rett etter `<StudyHeatmap>` på forsiden.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, TypeScript, Tailwind v4, inline SVG for sparkline. Ingen nye deps.

**Design-dokument:** `docs/plans/2026-04-20-laeringskurve-design.md` — les dette først for full kontekst, pedagogisk begrunnelse, edge cases og visuell spec.

**Branch:** `feat/laeringskurve` (allerede opprettet, designdok committet).

**Verifisering:** Ingen test-infra i repoet. Verifisering per task er (a) `npm run build` passerer (TypeScript + Next build), (b) visuell sjekk i `npm run dev` og på Vercel preview etter push.

**Convention-merknader (viktige før du skriver kode):**
- Next.js 16 i dette repoet har breaking changes mot din treningsdata — les `node_modules/next/dist/docs/` ved tvil. Se `AGENTS.md`.
- Bruk `today()` fra `lib/srs.ts` for lokal ISO-dato (ikke `new Date().toISOString()` — det gir off-by-one utenfor UTC). Dette er en reell bug som er fikset før.
- Bruk `addDays(iso, delta)` fra `lib/study-log.ts` for dato-aritmetikk (samme grunn).
- Client components må begynne med `"use client";` på første linje.
- Forby tankestreker i tekst (prosjekt-konvensjon — bruk bindestrek eller komma).

---

### Task 1: `masteredAt`-helper

**Files:**
- Create: `lib/learning-curve.ts`

**Step 1: Skriv helper-filen**

Opprett `lib/learning-curve.ts`:

```typescript
import { Concept, Course } from "./types";
import { isMastered, today } from "./srs";
import { addDays } from "./study-log";

/**
 * Returnerer datoen (ISO YYYY-MM-DD) konseptet passerte mestringsterskelen,
 * eller null hvis det ikke er mestret. Utledes fra attempts-loggen:
 * den 2. bestått-attempt markerer terskelen. For eldre mestrede konsepter
 * uten attempts-log, fallback til today().
 */
export function masteredAt(concept: Concept): string | null {
  if (!isMastered(concept)) return null;
  const correctDates = (concept.attempts ?? [])
    .filter((a) => a.correct)
    .map((a) => a.date)
    .sort();
  if (correctDates.length >= 2) return correctDates[1];
  if (correctDates.length === 1) return correctDates[0];
  return today();
}
```

**Step 2: Verifiser build**

Run: `npm run build`
Expected: PASS (ingen type-feil, ingen lint-feil).

**Step 3: Commit**

```bash
git add lib/learning-curve.ts
git commit -m "feat: masteredAt-helper utleder mestringsdato fra attempts"
```

---

### Task 2: `computeMasteryCurve`

**Files:**
- Modify: `lib/learning-curve.ts`

**Step 1: Legg til series-bygger**

Legg til i `lib/learning-curve.ts`:

```typescript
export interface CurvePoint {
  date: string;
  count: number;
}

/**
 * Bygger en daglig cumulative-serie av antall mestrede konsepter
 * på tvers av alle kurs, over de siste `weeks*7` dagene (siste punkt = i dag).
 */
export function computeMasteryCurve(courses: Course[], weeks: number = 26): CurvePoint[] {
  const masteredDates = courses
    .flatMap((c) => c.concepts.map(masteredAt))
    .filter((d): d is string => d !== null)
    .sort();

  const totalDays = weeks * 7;
  const end = today();
  const series: CurvePoint[] = [];
  let cursor = addDays(end, -(totalDays - 1));
  let idx = 0;

  for (let i = 0; i < totalDays; i++) {
    while (idx < masteredDates.length && masteredDates[idx] <= cursor) idx++;
    series.push({ date: cursor, count: idx });
    cursor = addDays(cursor, 1);
  }

  return series;
}
```

**Step 2: Verifiser build**

Run: `npm run build`
Expected: PASS.

**Step 3: Commit**

```bash
git add lib/learning-curve.ts
git commit -m "feat: computeMasteryCurve bygger daglig cumulative-serie"
```

---

### Task 3: `LearningCurve`-komponent (kort-skjelett + tom-tilstand)

**Files:**
- Create: `components/shared/LearningCurve.tsx`
- Modify: `app/page.tsx` (importer + plasser rett etter `<StudyHeatmap>`)

**Step 1: Opprett komponent**

Opprett `components/shared/LearningCurve.tsx`:

```tsx
"use client";

import { Course } from "@/lib/types";
import { computeMasteryCurve } from "@/lib/learning-curve";

interface Props {
  courses: Course[];
  weeks?: number;
}

export default function LearningCurve({ courses, weeks = 26 }: Props) {
  const series = computeMasteryCurve(courses, weeks);
  const total = series[series.length - 1]?.count ?? 0;

  return (
    <div className="bg-white border border-black/8 rounded-md p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3 gap-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Læringskurve
        </div>
        <div className="text-[10px] text-muted-foreground hidden sm:block">
          Siste {weeks} uker
        </div>
      </div>

      {total === 0 ? (
        <div className="text-sm text-muted-foreground">
          Ingen konsepter mestret enda. Mestre ditt første i Lær-fanen.
        </div>
      ) : (
        <div className="text-sm text-dg">
          <span className="font-heading text-lg">🌱 {total}</span>{" "}
          <span className="text-muted-foreground">
            {total === 1 ? "konsept mestret" : "konsepter mestret"}
          </span>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Wire inn i forsiden**

I `app/page.tsx`, legg til importen øverst (samme blokk som `StudyHeatmap`-import):

```tsx
import LearningCurve from "@/components/shared/LearningCurve";
```

I JSX-returen, rett etter linja `{courses.length > 0 && <StudyHeatmap log={studyLog} />}`, legg til:

```tsx
{courses.length > 0 && <LearningCurve courses={courses} />}
```

**Step 3: Verifiser build + visuell**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`, åpne `http://localhost:3000`.
Expected:
- Hvis ingen kurs → kortet vises ikke.
- Hvis kurs uten mestrede → kortet viser "Ingen konsepter mestret enda."
- Hvis kurs med ≥1 mestret → kortet viser "🌱 N konsepter mestret".
- Kort-chrome matcher Studieaktivitet-kortet rett over (samme border, padding, spacing).

**Step 4: Commit**

```bash
git add components/shared/LearningCurve.tsx app/page.tsx
git commit -m "feat: LearningCurve-kort med totalmestret og tom-tilstand"
```

---

### Task 4: "+N denne uka"-tall

**Files:**
- Modify: `components/shared/LearningCurve.tsx`

**Step 1: Beregn ukentlig delta og vis under hovedtallet**

I `LearningCurve.tsx`, legg til under `const total = ...`:

```tsx
const weekAgo = series[series.length - 8]?.count ?? 0;
const deltaWeek = total - weekAgo;
```

Erstatt den eksisterende "konsepter mestret"-`<span>`-blokken med (merk: ny strukturen bytter til en egen linje for under-teksten):

```tsx
<div className="text-sm text-dg">
  <div>
    <span className="font-heading text-lg">🌱 {total}</span>
  </div>
  <div className="text-muted-foreground text-xs mt-0.5">
    {total === 1 ? "konsept mestret" : "konsepter mestret"}
    {deltaWeek > 0 && ` · +${deltaWeek} denne uka`}
  </div>
</div>
```

**Step 2: Verifiser build + visuell**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`.
Expected:
- Hvis minst én mestring de siste 7 dagene → "+N denne uka" vises etter punkt-separatoren.
- Hvis ingen nye denne uka → kun "konsepter mestret".

**Step 3: Commit**

```bash
git add components/shared/LearningCurve.tsx
git commit -m "feat: '+N denne uka'-momentum i læringskurve-kortet"
```

---

### Task 5: SVG sparkline

**Files:**
- Modify: `components/shared/LearningCurve.tsx`

**Step 1: Legg til SVG-render**

I `LearningCurve.tsx`, legg til følgende hjelpefunksjon utenfor komponenten (over `export default`):

```tsx
function buildSparklinePaths(series: { date: string; count: number }[], width: number, height: number) {
  const max = Math.max(1, series[series.length - 1]?.count ?? 0);
  const step = width / Math.max(1, series.length - 1);
  const points = series.map((p, i) => {
    const x = i * step;
    const y = height - (p.count / max) * height;
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${width.toFixed(1)},${height} L0,${height} Z`;

  return { line, area };
}
```

Inne i komponenten (etter `deltaWeek`-beregningen), legg til SVG-dimensjoner og paths — kun hvis `total > 0`:

```tsx
const SPARK_W = 560;
const SPARK_H = 60;
const paths = total > 0 ? buildSparklinePaths(series, SPARK_W, SPARK_H) : null;
```

Legg til sparkline-SVG rett under stats-blokken, men *før* `</div>`-en som lukker kortet. Den skal kun rendres når `paths` ikke er null:

```tsx
{paths && (
  <svg
    className="w-full mt-4 block"
    viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path d={paths.area} className="fill-gold/25" />
    <path d={paths.line} className="stroke-gold fill-none" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
)}
```

**Step 2: Verifiser build + visuell**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`.
Expected:
- Sparkline tegnes under "konsepter mestret"-linja når `total > 0`.
- Linjen er monoton (går aldri ned), fylt under i lys gold.
- Ingen sparkline i tom-tilstanden.
- Ser proporsjonal ut i bredden på forsiden (`max-w-2xl`).

Test med reelle data: åpne appen, mester et konsept, refresh — siste datapunkt skal hoppe opp.

**Step 3: Commit**

```bash
git add components/shared/LearningCurve.tsx
git commit -m "feat: SVG-sparkline for cumulative mestringskurve"
```

---

### Task 6: Push og Vercel-preview-sjekk

**Step 1: Push branch**

```bash
git push -u origin feat/laeringskurve
```

**Step 2: Åpne PR**

```bash
gh pr create --title "Bølge 3.2: Læringskurve på forsiden" --body "$(cat <<'EOF'
## Summary
- Ny `LearningCurve`-komponent under studie-heatmapet: total mestrede konsepter + "+N denne uka" + SVG-sparkline over siste 26 uker.
- Utleder mestringsdato fra eksisterende `attempts`-log — ingen type-endringer, ingen ny datafangst.
- Design og begrunnelse: `docs/plans/2026-04-20-laeringskurve-design.md`.

## Test plan
- [ ] Tom state: forside uten kurs → kort vises ikke. Forside med kurs uten mestrede → kort viser "Mestre ditt første i Lær-fanen".
- [ ] Første mestring: mester ett konsept → total blir 1, sparkline tegner én pigg.
- [ ] Momentum: mester ≥1 nytt konsept samme uke → "+N denne uka" vises.
- [ ] Visuell: kort-chrome matcher Studieaktivitet-kortet (samme border, spacing, typografi).
- [ ] Vercel preview ser riktig ut på mobil og desktop.
EOF
)"
```

**Step 3: Vent på Vercel-preview og verifiser der**

Når preview-URLen er klar (gh pr view viser Vercel-status), åpne og sjekk:
- Kortet ser riktig ut mot eksisterende heatmap.
- Sparkline renderes uten clipping eller overflow.
- Responsivt på smale skjermer.

Hvis alt ser bra ut, merg PR-en selv (Kenneth gjør dette — ikke gjør det automatisk).

---

## Oppsummering av filer

| Fil | Handling | Tasks |
|---|---|---|
| `lib/learning-curve.ts` | Ny | 1, 2 |
| `components/shared/LearningCurve.tsx` | Ny | 3, 4, 5 |
| `app/page.tsx` | Modifisert (2 linjer) | 3 |

Total: 2 nye filer, 1 modifisert, 5 feature-commits + 1 design-commit (allerede gjort).
