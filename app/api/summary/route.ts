import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { guardApiRequest } from "@/lib/api-guard";

const SOURCE_TEXT_CAP = 30 * 1024;

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";

  if (!apiKey) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }

  const lang = req.headers.get("X-Language") ?? "no";
  const { sourceText } = await req.json();

  if (typeof sourceText !== "string" || sourceText.trim().length === 0) {
    return NextResponse.json({ error: "Mangler kildetekst" }, { status: 400 });
  }

  const trimmed = sourceText.length > SOURCE_TEXT_CAP ? sourceText.slice(0, SOURCE_TEXT_CAP) : sourceText;

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const summaryPrompt = lang === "en"
    ? `Write a brief summary of the text below. 2 to 3 sentences, flowing prose, no bullet points or headings. Capture the main theme and main argument, not just the title. Write objectively in third person, such as "The text argues that..." or "The author shows that..." or "The article describes...". Do not address the reader and do not use second person.

Do not use dashes (em-dash — or en-dash –). Use commas, periods, colons, or parentheses instead.

Answer in English.

Text:
"""
${trimmed}
"""`
    : `Lag et kort sammendrag av teksten under. 2 til 3 setninger, løpende prosa, ingen kulepunkter eller overskrifter. Fang hovedtemaet og hovedargumentet, ikke bare tittelen. Skriv objektivt i tredjeperson, som "Teksten argumenterer for..." eller "Forfatteren viser at..." eller "Artikkelen beskriver...". Ikke henvend deg til leseren og ikke bruk du-form.

Ikke bruk tankestreker (em-dash — eller en-dash –). Bruk komma, punktum, kolon eller parenteser i stedet.

Svar på norsk.

Tekst:
"""
${trimmed}
"""`;

  try {
    const { text } = await generateText({
      model,
      prompt: summaryPrompt,
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
