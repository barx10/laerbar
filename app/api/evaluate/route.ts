import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { concept, question, correctAnswer, userAnswer } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const result = streamText({
    model,
    prompt: `Du er en lærer som evaluerer en students svar.

Konsept: ${concept}
Spørsmål: ${question}
Korrekt svar (fasit): ${correctAnswer}
Students svar: ${userAnswer}

Evaluer svaret kortfattet (2–4 setninger):
1. Hva studenten har riktig
2. Hva som mangler eller er upresist
3. Avslutt med enten "✓ Du har vist god forståelse." ELLER "↻ Prøv å utdype [spesifikt punkt]."

Vær konstruktiv og konkret. Svar på norsk.`,
  });

  return result.toTextStreamResponse();
}
