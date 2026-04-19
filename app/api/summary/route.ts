import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const SOURCE_TEXT_CAP = 30 * 1024;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";

  if (!apiKey) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }

  const { sourceText } = await req.json();

  if (typeof sourceText !== "string" || sourceText.trim().length === 0) {
    return NextResponse.json({ error: "Mangler kildetekst" }, { status: 400 });
  }

  const trimmed = sourceText.length > SOURCE_TEXT_CAP ? sourceText.slice(0, SOURCE_TEXT_CAP) : sourceText;

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  try {
    const { text } = await generateText({
      model,
      prompt: `Lag et kort sammendrag av teksten under. 2 til 3 setninger, løpende prosa, ingen kulepunkter eller overskrifter. Fang hovedtemaet og hovedargumentet, ikke bare tittelen. Du henvender deg i du-form.

Ikke bruk tankestreker (em-dash — eller en-dash –). Bruk komma, punktum, kolon eller parenteser i stedet.

Svar på norsk.

Tekst:
"""
${trimmed}
"""`,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      },
    });
    return NextResponse.json({ summary: text.trim() });
  } catch {
    return NextResponse.json({ error: "Klarte ikke å lage sammendrag" }, { status: 500 });
  }
}
