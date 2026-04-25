import { NextRequest } from "next/server";
import { streamText, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";
  const lang = req.headers.get("X-Language") ?? "no";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const body = await req.json();
  const { concept, question, correctAnswer, userAnswer, userElaboration, elaborationQuestion } = body;

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const NO_DASHES = lang === "en"
    ? `DASHES that MUST NOT be used: Do not use dashes — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. Only regular hyphens (-) in compound words are allowed.`
    : `STREKK OG TEGN som IKKE skal brukes: Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.`;

  // Modus 1: generer ett utvidende oppfølgingsspørsmål.
  if (!userElaboration) {
    const elaborationPrompt = lang === "en"
      ? `You are an experienced academic tutor. You have just evaluated an answer from an adult learner and want to help deepen their understanding through elaboration.

Concept: ${concept}
Original question: ${question}
Answer key: ${correctAnswer}
Answer given: ${userAnswer}

Choose ONE of these three elaboration question types based on what fits best for this concept and answer:

(a) A "why" question that forces out the underlying mechanism or reason.
(b) Ask for a concrete example from everyday life or practice (best when the concept is applicable).
(c) Ask for a description of the most common misunderstanding and why it is wrong (best for nuanced concepts where misunderstandings are close to the truth).

Choose the variant that will produce the strongest learning for this concept and answer. Do not explain the choice. Write only the question itself, one to two sentences, in second person.

${NO_DASHES}

Write in English.`
      : `Du er en erfaren faglig veileder. Du har nettopp evaluert et svar fra en voksen som tilegner seg ny kunnskap, og vil hjelpe personen å forankre forståelsen dypere gjennom elaborering.

Konsept: ${concept}
Opprinnelig spørsmål: ${question}
Fasit: ${correctAnswer}
Svaret som ble skrevet: ${userAnswer}

Velg ETT av disse tre elaboreringsspørsmålene basert på hva som passer best for konseptet og svaret:

(a) Et "hvorfor"-spørsmål som tvinger frem den underliggende mekanismen eller årsaken.
(b) Be om et konkret eksempel fra egen hverdag eller praksis (passer best når konseptet er anvendbart).
(c) Be om en beskrivelse av den vanligste feiltolkningen og hvorfor den er feil (passer best for nyanserte begreper der misforståelser ligger nært).

Velg den varianten som vil gi sterkest læring for nettopp dette konseptet og svaret. Ikke forklar valget. Skriv bare selve spørsmålet, en til to setninger, direkte i du-form.

${NO_DASHES}

Skriv på norsk.`;

    const result = await generateText({
      model,
      prompt: elaborationPrompt,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      },
    });

    return Response.json({ question: result.text.trim() });
  }

  // Modus 2: gi kort tilbakemelding på elaborerings-svaret.
  const feedbackPrompt = lang === "en"
    ? `You are an experienced academic tutor helping an adult anchor a concept more deeply. Address the person directly in second person.

Concept: ${concept}
Original question: ${question}
Answer key: ${correctAnswer}

You asked this elaboration question: ${elaborationQuestion}

Their answer was: ${userElaboration}

Give brief, concrete feedback in 2 to 3 sentences. Acknowledge what is strong in the connection, and add a nuance, an example, or a clarification that stretches their understanding further. Do not grade, do not say whether it was "right" or "wrong". This is elaboration, not a test.

${NO_DASHES}

Write as natural prose in English.`
    : `Du er en erfaren faglig veileder som hjelper en voksen å forankre et konsept dypere. Du henvender deg direkte i du-form.

Konsept: ${concept}
Opprinnelig spørsmål: ${question}
Fasit: ${correctAnswer}

Du stilte dette elaboreringsspørsmålet: ${elaborationQuestion}

Svaret var: ${userElaboration}

Gi en kort, konkret tilbakemelding på 2 til 3 setninger. Anerkjenn det som er sterkt i koblingen, og legg eventuelt til en nyanse, et eksempel eller en presisering som strekker forståelsen videre. Ikke gi karakter, ikke si om det var "riktig" eller "galt". Dette er forankring, ikke prøve.

${NO_DASHES}

Skriv som naturlig prosa på norsk.`;

  const result = streamText({
    model,
    prompt: feedbackPrompt,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    },
  });

  return result.toTextStreamResponse();
}
