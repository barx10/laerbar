import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const OutputSchema = z.object({
  variants: z.array(z.string()).length(3),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return NextResponse.json({ error: "Mangler API-nøkkel" }, { status: 401 });
  }

  const { concept, question, answer } = await req.json();

  if (!concept || !question || !answer) {
    return NextResponse.json({ error: "Mangler felter" }, { status: 400 });
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  try {
    const result = await generateObject({
      model,
      schema: OutputSchema,
      prompt: `Du skal lage tre alternative formuleringer av samme flashcard-spørsmål. Formålet er at den som lærer møter samme konsept med ulik ordlyd hver gang, så læringen blir dyp forståelse i stedet for å huske en bestemt setning.

Konsept: ${concept}
Originalt spørsmål: ${question}
Fasit (bevares — alle tre variantene må ha dette som gyldig svar): ${answer}

Lag tre ulike formuleringer. Bruk tre forskjellige vinkler fra denne listen:
- "Forklar dette for en tiåring."
- "Hva er motivasjonen bak ${concept.toLowerCase()}?"
- "Hvordan vil du forklare ${concept.toLowerCase()} med et konkret eksempel?"
- "Hva skiller ${concept.toLowerCase()} fra nære begreper?"
- "Hva skjer hvis vi fjerner / overser ${concept.toLowerCase()}?"
- "Hvorfor er ${concept.toLowerCase()} viktig i praksis?"

Velg tre vinkler som faktisk passer konseptet (ikke tving fram vinkler som gir rart spørsmål).

Krav:
- Hver variant er ett spørsmål, maks ~180 tegn, kort nok til et flashcard.
- Fasiten må fortsatt være et gyldig svar på hver variant.
- Skriv på norsk.
- Ikke inkluder svaret i spørsmålet.
- Ikke nummerer variantene — returner dem som ren tekst.`,
    });

    return NextResponse.json({ variants: result.object.variants });
  } catch {
    return NextResponse.json({ variants: [] }, { status: 200 });
  }
}
