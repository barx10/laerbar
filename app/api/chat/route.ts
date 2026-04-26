import { NextRequest } from "next/server";
import { streamText } from "ai";
import { guardApiRequest } from "@/lib/api-guard";
import { getRequestContext } from "@/lib/api-context";
import { createGeminiModel, GEMINI_FAST_OPTS } from "@/lib/ai";
import { noDashesInstruction } from "@/lib/prompts";

const SOURCE_TEXT_PROMPT_CAP = 30 * 1024;

export async function POST(req: NextRequest) {
  const blocked = guardApiRequest(req);
  if (blocked) return blocked;

  const ctx = getRequestContext(req);
  if (!ctx) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }
  const { apiKey, modelId, lang } = ctx;

  const { concept, conceptAnswer, sourceText, message, history } = await req.json();

  const model = createGeminiModel(apiKey, modelId);

  const trimmedSource =
    typeof sourceText === "string" && sourceText.length > 0
      ? sourceText.length > SOURCE_TEXT_PROMPT_CAP
        ? sourceText.slice(0, SOURCE_TEXT_PROMPT_CAP) +
          (lang === "en"
            ? "\n\n[... text truncated here, the rest is not available ...]"
            : "\n\n[... teksten er avkuttet her, resten er ikke tilgjengelig ...]")
        : sourceText
      : "";

  const sourceBlock = trimmedSource
    ? lang === "en"
      ? `\n\nSource text (extracted from the uploaded document. Use this as the primary source for article-specific questions about author, year, numbers, quotes, and definitions used in the text):\n"""\n${trimmedSource}\n"""`
      : `\n\nKildetekst (ekstrahert fra det opplastede dokumentet. Bruk dette som primærkilde for artikkel-spesifikke spørsmål som forfatter, årstall, antall studier, sitater, tall og definisjoner brukt i teksten):\n"""\n${trimmedSource}\n"""`
    : lang === "en"
      ? `\n\nNote: The source document is not available in this conversation, only the concept and answer key. If asked about details that require the text (e.g. exact numbers, author, number of studies cited), state clearly that you do not have access to the document.`
      : `\n\nMerk: Selve kildedokumentet er ikke tilgjengelig i denne samtalen, bare konseptet og fasiten. Hvis du blir spurt om detaljer som krever teksten (f.eks. eksakte tall, forfatter, antall studier som ble sitert), si tydelig at du ikke har tilgang til dokumentet.`;

  const systemPrompt = lang === "en"
    ? `You are a helpful AI tutor for adults acquiring new knowledge. Address the person directly in second person, never as "the student", "the user", or "the learner" in the third person.

The person is learning about the concept "${concept}".
The answer key for this concept is (for your use, do not quote in full): ${conceptAnswer}${sourceBlock}

The message may be a question, a thought, a partial understanding, or just a comment.

Important:
- If the question is a factual question (e.g. "who wrote", "how long", "what is", "when", "who") or a meta-question about the text/article: answer directly and concisely. Use the source text above as the primary source for article-specific details.
- If the person is in the middle of trying to explain or understand the concept itself, and asks for a hint or guidance: do not give away the answer. Guide, ask a counter-question, give a hint that takes them one step further.
- Do not ask counter-questions just to be Socratic. Only when the person is genuinely working toward understanding the concept and needs a nudge.
- For article-specific questions: do not invent authors, years, or numbers not in the text. If the source text is truncated and the answer may be in the missing part, say so clearly.
- Do not start responses with phrases like "Great question!", "Good thinking!" or similar praise.
- If you are not certain about something, say so clearly. Do not guess.
- ${noDashesInstruction("en")}
- Be concise and concrete. Write in English, always in second person.`
    : `Du er en hjelpsom AI-tutor for voksne som tilegner seg ny kunnskap. Du henvender deg direkte i du-form, aldri "eleven", "studenten" eller "brukeren" i tredjeperson.

Personen du snakker med holder på å lære om konseptet "${concept}".
Fasiten for dette konseptet er (til din bruk, ikke siteres direkte i sin helhet): ${conceptAnswer}${sourceBlock}

Meldingen kan være et spørsmål, en tanke, en delvis forståelse, eller bare en kommentar.

Viktig:
- Hvis spørsmålet er et faktaspørsmål (f.eks. "hvem skrev", "hvor lenge", "hva er", "når", "hvem") eller et meta-spørsmål om teksten/artikkelen: svar direkte og kortfattet. Bruk kildeteksten over som primærkilde hvis det er en artikkel-spesifikk detalj.
- Hvis personen er midt i å prøve å forklare eller forstå selve konseptet, og spør om hint eller veiledning: ikke gi fasitsvaret rett ut. Veiled, still et motspørsmål, gi et hint som tar dem ett skritt videre.
- Ikke still motspørsmål bare for å være sokratisk. Kun når personen faktisk jobber seg mot å forstå konseptet og trenger dytt.
- For artikkel-spesifikke spørsmål: ikke finn på forfattere, årstall eller tall som ikke står i teksten. Hvis kildeteksten er avkuttet og svaret kan ligge i det som mangler, si det tydelig.
- Ikke start svaret med fraser som "Bra spørsmål!", "Godt tenkt!" eller lignende ros.
- Hvis du ikke vet noe sikkert, si det tydelig. Ikke gjett.
- ${noDashesInstruction("no")}
- Vær kortfattet og konkret. Svar på norsk, alltid i du-form.`;

  const messages = [
    ...(history ?? []).map((h: { role: string; text: string }) => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.text,
    })),
    { role: "user" as const, content: message },
  ];

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    providerOptions: GEMINI_FAST_OPTS,
  });

  return result.toTextStreamResponse();
}
