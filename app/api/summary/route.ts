import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { guardApiRequest } from "@/lib/api-guard";
import { getRequestContext } from "@/lib/api-context";
import { createGeminiModel, GEMINI_NO_THINK_OPTS } from "@/lib/ai";
import { noDashesInstruction } from "@/lib/prompts";

const SOURCE_TEXT_CAP = 30 * 1024;

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const ctx = getRequestContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }
  const { apiKey, modelId, lang } = ctx;

  const { sourceText } = await req.json();

  if (typeof sourceText !== "string" || sourceText.trim().length === 0) {
    return NextResponse.json({ error: "Mangler kildetekst" }, { status: 400 });
  }

  const trimmed = sourceText.length > SOURCE_TEXT_CAP ? sourceText.slice(0, SOURCE_TEXT_CAP) : sourceText;

  const model = createGeminiModel(apiKey, modelId);

  const summaryPrompt = lang === "en"
    ? `Write a brief summary of the text below. 2 to 3 sentences, flowing prose, no bullet points or headings. Capture the main theme and main argument, not just the title. Write objectively in third person, such as "The text argues that..." or "The author shows that..." or "The article describes...". Do not address the reader and do not use second person.

${noDashesInstruction("en")}

Answer in English.

Text:
"""
${trimmed}
"""`
    : `Lag et kort sammendrag av teksten under. 2 til 3 setninger, løpende prosa, ingen kulepunkter eller overskrifter. Fang hovedtemaet og hovedargumentet, ikke bare tittelen. Skriv objektivt i tredjeperson, som "Teksten argumenterer for..." eller "Forfatteren viser at..." eller "Artikkelen beskriver...". Ikke henvend deg til leseren og ikke bruk du-form.

${noDashesInstruction("no")}

Svar på norsk.

Tekst:
"""
${trimmed}
"""`;

  try {
    const { text } = await generateText({
      model,
      prompt: summaryPrompt,
      providerOptions: GEMINI_NO_THINK_OPTS,
    });
    return NextResponse.json({ summary: text.trim() });
  } catch {
    return NextResponse.json({ error: "Klarte ikke å lage sammendrag" }, { status: 500 });
  }
}
