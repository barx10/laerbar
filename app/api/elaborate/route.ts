import { NextRequest } from "next/server";
import { streamText, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const NO_DASHES = `STREKK OG TEGN som IKKE skal brukes: Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.`;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const body = await req.json();
  const { concept, question, correctAnswer, userAnswer, userElaboration, elaborationQuestion } = body;

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  // Modus 1: generer ett utvidende oppfølgingsspørsmål.
  if (!userElaboration) {
    const result = await generateText({
      model,
      prompt: `Du er en erfaren lærer. Du har nettopp evaluert et svar fra en elev og vil hjelpe hen å forankre forståelsen dypere gjennom elaborering.

Konsept: ${concept}
Opprinnelig spørsmål: ${question}
Fasit: ${correctAnswer}
Det eleven svarte: ${userAnswer}

Velg ETT av disse tre elaboreringsspørsmålene basert på hva som passer best for konseptet og svaret:

(a) Et "hvorfor"-spørsmål som tvinger frem den underliggende mekanismen eller årsaken.
(b) Be om et konkret eget eksempel fra hverdag, klasserom eller praksis (passer best når konseptet er anvendbart).
(c) Be eleven beskrive den vanligste feiltolkningen og hvorfor den er feil (passer best for nyanserte begreper der misforståelser ligger nært).

Velg den varianten som vil gi sterkest læring for nettopp dette konseptet og svaret. Ikke forklar valget. Skriv bare selve spørsmålet, en til to setninger, direkte til eleven i du-form.

${NO_DASHES}

Skriv på norsk.`,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      },
    });

    return Response.json({ question: result.text.trim() });
  }

  // Modus 2: gi kort tilbakemelding på elaborerings-svaret.
  const result = streamText({
    model,
    prompt: `Du er en erfaren lærer som hjelper en elev å forankre et konsept dypere. Du henvender deg direkte til eleven i du-form.

Konsept: ${concept}
Opprinnelig spørsmål: ${question}
Fasit: ${correctAnswer}

Du stilte dette elaboreringsspørsmålet: ${elaborationQuestion}

Eleven svarte: ${userElaboration}

Gi en kort, konkret tilbakemelding på 2 til 3 setninger. Anerkjenn det som er sterkt i koblingen, og legg eventuelt til en nyanse, et eksempel eller en presisering som strekker forståelsen videre. Ikke gi karakter, ikke si om det var "riktig" eller "galt". Dette er forankring, ikke prøve.

${NO_DASHES}

Skriv som naturlig prosa på norsk.`,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    },
  });

  return result.toTextStreamResponse();
}
