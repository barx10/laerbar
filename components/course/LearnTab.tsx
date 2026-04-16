"use client";

import { useEffect, useRef, useState } from "react";
import { Concept } from "@/lib/types";
import Markdown from "@/components/shared/Markdown";

interface Props {
  concepts: Concept[];
  onMastered: (id: string, firstReview: string) => void;
}

function nextReviewDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function LearnTab({ concepts, onMastered }: Props) {
  const currentIndex = concepts.findIndex((c) => !c.mastered);
  const done = currentIndex === -1;
  const current = done ? null : concepts[currentIndex];

  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  async function evaluate() {
    if (!current || !answer.trim()) return;
    setLoading(true);
    setEvaluation(null);

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-2.5-flash-lite";

    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
      },
      body: JSON.stringify({
        concept: current.title,
        question: current.question,
        correctAnswer: current.answer,
        userAnswer: answer,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setEvaluation(result);
      }
    }

    setLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || !current) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-2.5-flash-lite";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
      },
      body: JSON.stringify({
        concept: current.title,
        conceptAnswer: current.answer,
        message: userMsg,
        history: chatHistory,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let aiText = "";

    setChatHistory((h) => [...h, { role: "ai", text: "" }]);

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        setChatHistory((h) => {
          const updated = [...h];
          updated[updated.length - 1] = { role: "ai", text: aiText };
          return updated;
        });
      }
    }

    setChatLoading(false);
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="font-heading text-xl text-dg mb-2">Alle konsepter mestret!</h2>
        <p className="text-sm text-muted-foreground">Gå til Flashcards for å repetere, eller last ned som HTML.</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-6 items-start ${showChat ? "max-w-5xl" : "max-w-2xl"}`}>
      {/* Venstre: hovedinnhold */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Konsept {currentIndex + 1} av {concepts.length}
        </div>
        <h2 className="font-heading text-xl text-dg mb-1">{current!.title}</h2>
        <div className="w-full bg-black/8 rounded-full h-1 mb-6">
          <div
            className="bg-gold h-1 rounded-full transition-all"
            style={{ width: `${(currentIndex / concepts.length) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-md border border-black/8 p-5 mb-4">
          <p className="text-sm font-medium text-dg leading-relaxed">{current!.question}</p>
        </div>

        <textarea
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setEvaluation(null); }}
          placeholder="Skriv svaret ditt her…"
          rows={4}
          className="w-full px-3.5 py-3 border border-black/15 rounded-md text-sm leading-relaxed resize-y focus:outline-none focus:border-gold transition-colors mb-3"
        />

        <button
          onClick={evaluate}
          disabled={!answer.trim() || loading}
          className="bg-dg text-cream px-7 py-2.5 rounded text-sm font-semibold hover:bg-mg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
        >
          {loading ? "Evaluerer…" : "Sjekk svaret"}
        </button>

        {evaluation && (
          <div className="bg-white border border-black/8 rounded-md p-4 mb-4">
            <Markdown text={evaluation} className="text-sm leading-relaxed text-gray-800" />

            <div className="flex gap-2.5 mt-4 pt-3 border-t border-black/6">
              <button
                onClick={() => {
                  onMastered(current!.id, nextReviewDate(0));
                  setAnswer("");
                  setEvaluation(null);
                  setShowChat(false);
                  setChatHistory([]);
                }}
                className="bg-lg text-cream px-5 py-2 rounded text-xs font-semibold hover:bg-mg transition-colors"
              >
                ✓ Mestret — neste konsept
              </button>
              <button
                onClick={() => { setAnswer(""); setEvaluation(null); }}
                className="border border-black/15 px-5 py-2 rounded text-xs text-muted-foreground hover:border-gold hover:text-dg transition-all"
              >
                ↻ Prøv igjen
              </button>
              <button
                onClick={() => setShowChat((v) => !v)}
                className="border border-black/15 px-5 py-2 rounded text-xs text-muted-foreground hover:border-gold hover:text-dg transition-all ml-auto"
              >
                {showChat ? "Skjul chat" : "Usikker? Spør AI-en"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Høyre: chat-panel */}
      {showChat && (
        <div className="w-80 shrink-0 sticky top-6 flex flex-col bg-white border border-black/8 rounded-md overflow-hidden" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <div className="px-4 py-3 border-b border-black/6 flex justify-between items-center">
            <h3 className="font-heading text-sm text-dg">Spør om «{current!.title}»</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-muted-foreground hover:text-dg transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {chatHistory.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center mt-4">Still et spørsmål om dette konseptet.</p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-black/5 self-end ml-6 text-right"
                    : "bg-gold/10 self-start mr-6"
                }`}
              >
                {msg.role === "ai" ? (
                  <Markdown text={msg.text} className="text-sm leading-relaxed" />
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {chatLoading && <div className="text-xs text-muted-foreground italic">AI skriver…</div>}
            <div ref={chatBottomRef} />
          </div>

          <div className="p-3 border-t border-black/6 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Still et spørsmål…"
              className="flex-1 px-3 py-2 border border-black/15 rounded text-sm focus:outline-none focus:border-gold transition-colors"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              className="bg-dg text-cream px-4 py-2 rounded text-sm hover:bg-mg transition-colors disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
