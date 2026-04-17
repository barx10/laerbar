import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { concept, conceptAnswer, message, history } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const messages = [
    ...(history ?? []).map((h: { role: string; text: string }) => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.text,
    })),
    { role: "user" as const, content: message },
  ];

  const result = streamText({
    model,
    system: `Du er en hjelpsom AI-tutor. Brukeren holder på å lære om konseptet "${concept}".
Fasiten for dette konseptet er: ${conceptAnswer}

Brukeren kan skrive et spørsmål, en tanke, en delvis forståelse, eller bare en kommentar. Svar direkte og hjelpsomt uavhengig av form.

Viktig:
- Ikke start svaret med fraser som "Bra spørsmål!", "Godt tenkt!" eller lignende ros som ikke tilfører noe.
- Gi ikke fasitsvaret direkte. Veiled, still motspørsmål, gi hint.
- Vær kortfattet. Svar på norsk.`,
    messages,
  });

  return result.toTextStreamResponse();
}
