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
      ? `\nFør studenten svarte, oppga de selv at de følte seg ${CONFIDENCE_LABEL[confidence]} (${confidence}/3) på dette konseptet.`
      : "";

  const calibrationStep = confidence
    ? `
3. Si kort om selvvurderingen deres stemte:
   - Lav trygghet + godt svar → "Du kunne mer enn du trodde."
   - Høy trygghet + svakt svar → "Du var tryggere enn grunnlaget tilsier — se på …"
   - Ellers → "Godt kalibrert."`
    : "";

  const finalStep = confidence ? "4" : "3";

  const result = streamText({
    model,
    prompt: `Du er en lærer som evaluerer en students svar.

Konsept: ${concept}
Spørsmål: ${question}
Korrekt svar (fasit): ${correctAnswer}
Students svar: ${userAnswer}${confidenceLine}

Evaluer svaret kortfattet (2–4 setninger):
1. Hva studenten har riktig
2. Hva som mangler eller er upresist${calibrationStep}
${finalStep}. Avslutt med enten "✓ Du har vist god forståelse." ELLER "↻ Prøv å utdype [spesifikt punkt]."

Vær konstruktiv og konkret. Svar på norsk.`,
  });

  return result.toTextStreamResponse();
}
