# Proposal: Brukerstyrte AI-responsstiler i Lær-fanen

## Bakgrunn
Brukeren ønsker å kunne styre hvordan AI-modellen svarer i chatten under "Lær"-fanen. Eksempler:
- **Korte svar** – rask oversikt, bullet points
- **Detaljerte svar** – utdypende forklaringer
- **Hints/veiledning** – sokratisk stil, tar brukeren ett skritt videre
- **Eksempler/forklaringer** – konkret illustrasjon av konsepter

## Nåværende situasjon
- `LearnTab.tsx` har en chat-funksjonalitet som kaller `/api/chat`
- Systemprompten i `/app/api/chat/route.ts` er fastkodet med én balansert stil
- Ingen brukergrensesnitt for å velge responsstil

## Forslått løsning

### 1. Definer responsstiler (types.ts)
```typescript
// lib/types.ts
export type AIResponseStyle = 
  | "balanced"      // Balansert (standard, som i dag)
  | "concise"       // Korte, presise svar
  | "detailed"      // Utdypende, omfattende
  | "socratic"      // Hints, motspørsmål, veiledning
  | "examples";     // Fokus på eksempler og illustrasjoner
```

### 2. UI i LearnTab.tsx
Legg til en dropdown/select i chat-headeren (linje ~460):
```tsx
<div className="px-4 py-3 border-b border-black/6 flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <h3 className="font-heading text-sm text-dg">{t.chatTitle}</h3>
    <select
      value={responseStyle}
      onChange={(e) => setResponseStyle(e.target.value as AIResponseStyle)}
      className="text-xs px-2 py-1 border border-black/15 rounded bg-white focus:outline-none focus:border-gold"
      aria-label={t.responseStyleLabel}
    >
      {responseStyleOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
  <p className="text-[11px] text-muted-foreground">{t.chatSubtitle}</p>
</div>
```

### 3. Send stil til API
I `sendChat()` (linje ~254), legg til `responseStyle` i body:
```typescript
body: JSON.stringify({
  concept: current.title,
  conceptAnswer: current.answer,
  sourceText: sourceText ?? "",
  message: userMsg,
  history: chatHistory,
  responseStyle,  // NYT
}),
```

### 4. Tilpass systemprompt i /api/chat/route.ts
Modifiser `systemPrompt` basert på `responseStyle`:

```typescript
const styleInstructions: Record<AIResponseStyle, { no: string; en: string }> = {
  balanced: {
    no: "Vær kortfattet og konkret. Gi direkte svar på faktaspørsmål. Veiled kun når brukeren jobber aktivt med å forstå konseptet.",
    en: "Be concise and concrete. Answer factual questions directly. Only guide when the user is actively working to understand the concept."
  },
  concise: {
    no: "Svar SVÆRT kort og presist. Maks 2-3 setninger. Ingen unødvendige forklaringer. Bruk punktlister der det passer. Prioriter rask oversikt over dybde.",
    en: "Answer VERY briefly and precisely. Max 2-3 sentences. No unnecessary explanations. Use bullet points where appropriate. Prioritize quick overview over depth."
  },
  detailed: {
    no: "Gi grundige, utdypende svar. Forklar sammenhenger, gi bakgrunn, nevn unntak og nynanser. Bruk eksempler for å illustere. Anta at brukeren vil forstå dypt.",
    en: "Give thorough, in-depth answers. Explain connections, provide background, mention exceptions and nuances. Use examples to illustrate. Assume the user wants deep understanding."
  },
  socratic: {
    no: "IKKE gi direkte svar. Still motspørsmål, gi hints, peke på sammenhenger. Ta brukeren ett skritt videre per svar. Vær tålmodig og oppmuntrende. Aldri si fasitet rett ut.",
    en: "Do NOT give direct answers. Ask counter-questions, give hints, point to connections. Move the user one step forward per response. Be patient and encouraging. Never give away the answer."
  },
  examples: {
    no: "Fokuser på konkrete eksempler og illustrasjoner. Forklar konsepter gjennom bruksområder, analogier, caser. Minimal abstrakt teori. Vis, ikke bare fortell.",
    en: "Focus on concrete examples and illustrations. Explain concepts through use cases, analogies, cases. Minimal abstract theory. Show, don't just tell."
  }
};
```

Og i systemprompt-bygningen:
```typescript
const styleInstruction = styleInstructions[responseStyle]?.[lang] ?? styleInstructions.balanced[lang];

const systemPrompt = lang === "en"
  ? `You are a helpful AI tutor... ${styleInstruction} ...`
  : `Du er en hjelpsom AI-tutor... ${styleInstruction} ...`;
```

### 5. Persistens (valgfritt)
Lagre valgt stil i `localStorage`:
```typescript
const [responseStyle, setResponseStyle] = useState<AIResponseStyle>(() => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("laerbar_response_style") as AIResponseStyle) || "balanced";
  }
  return "balanced";
});

useEffect(() => {
  localStorage.setItem("laerbar_response_style", responseStyle);
}, [responseStyle]);
```

## Fordeler med denne tilnærmingen
1. **Minimal endring** – kun LearnTab og chat-API påvirkes
2. **Utdragbar** – enkelt å legge til nye stiler senere
3. **Brukerkontroll** – brukeren velger stil per økt eller permanent
4. **Kontekstbevisst** – stilene er designet for læringssituasjonen

## Alternativer vurdert
| Alternativ | Fordel | Ulempe |
|------------|--------|--------|
| Globalt i SettingsModal | Konsistent over hele appen | Mindre relevant for andre faner (Repetisjon, Flashcards) |
| Per-melding (knapper over input) | Fleksibilitet per spørsmål | Mer UI-clutter, kognitiv belastning |
| **Per-økt i chat-header (forslaget)** | **Riktig granularitet, lav friksjon** | **Krever persistens for å huske** |

## Neste steg
1. Godkjenn forslag
2. Implementer types + UI i LearnTab
3. Oppdater chat-API med stil-logikk
4. Test alle fem stiler manuelt
5. (Valgfritt) Legg til i andre AI-kall (elaborate, evaluate) hvis ønskelig