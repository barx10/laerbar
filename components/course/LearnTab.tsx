"use client";

import { useEffect, useRef, useState } from "react";
import { Attempt, Concept, AIResponseStyle } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";
import { applyFirstPass, isUnseen, today } from "@/lib/srs";
import { logStudyToday } from "@/lib/study-log";
import Markdown from "@/components/shared/Markdown";

interface Props {
  concepts: Concept[];
  sourceText?: string;
  onConceptUpdate: (concept: Concept) => void;
}

type Confidence = 1 | 2 | 3;

function logAttempt(concept: Concept, confidence: Confidence, correct: boolean): Concept {
  const attempt: Attempt = { date: today(), confidence, correct };
  return { ...concept, attempts: [...(concept.attempts ?? []), attempt] };
}

async function generateVariants(
  concept: Concept,
  onConceptUpdate: (c: Concept) => void,
  lang: string,
): Promise<void> {
  if ((concept.question_variants?.length ?? 0) > 0) return;
  try {
    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.8-flash";
    if (!apiKey) return;
    const res = await fetch("/api/rephrase-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
        "X-Language": lang,
      },
      body: JSON.stringify({
        concept: concept.title,
        question: concept.flashcard_front,
        answer: concept.flashcard_back,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { variants?: string[] };
    const variants = (data.variants ?? []).filter((v) => v.trim().length > 0);
    if (variants.length === 0) return;
    onConceptUpdate({ ...concept, question_variants: variants });
  } catch {
    // Stille — varianter er en berikelse, ikke kritisk for læringsflyt.
  }
}

export default function LearnTab({ concepts, sourceText, onConceptUpdate }: Props) {
  const { lang, t } = useLanguage();
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elaborationQuestion, setElaborationQuestion] = useState<string | null>(null);
  const [elaborationAnswer, setElaborationAnswer] = useState("");
  const [elaborationFeedback, setElaborationFeedback] = useState<string | null>(null);
  const [elaborationLoading, setElaborationLoading] = useState(false);
  const [elaborationFeedbackLoading, setElaborationFeedbackLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [responseStyle, setResponseStyle] = useState<AIResponseStyle>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("laerbar_response_style") as AIResponseStyle) || "balanced";
    }
    return "balanced";
  });
  const [sessionProven, setSessionProven] = useState<Concept[]>([]);
  const [pendingChecks, setPendingChecks] = useState<Concept[]>([]);
  const [checkAnswer, setCheckAnswer] = useState("");
  const [checkRevealed, setCheckRevealed] = useState(false);

  const currentIndex = concepts.findIndex(isUnseen);
  const allLearned = currentIndex === -1;
  const done = allLearned && pendingChecks.length === 0;
  const current = allLearned ? null : concepts[currentIndex];
  const checkConcept = pendingChecks[0] ?? null;
  const inCheckMode = checkConcept !== null;

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    localStorage.setItem("laerbar_response_style", responseStyle);
  }, [responseStyle]);

  function dismissCheck() {
    setPendingChecks((prev) => prev.slice(1));
    setCheckAnswer("");
    setCheckRevealed(false);
  }

  function resetForNext() {
    setAnswer("");
    setConfidence(null);
    setEvaluation(null);
    setElaborationQuestion(null);
    setElaborationAnswer("");
    setElaborationFeedback(null);
    setChatHistory([]);
  }

  async function evaluate() {
    if (!current || !answer.trim() || !confidence) return;
    setLoading(true);
    setEvaluation(null);

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.8-flash";

    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
        "X-Language": lang,
      },
      body: JSON.stringify({
        concept: current.title,
        question: current.question,
        correctAnswer: current.answer,
        userAnswer: answer,
        confidence,
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

  function confirmMastery() {
    if (!current || !confidence) return;
    const withAttempt = logAttempt(current, confidence, true);
    const withFirstPass = applyFirstPass(withAttempt);
    onConceptUpdate(withFirstPass);
    logStudyToday();
    void generateVariants(withFirstPass, onConceptUpdate, lang);

    const newSessionProven = [...sessionProven, current];
    setSessionProven(newSessionProven);
    if (newSessionProven.length >= 2 && newSessionProven.length % 2 === 0) {
      const checkIdx = newSessionProven.length / 2 - 1;
      setPendingChecks((prev) => [...prev, newSessionProven[checkIdx]]);
    }

    resetForNext();
  }

  function markIncorrect() {
    if (!current || !confidence) return;
    const withAttempt = logAttempt(current, confidence, false);
    onConceptUpdate(withAttempt);
    logStudyToday();
    setAnswer("");
    setConfidence(null);
    setEvaluation(null);
    setElaborationQuestion(null);
    setElaborationAnswer("");
    setElaborationFeedback(null);
  }

  async function startElaboration() {
    if (!current) return;
    setElaborationLoading(true);
    setElaborationQuestion(null);
    setElaborationAnswer("");
    setElaborationFeedback(null);

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.8-flash";

    try {
      const res = await fetch("/api/elaborate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "X-Model": model,
          "X-Language": lang,
        },
        body: JSON.stringify({
          concept: current.title,
          question: current.question,
          correctAnswer: current.answer,
          userAnswer: answer,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { question?: string };
        if (data.question) setElaborationQuestion(data.question);
      }
    } finally {
      setElaborationLoading(false);
    }
  }

  async function submitElaboration() {
    if (!current || !elaborationQuestion || !elaborationAnswer.trim()) return;
    setElaborationFeedbackLoading(true);
    setElaborationFeedback("");

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.8-flash";

    const res = await fetch("/api/elaborate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
        "X-Language": lang,
      },
      body: JSON.stringify({
        concept: current.title,
        question: current.question,
        correctAnswer: current.answer,
        userAnswer: answer,
        elaborationQuestion,
        userElaboration: elaborationAnswer,
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
        setElaborationFeedback(result);
      }
    }

    setElaborationFeedbackLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || !current) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.8-flash";

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
        "X-Language": lang,
      },
      body: JSON.stringify({
        concept: current.title,
        conceptAnswer: current.answer,
        sourceText: sourceText ?? "",
        message: userMsg,
        history: chatHistory,
        responseStyle,
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

  if (inCheckMode) {
    return (
      <HurtigsjekCard
        concept={checkConcept!}
        answer={checkAnswer}
        revealed={checkRevealed}
        onAnswerChange={setCheckAnswer}
        onReveal={() => setCheckRevealed(true)}
        onDismiss={dismissCheck}
      />
    );
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="font-heading text-xl text-dg mb-2">{t.allProven}</h2>
        <p className="text-sm text-muted-foreground">{t.allProvenSub}</p>
      </div>
    );
  }

  const totalCount = concepts.length;
  const unseenCount = concepts.filter(isUnseen).length;
  const positionLabel = totalCount - unseenCount + 1;
  const progressPct = ((totalCount - unseenCount) / totalCount) * 100;

  return (
    <div className="flex gap-6 items-start max-w-6xl">
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t.conceptOf(positionLabel, totalCount)}
        </div>
        <h2 className="font-heading text-xl text-dg mb-1">{current!.title}</h2>
        <div className="w-full bg-black/8 rounded-full h-1 mb-6">
          <div
            className="bg-gold h-1 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="bg-white rounded-md border border-black/8 p-5 mb-4">
          <p className="text-sm font-medium text-dg leading-relaxed">{current!.question}</p>
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold text-dg mb-1 uppercase tracking-wider">
            {t.confidenceLabel}
          </p>
          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
            {t.confidenceSubLabel}
          </p>
          <div className="flex gap-2">
            {t.confidenceOptions.map((opt) => {
              const selected = confidence === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setConfidence(opt.value)}
                  className={`flex-1 px-3 py-2 rounded border text-xs font-medium transition-all text-left ${
                    selected
                      ? "border-gold bg-gold/10 text-dg"
                      : "border-black/15 text-muted-foreground hover:border-gold/40 hover:text-dg"
                  }`}
                >
                  <span className="block font-semibold">{opt.label}</span>
                  <span className="block text-[11px] opacity-70 mt-0.5 font-normal">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setEvaluation(null); }}
          placeholder={t.answerPlaceholder}
          rows={4}
          className="w-full px-3.5 py-3 border border-black/15 rounded-md text-sm leading-relaxed resize-y focus:outline-none focus:border-gold transition-colors mb-3"
        />

        <button
          onClick={evaluate}
          disabled={!answer.trim() || !confidence || loading}
          className="bg-dg text-cream px-7 py-2.5 rounded text-sm font-semibold hover:bg-mg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
        >
          {loading ? t.checkBtnLoading : t.checkBtn}
        </button>

        {evaluation && (
          <div className="bg-white border border-black/8 rounded-md p-4 mb-4">
            <Markdown text={evaluation} className="text-sm leading-relaxed text-gray-800" />

            <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-black/6">
              <button
                onClick={confirmMastery}
                className="bg-lg text-cream px-5 py-2 rounded text-xs font-semibold hover:bg-mg transition-colors"
              >
                {t.confirmMastery}
              </button>
              <button
                onClick={markIncorrect}
                className="border border-black/15 px-5 py-2 rounded text-xs text-muted-foreground hover:border-gold hover:text-dg transition-all"
              >
                {t.tryAgain}
              </button>
              {!elaborationQuestion && (
                <button
                  onClick={startElaboration}
                  disabled={elaborationLoading}
                  className="border border-gold/40 text-dg px-5 py-2 rounded text-xs font-medium hover:bg-gold/10 transition-all disabled:opacity-40"
                  title="Forankre forståelsen med ett utvidende spørsmål"
                >
                  {elaborationLoading ? t.fetchingQuestion : t.goDeeper}
                </button>
              )}
            </div>

            {elaborationQuestion && (
              <div className="mt-4 pt-4 border-t border-black/6">
                <p className="text-[11px] font-semibold text-dg uppercase tracking-wider mb-2">
                  {t.anchorQuestion}
                </p>
                <p className="text-sm text-dg leading-relaxed mb-3">{elaborationQuestion}</p>

                <textarea
                  value={elaborationAnswer}
                  onChange={(e) => setElaborationAnswer(e.target.value)}
                  placeholder={t.elaborationPlaceholder}
                  rows={3}
                  disabled={elaborationFeedback !== null}
                  className="w-full px-3 py-2 border border-black/15 rounded text-sm leading-relaxed resize-y focus:outline-none focus:border-gold transition-colors mb-2 disabled:bg-black/5"
                />

                {elaborationFeedback === null && (
                  <button
                    onClick={submitElaboration}
                    disabled={!elaborationAnswer.trim() || elaborationFeedbackLoading}
                    className="bg-dg text-cream px-5 py-2 rounded text-xs font-semibold hover:bg-mg transition-colors disabled:opacity-40"
                  >
                    {elaborationFeedbackLoading ? t.evaluating : t.submitAnswer}
                  </button>
                )}

                {elaborationFeedback !== null && (
                  <div className="mt-3 bg-gold/8 border border-gold/20 rounded p-3">
                    <Markdown text={elaborationFeedback} className="text-sm leading-relaxed text-gray-800" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-80 shrink-0 sticky top-6 flex flex-col bg-white border border-black/8 rounded-md overflow-hidden" style={{ maxHeight: "calc(100vh - 140px)" }}>
        <div className="px-4 py-3 border-b border-black/6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm text-dg">{t.chatTitle}</h3>
            <select
              value={responseStyle}
              onChange={(e) => setResponseStyle(e.target.value as AIResponseStyle)}
              className="text-xs px-2 py-1 border border-black/15 rounded bg-white focus:outline-none focus:border-gold"
              aria-label={t.responseStyleLabel}
            >
              {t.responseStyleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">{t.chatSubtitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {chatHistory.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center mt-4 leading-relaxed">
              {t.chatEmpty}
            </p>
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
          {chatLoading && <div className="text-xs text-muted-foreground italic">{t.chatLoading}</div>}
          <div ref={chatBottomRef} />
        </div>

        <div className="p-3 border-t border-black/6 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
            placeholder={t.chatInputPlaceholder}
            className="flex-1 px-3 py-2 border border-black/15 rounded text-sm focus:outline-none focus:border-gold transition-colors"
          />
          <button
            onClick={sendChat}
            disabled={!chatInput.trim() || chatLoading}
            className="bg-dg text-cream px-4 py-2 rounded text-sm hover:bg-mg transition-colors disabled:opacity-40"
          >
            {t.sendBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

function HurtigsjekCard({
  concept,
  answer,
  revealed,
  onAnswerChange,
  onReveal,
  onDismiss,
}: {
  concept: Concept;
  answer: string;
  revealed: boolean;
  onAnswerChange: (v: string) => void;
  onReveal: () => void;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-6 items-start max-w-6xl">
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t.quickCheck}
        </div>
        <h2 className="font-heading text-xl text-dg mb-1">{concept.title}</h2>
        <div className="w-full bg-black/8 rounded-full h-1 mb-6" />

        <div className="bg-gold/8 rounded-md border border-gold/30 p-5 mb-4">
          <p className="text-sm font-medium text-dg leading-relaxed">{concept.flashcard_front}</p>
        </div>

        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={t.answerPlaceholder}
          rows={4}
          className="w-full px-3.5 py-3 border border-black/15 rounded-md text-sm leading-relaxed resize-y focus:outline-none focus:border-gold transition-colors mb-3"
        />

        {!revealed ? (
          <button
            onClick={onReveal}
            disabled={!answer.trim()}
            className="bg-dg text-cream px-7 py-2.5 rounded text-sm font-semibold hover:bg-mg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
          >
            {t.revealBtn}
          </button>
        ) : (
          <>
            <div className="bg-white border border-black/8 rounded-md p-4 mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.answerKey}</p>
              <p className="text-sm leading-relaxed text-gray-800">{concept.flashcard_back}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 border border-red-200 bg-red-50 text-red-700 py-2.5 rounded text-sm font-medium hover:bg-red-100 transition-colors"
              >
                {t.forgot}
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 border border-gold/40 bg-gold/8 text-dg py-2.5 rounded text-sm font-medium hover:bg-gold/15 transition-colors"
              >
                {t.uncertain}
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 border border-lg/30 bg-green-50 text-lg py-2.5 rounded text-sm font-medium hover:bg-green-100 transition-colors"
              >
                {t.remembered}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
