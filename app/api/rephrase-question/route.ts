import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const OutputSchema = z.object({
  variants: z.array(z.string()).length(3),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";
  const lang = req.headers.get("X-Language") ?? "no";

  if (!apiKey) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }

  const { concept, question, answer } = await req.json();

  if (!concept || !question || !answer) {
    return NextResponse.json({ error: "Mangler felter" }, { status: 400 });
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const rephrasePrompt = lang === "en"
    ? `Create three alternative phrasings of the same flashcard question. The purpose is for the learner to encounter the same concept with different wording each time, so that learning becomes deep understanding rather than memorising a specific sentence.

Concept: ${concept}
Original question: ${question}
Answer key (preserved. All three variants must have this as a valid answer): ${answer}

Create three different phrasings. Use three different angles from this list:
- "Explain this to a ten-year-old."
- "What is the motivation behind ${concept.toLowerCase()}?"
- "How would you explain ${concept.toLowerCase()} with a concrete example?"
- "What distinguishes ${concept.toLowerCase()} from related concepts?"
- "What happens if we remove or ignore ${concept.toLowerCase()}?"
- "Why does ${concept.toLowerCase()} matter in practice?"

Choose three angles that genuinely fit the concept (do not force angles that produce an awkward question).

Requirements:
- Each variant is one question, max approximately 180 characters, short enough for a flashcard.
- The answer key must still be a valid answer to each variant.
- Write in English.
- Do not include the answer in the question.
- Do not number the variants. Return them as plain text.
- Do not use dashes (em-dash — or en-dash –) in any variant. Use commas, periods, colons, or parentheses.`
    : `Du skal lage tre alternative formuleringer av samme flashcard-spørsmål. Formålet er at den som lærer møter samme konsept med ulik ordlyd hver gang, så læringen blir dyp forståelse i stedet for å huske en bestemt setning.

Konsept: ${concept}
Originalt spørsmål: ${question}
Fasit (bevares. Alle tre variantene må ha dette som gyldig svar): ${answer}

Lag tre ulike formuleringer. Bruk tre forskjellige vinkler fra denne listen:
- "Forklar dette for en tiåring."
- "Hva er motivasjonen bak ${concept.toLowerCase()}?"
- "Hvordan vil du forklare ${concept.toLowerCase()} med et konkret eksempel?"
- "Hva skiller ${concept.toLowerCase()} fra nære begreper?"
- "Hva skjer hvis vi fjerner eller overser ${concept.toLowerCase()}?"
- "Hvorfor er ${concept.toLowerCase()} viktig i praksis?"

Velg tre vinkler som faktisk passer konseptet (ikke tving fram vinkler som gir rart spørsmål).

Krav:
- Hver variant er ett spørsmål, maks ca. 180 tegn, kort nok til et flashcard.
- Fasiten må fortsatt være et gyldig svar på hver variant.
- Skriv på norsk.
- Ikke inkluder svaret i spørsmålet.
- Ikke nummerer variantene. Returner dem som ren tekst.
- Ikke bruk tankestreker (em-dash — eller en-dash –) i noen variant. Bruk komma, punktum, kolon eller parenteser.`;

  try {
    const result = await generateObject({
      model,
      schema: OutputSchema,
      prompt: rephrasePrompt,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      },
    });

    return NextResponse.json({ variants: result.object.variants });
  } catch {
    return NextResponse.json({ variants: [] }, { status: 200 });
  }
}
