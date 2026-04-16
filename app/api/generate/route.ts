import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const ConceptSchema = z.object({
  title: z.string(),
  question: z.string(),
  answer: z.string(),
  hint: z.string(),
  flashcard_front: z.string(),
  flashcard_back: z.string(),
});

const OutputSchema = z.object({
  title: z.string(),
  concepts: z.array(ConceptSchema).min(3).max(12),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Mangler fil" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Filen er for stor (maks 20MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const { object } = await generateObject({
    model,
    schema: OutputSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: base64,
            mediaType: "application/pdf",
          },
          {
            type: "text",
            text: `Du er en pedagogisk ekspert. Analyser dette fagstoffet og trekk ut de 5–10 viktigste kjernekonseptene.

For hvert konsept skal du lage:
- Et klart konseptnavn (title)
- Et åpent spørsmål som krever forståelse, ikke bare hukommelse (question)
- Et utdypende svar med nyanser og kontekst (answer)
- En ledetråd som hjelper uten å avsløre svaret (hint)
- Et kort spørsmål for flashcard (flashcard_front)
- Et kort svar for flashcard (flashcard_back)

Lag et passe tittel for dokumentet (title).
Spørsmålene skal utfordre til refleksjon — ikke bare "hva er X?" men "hvorfor/hvordan/hvilken sammenheng?"
Svar på norsk.`,
          },
        ],
      },
    ],
  });

  return NextResponse.json(object);
}
