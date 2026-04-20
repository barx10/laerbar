# Læringskurve på forsiden — designdokument

**Dato:** 2026-04-20
**Bølge:** 3, oppgave 2 (av 3 gjenstående)
**Status:** Godkjent design, klar for implementasjonsplan

## Mål

Legg til et dashboard-element på forsiden som viser hvor mye brukeren faktisk har *lært* over tid — et komplement til studie-heatmapet som viser hvor jevnt man har *jobbet*. Sammen danner de forsidens "læringsdashbord".

**Pedagogisk begrunnelse:** heatmap svarer "jobber jeg jevnt?". En kurve ved siden av svarer "lærer jeg?". Mestringsterskelen (2 bekreftelser med minst én dag mellom) er allerede validert i Bølge 1, så "antall mestrede konsepter over tid" er den enkleste ærlige "lærer jeg?"-signalet vi kan vise uten ny datafangst.

## Omfang

**Inn:** Én global sparkline over alle kurs, cumulative antall mestrede konsepter over siste 26 uker (samme tidsvindu som heatmap). Plasseres som eget kort rett under Studieaktivitet-kortet.

**Ute:** Ingen per-kurs-sparklines (utsatt). Ingen confidence-trend-kurve (utsatt). Ingen hover/tooltip på sparkline (YAGNI). Ingen ny datafangst i Repeter (aksepterer sparsomme data per konsept).

## Layout

Forsidens vertikale stakk får ett nytt kort (markert **NY**):

```
Navbar
├─ Studieaktivitet-kort (heatmap + streak)        [eksisterende]
├─ Læringskurve-kort (sparkline + totalmestret)   [NY]
├─ Dagens økt-kort (DailyQueue, betinget)
├─ "Dine kurs" header + [+ Nytt kurs]
└─ Liste med kurs-kort
```

Rekkefølge-begrunnelse: dashbord-elementer gruppert øverst, handling (Dagens økt) i midten, katalog (kurs-liste) nederst. Dashboardets "ja/nei-spørsmål" ("har jeg jobbet?" + "har jeg lært?") leses først.

### Kort-innhold

Samme kort-chrome som heatmap (`bg-white border border-black/8 rounded-md p-5 mb-6`):

```
┌──────────────────────────────────────────┐
│ LÆRINGSKURVE              Siste 26 uker  │
│                                          │
│ 🌱 42                                    │
│ konsepter mestret · +3 denne uka         │
│                                          │
│ [sparkline fylt under, gold/25, ~60 px]  │
└──────────────────────────────────────────┘
```

- **Tittel-rad:** `LÆRINGSKURVE` i samme uppercase-stil som `STUDIEAKTIVITET`. "Siste 26 uker" høyrestilt (speiler heatmap).
- **Hovedtall:** `🌱 42` i heading-font, matcher `🔥 23` i streak-linja. Emoji er valgfri og kan droppes hvis det føles prydord i implementasjon.
- **Underlinje:** `konsepter mestret · +3 denne uka`. Gir både totalvolum og momentum.
- **Sparkline:** inline SVG, én datapunkt per dag over 182 dager, cumulative mastered count på y-aksen. Linje i `gold`, fylt område under i `gold/25`. Høyde ~60 px.

### Tom-tilstand

Når `courses.length > 0` men ingen konsepter er mestret ennå: vis kortet, men erstatt hovedtall/sparkline med dempet tekst:

> *Ingen konsepter mestret enda. Mestre ditt første i Lær-fanen.*

Når `courses.length === 0`: kortet vises ikke (samme pattern som heatmap).

## Datamodell

**Ingen type-endringer.** Data som trengs finnes allerede i `Concept.attempts` (Bølge 1) og `Concept.mastery_confirmations`.

## Algoritme

Ny helper-fil `lib/learning-curve.ts`:

### `masteredAt(concept): string | null`

Utleder datoen for når et konsept passerte mestringsterskelen.

```
hvis !isMastered(concept)  → null
ellers:
  korrekte = concept.attempts.filter(correct=true).map(date)
  hvis korrekte.length >= 2  → korrekte[1]   // 2. bestått = terskelen
  ellers hvis korrekte.length === 1  → korrekte[0]
  ellers  → today()                          // fallback for pre-Bølge-1-konsepter
```

Fallback til `today()` betyr at eldre mestrede konsepter (før attempts-log fantes) bakes inn som "mestret i dag". Akseptert — vi er i uttestingsfase og har ikke reelle brukere.

### `computeMasteryCurve(courses, weeks=26): Array<{ date: string; count: number }>`

Bygger cumulative-serien sparklinen tegner.

```
timestamps = flatten(courses.map(c => c.concepts.map(masteredAt)))
           .filter(d => d !== null)

for hver dag fra (today - weeks*7) til today:
  count = timestamps.filter(t => t <= dag).length
  push({ date: dag, count })

returner serien
```

### Avledede tall (beregnet i komponenten)

- **Total mestret:** `series[series.length - 1].count`
- **+N denne uka:** `last.count - series.find(p => p.date === addDays(today, -7))?.count ?? 0`

## Komponent

Ny komponent `components/shared/LearningCurve.tsx`:

- Tar `courses: Course[]` som prop.
- Kaller `computeMasteryCurve(courses)` i render.
- Tegner SVG sparkline inline — ingen chart-lib-avhengighet. Normaliser y til `[0, max]`, bygg `polyline` + fylt `path`.
- Håndterer tom-tilstand (total = 0 → vis tom-tekst i stedet for sparkline).

Plasseres i `app/page.tsx` rett etter `<StudyHeatmap />`, med samme betingelse `courses.length > 0 && <LearningCurve courses={courses} />`.

## Feilhåndtering / edge cases

| Case | Oppførsel |
|---|---|
| `courses.length === 0` | Kortet rendres ikke (betinget i `app/page.tsx`) |
| `courses.length > 0`, ingen mestrede | Kort vises, tom-tekst i stedet for sparkline |
| 1 mestret konsept | Sparkline viser én pigg-kant — OK, forteller sannheten |
| Alle mestret i dag | Flat serie som hopper til N på siste dag — OK |
| Pre-Bølge-1-konsepter uten attempts | `masteredAt` returnerer `today()`, teller med i dagens count |

## Verifisering (manuell — ingen test-infra i repoet)

- Last opp nytt kurs, mester 2 konsept fordelt over to dager → sparkline viser 0→1→2 på riktige dager.
- Mestre ytterligere ett konsept samme uke → "+N denne uka"-tallet går opp.
- Tøm localStorage, last opp ett kurs uten å mestre noe → kortet viser tom-tilstand.
- Vercel preview: visuell sjekk — kort-chrome, spacing og typografi matcher Studieaktivitet-kortet.

## Filer som endres

| Fil | Endring |
|---|---|
| `lib/learning-curve.ts` | **Ny.** `masteredAt`, `computeMasteryCurve`. |
| `components/shared/LearningCurve.tsx` | **Ny.** Kort + SVG sparkline + tom-tilstand. |
| `app/page.tsx` | Importer og plasser `<LearningCurve>` rett etter `<StudyHeatmap>`. |

## Åpne spørsmål

Ingen. Alle avklart i brainstormingsfasen.

## Fremtidige utvidelser (utenfor dette designet)

- Hover/tooltip på sparkline med dato + count.
- Per-kurs sparkline i kurs-kort.
- Confidence-trend-kurve (hvis man vil se stagnasjon, ikke bare progresjon).
- Flette Studieaktivitet + Læringskurve til ett dashboard-kort med delelinje.
