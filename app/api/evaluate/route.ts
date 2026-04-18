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
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { concept, question, correctAnswer, userAnswer, confidence } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const level = confidence ? CONFIDENCE_LEVEL[confidence] : null;

  const confidenceLine = level
    ? `\nPå en tryggetsskala med tre steg — usikker (lav), delvis trygg (middels), trygg (høy) — oppga du "${level.label}" før du svarte. Dette er ${level.tier} selvtillit.`
    : "";

  const calibrationGuide = level
    ? ` Vev inn én kort naturlig kommentar om kalibreringen. Brukerens selvtillit var ${level.tier}. Regler: lav selvtillit + godt svar → "du kunne mer enn du trodde"; høy selvtillit + svakt svar → "du var tryggere enn grunnlaget tilsier"; ellers → "godt kalibrert". Ikke bruk egen overskrift — skriv det naturlig inn i prosaen.`
    : "";

  const result = streamText({
    model,
    prompt: `Du er en erfaren lærer. Du henvender deg direkte til den som lærer, i du-form. Skriv aldri om "eleven", "studenten" eller "brukeren" i tredjeperson — snakk alltid til personen ("du har", "svaret ditt", "du kunne utdype").

Konsept: ${concept}
Spørsmål: ${question}
Fasit (til din bruk, ikke siteres): ${correctAnswer}
Svaret som ble skrevet: ${userAnswer}${confidenceLine}

Viktig om omformuleringer: Fasiten er fasit, ikke en bestemt ordlyd. Hvis svaret uttrykker samme poeng med andre ord, er det dekning — ikke et hull. Eksempel: "lærere bruker timen til norsk eller matte" dekker "administrativ sluttstasjon / nedprioritert fag". Du skal lete etter *substansielle* hull, ikke ordforskjeller.

Skriv tilbakemeldingen som løpende prosa på 3–5 setninger. Ikke bruk kulepunkter. Ikke bruk overskrifter som "Hva du har riktig:", "Selvvurdering:" eller "Avslutning:". Skriv som om du snakker ansikt til ansikt.

Tilbakemeldingen skal naturlig:
- Anerkjenne konkret hva du fikk fram (bruk gjerne formuleringen din hvis mulig).
- Trekke fram den ene viktigste svakheten *bare hvis det faktisk mangler noe vesentlig* som verken er dekket direkte eller gjennom omformulering. Hvis svaret dekker kjernen — selv med egne ord — ikke fabrikkér et hull for å ha noe å peke på. Da sier du heller at poenget er dekket.${calibrationGuide}

Avslutt med én tydelig avslutningssetning på egen linje, uten kulepunkt:
- "✓ Du har vist god forståelse." hvis svaret i hovedsak dekker kjernen.
- "↻ Prøv å [konkret hva]." hvis det mangler noe vesentlig — og vær spesifikk i det som skal utdypes, ikke generisk.

Vær konstruktiv, konkret og menneskelig. Skriv på norsk, alltid i du-form.`,
  });

  return result.toTextStreamResponse();
}
