import { NextRequest, NextResponse } from "next/server";
import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { guardApiRequest } from "@/lib/api-guard";

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
  concepts: z.array(ConceptSchema).min(3).max(12),
});

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";
  const lang = req.headers.get("X-Language") ?? "no";

  if (!apiKey) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Mangler fil" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Filen må være en PDF" }, { status: 415 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Filen er for stor (maks 20MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const conceptPrompt = lang === "en"
    ? `You are a pedagogical expert. Analyse this study material and extract the 5 to 10 most important core concepts.

For each concept create:
- A clear concept name (title)
- An open question requiring understanding, not just recall (question)
- A thorough answer with nuance and context (answer)
- A clue that helps without revealing the answer (hint)
- A short question for the flashcard front (flashcard_front)
- A short answer for the flashcard back (flashcard_back)

Create a fitting title for the document (title).
Questions should challenge reflection, not just "what is X?" but "why / how / in what context?"

Do not use dashes in any field — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. Only regular hyphens (-) in compound words are allowed.

Answer in English.`
    : `Du er en pedagogisk ekspert. Analyser dette fagstoffet og trekk ut de 5 til 10 viktigste kjernekonseptene.

For hvert konsept skal du lage:
- Et klart konseptnavn (title)
- Et åpent spørsmål som krever forståelse, ikke bare hukommelse (question)
- Et utdypende svar med nyanser og kontekst (answer)
- En ledetråd som hjelper uten å avsløre svaret (hint)
- Et kort spørsmål for flashcard (flashcard_front)
- Et kort svar for flashcard (flashcard_back)

Lag et passe tittel for dokumentet (title).
Spørsmålene skal utfordre til refleksjon, ikke bare "hva er X?" men "hvorfor/hvordan/hvilken sammenheng?"

Ikke bruk tankestreker i noe felt. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.

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
                data: base64,
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
      extractSourceText(model, base64),
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
  model: ReturnType<ReturnType<typeof createGoogleGenerativeAI>>,
  base64: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "file", data: base64, mediaType: "application/pdf" },
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
