import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const SOURCE_TEXT_PROMPT_CAP = 30 * 1024; // tegn kildetekst vi sender med i hver request

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { courseTitle, concepts, sourceText, message, history } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const conceptSummary = (concepts ?? [])
    .map((c: { title: string; answer: string }) => `- ${c.title}: ${c.answer}`)
    .join("\n");

  const trimmedSource =
    typeof sourceText === "string" && sourceText.length > 0
      ? sourceText.length > SOURCE_TEXT_PROMPT_CAP
        ? sourceText.slice(0, SOURCE_TEXT_PROMPT_CAP) +
          "\n\n[... teksten er avkuttet her, resten er ikke tilgjengelig ...]"
        : sourceText
      : "";

  const sourceBlock = trimmedSource
    ? `\n\nKildetekst (ekstrahert fra det opplastede dokumentet — bruk dette som primærkilde for artikkel-spesifikke spørsmål som forfatter, årstall, antall studier, sitater, tall og definisjoner brukt i teksten):\n"""\n${trimmedSource}\n"""`
    : `\n\nMerk: Selve kildedokumentet er ikke tilgjengelig i denne samtalen — bare kurstittel og kjernekonseptene over. Hvis du blir spurt om detaljer som krever teksten (f.eks. eksakte tall, forfatter, antall studier som ble sitert), si tydelig at du ikke har tilgang til dokumentet.`;

  const messages = [
    ...(history ?? []).map((h: { role: string; text: string }) => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.text,
    })),
    { role: "user" as const, content: message },
  ];

  const result = streamText({
    model,
    system: `Du er en hjelpsom AI-tutor. Du henvender deg direkte i du-form — aldri "eleven", "studenten" eller "brukeren" i tredjeperson.

Personen du snakker med studerer emnet "${courseTitle}".

Kjernekonsepter i emnet:
${conceptSummary}${sourceBlock}

Meldingen kan være et spørsmål, en tanke, en delvis forståelse, eller bare en kommentar.

Viktig:
- Svar direkte på det som faktisk blir spurt om. Hvis spørsmålet er et faktaspørsmål (f.eks. "hvor lenge", "hva er", "når", "hvem") → gi svaret rett ut, kortfattet.
- For artikkel-spesifikke spørsmål: bruk kildeteksten over som primærkilde. Ikke finn på forfattere, årstall eller tall som ikke står i teksten.
- Hvis kildeteksten er avkuttet og spørsmålet kan handle om det som mangler, si det tydelig.
- Ikke still motspørsmål bare for å være sokratisk — kun når spørsmålet er vagt eller åpent og du faktisk trenger å forstå hva personen vil.
- Ikke start svaret med ros som "Bra spørsmål!", "Godt tenkt!" eller lignende.
- Hvis du ikke vet noe sikkert, si det tydelig — ikke gjett.
- Vær kortfattet og konkret. Svar på norsk, alltid i du-form.`,
    messages,
  });

  return result.toTextStreamResponse();
}
