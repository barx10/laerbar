# Lærbar — Produktspesifikasjon

## Konsept

Brukere laster opp fagstoff (PDF), og AI bryter det ned til **kjernekonsepter**. Læringsløpet bygger på aktiv gjenkalling: brukeren må *bevise* at de kan hvert konsept før neste låses opp — ikke lese passivt.

Inspirert av [fagdykk](https://github.com/barx10/fagdykk), men med fokus på interaktiv læring fremfor analyse.

---

## Fase 1 — Personlig verktøy (BYOK)

- Ingen innlogging, ingen database
- Brukeren tar med sin egen Gemini API-nøkkel
- Kurs lagres i LocalStorage/IndexedDB i browseren
- Nedlasting som HTML-fil er primær "eksport" og langtidslagring

---

## Funksjoner

### 1. PDF-opplasting
- Dra-og-slipp eller klikk-for-å-velge
- Maks 20MB (samme som fagdykk)
- Progressiv parsing-animasjon mens AI analyserer
- AI trekker ut 5–10 **kjernekonsepter** fra dokumentet

### 2. Læringsmodus (tab-basert)

```
[ Oversikt ] [ Lær ] [ Flashcards ] [ Last ned ]
```

#### Oversikt
- Visuelt kart over alle kjernekonsepter
- Hvert konsept vises som et kort: låst (grå), under arbeid eller mestret (grønn)
- Knapp: "Spør AI-en" — fri chat om hele dokumentet

#### Lær — kjerneloopen
1. AI stiller ett åpent spørsmål om neste konsept
2. Brukeren skriver fritt svar (ikke multiple choice)
3. AI evaluerer svaret:
   - ✓ **Mestret** — neste konsept låses opp
   - ↻ **Prøv igjen** — AI gir presist hint om hva som mangler
4. Kontekstuell AI-chat under evalueringen: *"Usikker? Spør AI-en"*

#### Flashcards
- Auto-generert fra konseptene brukeren sliter med
- Enkel flip-animasjon (forside / bakside)
- Eksport til **Anki-format** (.apkg)

#### Last ned
- Selvinneholdt HTML-fil med alt innhold
- Inkluderer spørsmål, svar, flashcards og kjernekonsepter
- Kan åpnes offline

### 3. Kurshistorikk
- Tidligere kurs lagres i LocalStorage
- Forsiden viser liste: tittel, dato, antall konsepter mestret
- Klikk for å gjenoppta et kurs uten å laste opp PDF på nytt

### 4. Innstillinger
- Modal tilgjengelig fra alle sider
- Gemini API-nøkkel (lagres som `laerbar_google_key` i LocalStorage)
- Modellvalg: Gemini 2.5 Flash Lite / Gemini 3 Flash Preview / Gemini 3.1 Flash Lite Preview

---

## UX-flyt

```
Forside (historikk + "Last opp ny")
  └── Upload-side
        └── Parsing-animasjon ("Fant 8 kjernekonsepter")
              └── Læringsmodus
                    ├── [ Oversikt ] — konseptkart + fri AI-chat
                    ├── [ Lær ]      — aktiv gjenkalling + kontekstuell AI-chat
                    ├── [ Flashcards ] — review + Anki-eksport
                    └── [ Last ned ] — HTML-eksport
```

---

## Datamodell (LocalStorage/IndexedDB)

```js
// Innstillinger
localStorage.laerbar_google_key     // API-nøkkel (klartekst, samme som fagdykk)
localStorage.laerbar_model          // Valgt modell

// Kurshistorikk (IndexedDB eller localStorage som JSON)
courses: [
  {
    id: "uuid",
    title: "Dokumenttittel",
    created_at: "ISO8601",
    concepts: [
      {
        id: "uuid",
        title: "Konseptnavn",
        question: "Spørsmål fra AI",
        answer: "Fasit",
        hint: "Hint",
        mastered: false,
        flashcard_front: "...",
        flashcard_back: "..."
      }
    ],
    full_content: { /* rå JSON fra AI */ }
  }
]
```

---

## AI-prompt-mønster

AI returnerer strukturert JSON i én request (samme mønster som fagdykk):

```json
{
  "title": "Dokumenttittel",
  "concepts": [
    {
      "title": "Konseptnavn",
      "question": "Åpent spørsmål som krever forståelse",
      "answer": "Utdypende fasit",
      "hint": "Ledetråd hvis brukeren står fast",
      "flashcard_front": "Kort spørsmål for flashcard",
      "flashcard_back": "Kort svar for flashcard"
    }
  ]
}
```

Evaluering av brukerens svar skjer i en **separat streaming-request** med konsept + fasit + brukerens svar som kontekst.

---

## Fase 2 (fremtidig)

- Supabase Auth + database (kurs synkroniseres på tvers av enheter)
- Medlemsmodell (gratis tier med begrenset bruk, betalt tier uten grenser)
- Støtte for OpenAI-modeller
- Støtte for DOCX og URL-input (som fagdykk)
- Spaced repetition for flashcards
