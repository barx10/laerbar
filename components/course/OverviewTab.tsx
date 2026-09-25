"use client";

import { useEffect, useRef, useState } from "react";
import { Concept, Course } from "@/lib/types";
import { isDue, isInReview, isMastered, isUnseen } from "@/lib/srs";
import Markdown from "@/components/shared/Markdown";
import { useLanguage } from "@/lib/language-context";

interface Props {
  course: Course;
  onUpdate: (course: Course) => void;
}

type Status = "new" | "review" | "mastered";

function statusOf(concept: Concept): Status {
  if (isMastered(concept)) return "mastered";
  if (isInReview(concept)) return "review";
  return "new";
}

export default function OverviewTab({ course, onUpdate }: Props) {
  const { lang, t } = useLanguage();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const fetchedForCourseId = useRef<string | null>(null);

  useEffect(() => {
    if (course.summary) return;
    if (!course.source_text || course.source_text.trim().length === 0) return;
    if (fetchedForCourseId.current === course.id) return;
    fetchedForCourseId.current = course.id;

    const apiKey = localStorage.getItem("laerbar_google_key") ?? "";
    const model = localStorage.getItem("laerbar_model") ?? "gemini-3.8-flash";
    if (!apiKey) return;

    setSummaryLoading(true);
    setSummaryError(false);

    fetch("/api/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-Model": model,
        "X-Language": lang,
      },
      body: JSON.stringify({ sourceText: course.source_text }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("summary failed");
        const data = (await res.json()) as { summary?: string };
        if (data.summary && data.summary.trim().length > 0) {
          onUpdate({ ...course, summary: data.summary.trim() });
        }
      })
      .catch(() => setSummaryError(true))
      .finally(() => setSummaryLoading(false));
  }, [course, onUpdate]);

  const mastered = course.concepts.filter((c) => statusOf(c) === "mastered").length;
  const review = course.concepts.filter((c) => statusOf(c) === "review").length;
  const newCount = course.concepts.filter(isUnseen).length;
  const dueToday = course.concepts.filter(isDue).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="font-heading text-xl text-dg mb-1">{course.title}</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.oversiktLabel}</p>
      </div>

      {(course.summary || summaryLoading || summaryError) && (
        <div className="bg-white rounded-md border border-black/8 p-5 mb-5">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
            {t.kortFortalt}
          </div>
          {course.summary ? (
            <Markdown text={course.summary} className="text-sm leading-relaxed text-gray-800" />
          ) : summaryLoading ? (
            <p className="text-sm text-muted-foreground italic">{t.generatingSummary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.summaryError}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label={t.statNew} value={newCount} tone="neutral" />
        <StatCard label={t.statReview} value={review} tone="gold" />
        <StatCard label={t.statMastered} value={mastered} tone="green" />
        <StatCard label={t.statDueToday} value={dueToday} tone={dueToday > 0 ? "gold" : "neutral"} />
      </div>

      <div className="mb-3">
        <h3 className="font-heading text-base text-dg mb-1">{t.conceptsHeading}</h3>
        <p className="text-xs text-muted-foreground">
          {t.masteredOf(mastered, course.concepts.length)}
          {review > 0 ? t.underReviewCount(review) : ""}
        </p>
      </div>

      <div className="grid gap-3">
        {course.concepts.map((concept, i) => (
          <ConceptCard key={concept.id} concept={concept} index={i} />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "gold" | "green";
}) {
  const toneClass =
    tone === "gold"
      ? "border-gold/40 bg-gold/5"
      : tone === "green"
      ? "border-lg/30 bg-green-50/50"
      : "border-black/8";
  return (
    <div className={`bg-white rounded-md border ${toneClass} px-3 py-3 text-center`}>
      <div className="text-2xl font-heading text-dg">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 leading-tight">
        {label}
      </div>
    </div>
  );
}

function ConceptCard({ concept, index }: { concept: Concept; index: number }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const status = statusOf(concept);

  const cardBorder =
    status === "mastered"
      ? "border-lg/30 bg-green-50/50"
      : status === "review"
      ? "border-gold/30 bg-gold/5"
      : "border-black/8";

  const badgeClass =
    status === "mastered"
      ? "bg-lg text-cream"
      : status === "review"
      ? "bg-gold text-dg"
      : "bg-black/8 text-muted-foreground";

  const badgeContent =
    status === "mastered" ? "✓" : status === "review" ? "↻" : index + 1;

  return (
    <div className={`bg-white rounded-md border px-5 py-4 transition-all ${cardBorder}`}>
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${badgeClass}`}>
            {badgeContent}
          </span>
          <span className="font-heading text-base text-dg">{concept.title}</span>
          {status === "review" && (
            <span className="text-[11px] text-muted-foreground">
              {t.confirmedCount(concept.mastery_confirmations ?? 0)}
            </span>
          )}
        </div>
        <span
          className="text-muted-foreground text-xs transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        >
          ▼
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pl-9 text-sm leading-relaxed border-t border-black/6 pt-3">
          {status === "mastered" ? (
            <span className="text-gray-700">{concept.answer}</span>
          ) : (
            <span className="text-muted-foreground">{concept.question}</span>
          )}
        </div>
      )}
    </div>
  );
}
