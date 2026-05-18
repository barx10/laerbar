import { NextRequest, NextResponse } from "next/server";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { guardApiRequest } from "@/lib/api-guard";
import { getRequestContext } from "@/lib/api-context";
import { createGeminiModel } from "@/lib/ai";
import { noDashesInstruction } from "@/lib/prompts";
import type { LanguageModel } from "ai";

const SOURCE_TEXT_CAP = 80 * 1024; // bytes of raw text we keep per kurs

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
  concepts: z.array(ConceptSchema).min(7).max(12),
});

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const ctx = getRequestContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }
  const { apiKey, modelId, lang } = ctx;

  let fileUri: string;
  try {
    const body = await req.json();
    fileUri = body?.fileUri;
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  if (!fileUri || typeof fileUri !== "string") {
    return NextResponse.json({ error: "Mangler fil-URI" }, { status: 400 });
  }

  let fileUrl: URL;
  try {
    fileUrl = new URL(fileUri);
    if (!fileUrl.hostname.endsWith("googleapis.com")) {
      throw new Error("not googleapis");
    }
  } catch {
    return NextResponse.json({ error: "Ugyldig fil-URI" }, { status: 400 });
  }

  const model = createGeminiModel(apiKey, modelId);

  const conceptPrompt = lang === "en"
    ? `You are a pedagogical expert. Analyse this study material and extract the 7 to 12 most important core concepts.

For each concept create:
- A clear concept name (title)
- An open question requiring understanding, not just recall (question)
- A thorough answer with nuance and context (answer)
- A clue that helps without revealing the answer (hint)
- A short question for the flashcard front (flashcard_front)
- A short answer for the flashcard back (flashcard_back)

Create a fitting title for the document (title).
Questions should challenge reflection, not just "what is X?" but "why / how / in what context?"

${noDashesInstruction("en")} Applies to every field.

Answer in English.`
    : `Du er en pedagogisk ekspert. Analyser dette fagstoffet og trekk ut de 7 til 12 viktigste kjernekonseptene.

For hvert konsept skal du lage:
- Et klart konseptnavn (title)
- Et åpent spørsmål som krever forståelse, ikke bare hukommelse (question)
- Et utdypende svar med nyanser og kontekst (answer)
- En ledetråd som hjelper uten å avsløre svaret (hint)
- Et kort spørsmål for flashcard (flashcard_front)
- Et kort svar for flashcard (flashcard_back)

Lag et passe tittel for dokumentet (title).
Spørsmålene skal utfordre til refleksjon, ikke bare "hva er X?" men "hvorfor/hvordan/hvilken sammenheng?"

${noDashesInstruction("no")} Gjelder alle felter.

Svar på norsk.`;

  try {
    const [conceptResult, sourceText] = await Promise.all([
      generateObject({
        model,
        schema: OutputSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "file",
                data: fileUrl,
                mediaType: "application/pdf",
              },
              {
                type: "text",
                text: conceptPrompt,
              },
            ],
          },
        ],
      }),
      extractSourceText(model, fileUrl),
    ]);
    return NextResponse.json({ ...conceptResult.object, source_text: sourceText });
  } catch (err) {
    console.error("[/api/generate] generation failed", err);
    return NextResponse.json(
      { error: "Vi klarte ikke hente ut konsepter fra PDFen. Prøv en annen fil eller en annen modell." },
      { status: 422 },
    );
  }
}

async function extractSourceText(
  model: LanguageModel,
  fileUrl: URL,
): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      maxOutputTokens: 14000,
      messages: [
        {
          role: "user",
          content: [
            { type: "file", data: fileUrl, mediaType: "application/pdf" },
            {
              type: "text",
              text: `Returner det fulle tekstinnholdet fra dette dokumentet verbatim, altså ren tekst uten oppsummering, kommentarer eller markdown. Ikke omformuler. Hopp gjerne over sidetall og kolontitler, men behold selve teksten.`,
            },
          ],
        },
      ],
    });
    return text.slice(0, SOURCE_TEXT_CAP);
  } catch {
    return "";
  }
}
