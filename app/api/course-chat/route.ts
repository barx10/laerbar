import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key");
  const modelId = req.headers.get("X-Model") ?? "gemini-2.5-flash-lite";

  if (!apiKey) {
    return new Response("Mangler API-nøkkel", { status: 401 });
  }

  const { courseTitle, concepts, message, history } = await req.json();

  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const conceptSummary = (concepts ?? [])
    .map((c: { title: string; answer: string }) => `- ${c.title}: ${c.answer}`)
    .join("\n");

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
${conceptSummary}

Meldingen kan være et spørsmål, en tanke, en delvis forståelse, eller bare en kommentar.

Viktig:
- Svar direkte på det som faktisk blir spurt om. Hvis spørsmålet er et faktaspørsmål (f.eks. "hvor lenge", "hva er", "når", "hvem") → gi svaret rett ut, kortfattet.
- Ikke still motspørsmål bare for å være sokratisk — kun når spørsmålet er vagt eller åpent og du faktisk trenger å forstå hva personen vil.
- Ikke start svaret med ros som "Bra spørsmål!", "Godt tenkt!" eller lignende.
- Hvis du ikke vet noe sikkert (f.eks. tall, årstall, kilder), si det tydelig — ikke gjett.
- Vær kortfattet og konkret. Svar på norsk, alltid i du-form.`,
    messages,
  });

  return result.toTextStreamResponse();
}
