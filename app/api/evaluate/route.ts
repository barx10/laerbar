import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { guardApiRequest } from "@/lib/api-guard";

// Skalaen må være entydig for modellen. Tidligere sendte vi bare "3/3",
// og modellen tolket tallet som lavt på skalaen og snudde kalibreringen.
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

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";
  const lang = req.headers.get("X-Language") ?? "no";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { concept, question, correctAnswer, userAnswer, confidence } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const CONFIDENCE_LEVEL = lang === "en" ? CONFIDENCE_LEVEL_EN : CONFIDENCE_LEVEL_NO;
  const level = confidence ? CONFIDENCE_LEVEL[confidence] : null;

  const confidenceLine = level
    ? lang === "en"
      ? `\nOn a three-step confidence scale, uncertain (low), partially confident (medium), confident (high), you rated yourself "${level.label}" before answering. This is ${level.tier} confidence.`
      : `\nPå en tryggetsskala med tre steg, usikker (lav), delvis trygg (middels), trygg (høy), oppga du "${level.label}" før du svarte. Dette er ${level.tier} selvtillit.`
    : "";

  // Deterministisk kalibreringstabell. Modellen MÅ velge eksakt én av de fire
  // cellene basert på (tier, dekker kjernen). "Dekker kjernen" = samme avgjørelse
  // som avgjør om avslutningen blir ✓ eller ↻ — de to må stemme overens.
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

Viktig om omformuleringer: Fasiten er fasit, ikke en bestemt ordlyd. Hvis svaret uttrykker samme poeng med andre ord, er det dekning, ikke et hull. Eksempel: "lærere bruker timen til norsk eller matte" dekker "administrativ sluttstasjon / nedprioritert fag". Du skal lete etter *substansielle* hull, ikke ordforskjeller.

Skriv tilbakemeldingen som løpende prosa på 3 til 5 setninger. Ikke bruk kulepunkter. Ikke bruk overskrifter som "Hva du har riktig:", "Selvvurdering:" eller "Avslutning:". Skriv som om du snakker ansikt til ansikt.

Struktur:
- Maks én anerkjennelse, kort og konkret, helt i starten (én setning, ikke flere lag med ros). Ingen overdrivelser ("strålende", "veldig bra"), ingen smil og emoji. Bare nøkternt hva som ble fanget.
- Resten skal være konstruktiv. Hvis svaret mangler noe vesentlig (utover ren omformulering), pek på det konkret. Hvis svaret faktisk dekker kjernen, ikke fabrikkér et hull, men pek på hvor du kan skjerpe formuleringen, gå et hakk dypere, eller knytte poenget til noe annet i fagstoffet. Selv et godt svar har en strekkmuligheter.${calibrationGuide}

Avslutt med én tydelig avslutningssetning på egen linje, uten kulepunkt:
- "✓ Du har vist god forståelse." hvis svaret i hovedsak dekker kjernen.
- "↻ Prøv å [konkret hva]." hvis det mangler noe vesentlig. Vær spesifikk i det som skal utdypes, ikke generisk.

STREKK OG TEGN som IKKE skal brukes i svaret: Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.

Vær konstruktiv, konkret og menneskelig. Skriv på norsk, alltid i du-form.`;

  const result = streamText({
    model,
    prompt,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    },
  });

  return result.toTextStreamResponse();
}
