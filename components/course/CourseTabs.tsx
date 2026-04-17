"use client";

import { useEffect, useRef, useState } from "react";
import { Course } from "@/lib/types";
import ConceptMap from "./ConceptMap";
import LearnTab from "./LearnTab";
import FlashcardsTab from "./FlashcardsTab";
import RepetitionTab from "./RepetitionTab";
import DownloadTab from "./DownloadTab";
import Markdown from "@/components/shared/Markdown";

const TABS = [
  { id: "oversikt", label: "Oversikt" },
  { id: "laer", label: "Lær" },
  { id: "repeter", label: "Repeter" },
  { id: "flashcards", label: "Flashcards" },
  { id: "last-ned", label: "Last ned" },
] as const;

type TabId = typeof TABS[number]["id"];

interface Props {
  course: Course;
  onUpdate: (course: Course) => void;
}

export default function CourseTabs({ course, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("oversikt");
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  async function sendChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-2.5-flash-lite";

    const res = await fetch("/api/course-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
      },
      body: JSON.stringify({
        courseTitle: course.title,
        concepts: course.concepts.map((c) => ({ title: c.title, answer: c.answer })),
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

  function markMastered(conceptId: string, firstReview: string) {
    const updated = {
      ...course,
      concepts: course.concepts.map((c) =>
        c.id === conceptId
          ? { ...c, mastered: true, srs: { next_review: firstReview, interval: 1 } }
          : c
      ),
    };
    onUpdate(updated);
  }

  return (
    <div>
      {/* Tab-navigasjon — fagdykk-stil */}
      <nav className="bg-mg flex border-b-2 border-gold overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-sans text-xs font-medium tracking-widest uppercase text-cream px-5 py-3.5 border-none transition-all whitespace-nowrap border-b-[3px] -mb-0.5 ${
              activeTab === tab.id
                ? "opacity-100 border-b-gold bg-gold/10"
                : "opacity-60 border-b-transparent hover:opacity-90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-8">
        {activeTab === "oversikt" && (
          <div className={`flex gap-6 items-start ${showAIChat ? "max-w-5xl" : ""}`}>
            <div className="flex-1 min-w-0">
              <ConceptMap
                concepts={course.concepts}
                onAskAI={() => setShowAIChat((v) => !v)}
              />
            </div>

            {showAIChat && (
              <div className="w-80 shrink-0 sticky top-6 flex flex-col bg-white border border-black/8 rounded-md overflow-hidden" style={{ maxHeight: "calc(100vh - 140px)" }}>
                <div className="px-4 py-3 border-b border-black/6 flex justify-between items-center">
                  <h3 className="font-heading text-sm text-dg">Spør om «{course.title}»</h3>
                  <button
                    onClick={() => setShowAIChat(false)}
                    className="text-muted-foreground hover:text-dg transition-colors text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  {chatHistory.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center mt-4">Still et spørsmål om kurset.</p>
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
        )}
        {activeTab === "laer" && (
          <LearnTab concepts={course.concepts} onMastered={markMastered} />
        )}
        {activeTab === "repeter" && (
          <RepetitionTab
            concepts={course.concepts}
            onUpdate={(id, srs) => {
              const updated = {
                ...course,
                concepts: course.concepts.map((c) =>
                  c.id === id ? { ...c, srs } : c
                ),
              };
              onUpdate(updated);
            }}
          />
        )}
        {activeTab === "flashcards" && (
          <FlashcardsTab concepts={course.concepts} />
        )}
        {activeTab === "last-ned" && (
          <DownloadTab course={course} />
        )}
      </main>
    </div>
  );
}
