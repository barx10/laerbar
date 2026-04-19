import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Skalaen må være entydig for modellen. Tidligere sendte vi bare "3/3",
// og modellen tolket tallet som lavt på skalaen og snudde kalibreringen.
const CONFIDENCE_LEVEL: Record<number, { label: string; tier: "lav" | "middels" | "høy" }> = {
  1: { label: "usikker", tier: "lav" },
  2: { label: "delvis trygg", tier: "middels" },
  3: { label: "trygg", tier: "høy" },
};

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { concept, question, correctAnswer, userAnswer, confidence } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const level = confidence ? CONFIDENCE_LEVEL[confidence] : null;

  const confidenceLine = level
    ? `\nPå en tryggetsskala med tre steg, usikker (lav), delvis trygg (middels), trygg (høy), oppga du "${level.label}" før du svarte. Dette er ${level.tier} selvtillit.`
    : "";

  // Deterministisk kalibreringstabell. Modellen MÅ velge eksakt én av de fire
  // cellene basert på (tier, dekker kjernen). "Dekker kjernen" = samme avgjørelse
  // som avgjør om avslutningen blir ✓ eller ↻ — de to må stemme overens.
  const calibrationGuide = level
    ? `

Kalibrering (obligatorisk, én setning flettet inn i prosaen, ikke egen overskrift):

Brukerens selvtillit var ${level.tier}. Velg eksakt én formulering ut fra tabellen:

| Selvtillit | Svaret dekker kjernen (→ ✓) | Svaret dekker ikke kjernen (→ ↻) |
|-----------|------------------------------|----------------------------------|
| lav       | "du kunne mer enn du trodde" | "godt kalibrert"                 |
| middels   | "godt kalibrert"             | "godt kalibrert"                 |
| høy       | "godt kalibrert"             | "du var tryggere enn grunnlaget tilsier" |

Avslutningssetningen (✓ eller ↻) MÅ stemme med raden du velger fra. Du kan aldri skrive "du var tryggere enn grunnlaget tilsier" og samtidig avslutte med "✓ Du har vist god forståelse", det er selvmotsigende. Hvis du er i tvil, velg "godt kalibrert".`
    : "";

  const result = streamText({
    model,
    prompt: `Du er en erfaren faglig veileder. Du henvender deg direkte til en voksen som tilegner seg ny kunnskap, i du-form. Skriv aldri om "eleven", "studenten" eller "brukeren" i tredjeperson. Snakk alltid til personen ("du har", "svaret ditt", "du kunne utdype").

VIKTIG om perspektiv: Personen som svarer er ikke nødvendigvis subjektet i sitt eget svar. Hvis svaret handler om "elever", "pasienter", "kunder", "ansatte", "brukere" osv., så er dette innholdet i fagstoffet. Det er ikke en beskrivelse av personen du snakker med, og deres motivasjon, fremtid eller hverdag. Bevar subjektene som de står i svaret. Skriv aldri "din motivasjon" eller "din fremtid" når svaret faktisk handler om en tredje gruppe.

Konsept: ${concept}
Spørsmål: ${question}
Fasit (til din bruk, ikke siteres): ${correctAnswer}
Svaret som ble skrevet: ${userAnswer}${confidenceLine}

Viktig om omformuleringer: Fasiten er fasit, ikke en bestemt ordlyd. Hvis svaret uttrykker samme poeng med andre ord, er det dekning, ikke et hull. Eksempel: "lærere bruker timen til norsk eller matte" dekker "administrativ sluttstasjon / nedprioritert fag". Du skal lete etter *substansielle* hull, ikke ordforskjeller.

Skriv tilbakemeldingen som løpende prosa på 3 til 5 setninger. Ikke bruk kulepunkter. Ikke bruk overskrifter som "Hva du har riktig:", "Selvvurdering:" eller "Avslutning:". Skriv som om du snakker ansikt til ansikt.

Struktur:
- Maks én anerkjennelse, kort og konkret, helt i starten (én setning, ikke flere lag med ros). Ingen overdrivelser ("strålende", "veldig bra"), ingen smil og emoji. Bare nøkternt hva som ble fanget.
- Resten skal være konstruktiv. Hvis svaret mangler noe vesentlig (utover ren omformulering), pek på det konkret. Hvis svaret faktisk dekker kjernen, ikke fabrikkér et hull, men pek på hvor du kan skjerpe formuleringen, gå et hakk dypere, eller knytte poenget til noe annet i fagstoffet. Selv et godt svar har en strekkmuligheter.${calibrationGuide}

Avslutt med én tydelig avslutningssetning på egen linje, uten kulepunkt:
- "✓ Du har vist god forståelse." hvis svaret i hovedsak dekker kjernen.
- "↻ Prøv å [konkret hva]." hvis det mangler noe vesentlig. Vær spesifikk i det som skal utdypes, ikke generisk.

STREKK OG TEGN som IKKE skal brukes i svaret: Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Dette gjelder hele svaret, inkludert avslutningssetningen. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.

Vær konstruktiv, konkret og menneskelig. Skriv på norsk, alltid i du-form.`,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    },
  });

  return result.toTextStreamResponse();
}
