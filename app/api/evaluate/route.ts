import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const CONFIDENCE_LABEL: Record<number, string> = {
  1: "usikker",
  2: "delvis trygg",
  3: "trygg",
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

  const confidenceLine =
    confidence && CONFIDENCE_LABEL[confidence]
      ? `\nFør studenten svarte, oppga de selv at de følte seg ${CONFIDENCE_LABEL[confidence]} (${confidence}/3).`
      : "";

  const calibrationGuide = confidence
    ? ` Vev inn en kort kommentar om selvvurderingen — lav trygghet + godt svar ("du kunne mer enn du trodde"), høy trygghet + svakt svar ("du var tryggere enn grunnlaget tilsier"), eller "godt kalibrert" hvis det passer — men ikke som en egen overskrift, bare naturlig i teksten.`
    : "";

  const result = streamText({
    model,
    prompt: `Du er en erfaren lærer som gir en kort, personlig tilbakemelding på en students frie svar.

Konsept: ${concept}
Spørsmål: ${question}
Fasit (til din bruk, ikke siteres): ${correctAnswer}
Students svar: ${userAnswer}${confidenceLine}

Skriv tilbakemeldingen som løpende prosa på 3–5 setninger. Ikke bruk kulepunkter. Ikke bruk overskrifter som "Hva studenten har riktig:", "Selvvurdering:" eller "Avslutning:". Skriv som om du snakker til studenten ansikt til ansikt.

Tilbakemeldingen skal naturlig:
- Anerkjenne konkret hva studenten faktisk fikk fram (bruk formuleringen deres hvis mulig).
- Trekke fram den ene viktigste svakheten eller det største hullet — ikke list opp alle.${calibrationGuide}

Avslutt med én tydelig avslutningssetning på egen linje, uten kulepunkt:
- "✓ Du har vist god forståelse." hvis svaret i hovedsak dekker kjernen.
- "↻ Prøv å [konkret hva]." hvis det mangler noe vesentlig — og vær spesifikk i det som skal utdypes, ikke generisk.

Vær konstruktiv, konkret og menneskelig. Skriv på norsk.`,
  });

  return result.toTextStreamResponse();
}
