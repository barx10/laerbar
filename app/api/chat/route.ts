import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const SOURCE_TEXT_PROMPT_CAP = 30 * 1024;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-3.1-flash-lite-preview";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { concept, conceptAnswer, sourceText, message, history } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const trimmedSource =
    typeof sourceText === "string" && sourceText.length > 0
      ? sourceText.length > SOURCE_TEXT_PROMPT_CAP
        ? sourceText.slice(0, SOURCE_TEXT_PROMPT_CAP) +
          "\n\n[... teksten er avkuttet her, resten er ikke tilgjengelig ...]"
        : sourceText
      : "";

  const sourceBlock = trimmedSource
    ? `\n\nKildetekst (ekstrahert fra det opplastede dokumentet. Bruk dette som primærkilde for artikkel-spesifikke spørsmål som forfatter, årstall, antall studier, sitater, tall og definisjoner brukt i teksten):\n"""\n${trimmedSource}\n"""`
    : `\n\nMerk: Selve kildedokumentet er ikke tilgjengelig i denne samtalen, bare konseptet og fasiten. Hvis du blir spurt om detaljer som krever teksten (f.eks. eksakte tall, forfatter, antall studier som ble sitert), si tydelig at du ikke har tilgang til dokumentet.`;

  const messages = [
    ...(history ?? []).map((h: { role: string; text: string }) => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.text,
    })),
    { role: "user" as const, content: message },
  ];

  const result = streamText({
    model,
    system: `Du er en hjelpsom AI-tutor for voksne som tilegner seg ny kunnskap. Du henvender deg direkte i du-form, aldri "eleven", "studenten" eller "brukeren" i tredjeperson.

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
- Ikke bruk tankestreker i svaret. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.
- Vær kortfattet og konkret. Svar på norsk, alltid i du-form.`,
    messages,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "minimal" },
      },
    },
  });

  return result.toTextStreamResponse();
}
