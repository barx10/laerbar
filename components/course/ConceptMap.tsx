"use client";

import { useState } from "react";
import { Concept } from "@/lib/types";
import { isInReview, isMastered } from "@/lib/srs";

interface Props {
  concepts: Concept[];
  onAskAI: () => void;
}

type Status = "new" | "review" | "mastered";

function statusOf(concept: Concept): Status {
  if (isMastered(concept)) return "mastered";
  if (isInReview(concept)) return "review";
  return "new";
}

export default function ConceptMap({ concepts, onAskAI }: Props) {
  const mastered = concepts.filter((c) => statusOf(c) === "mastered").length;
  const review = concepts.filter((c) => statusOf(c) === "review").length;

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="font-heading text-xl text-dg mb-1">Kjernekonsepter</h2>
          <p className="text-sm text-muted-foreground">
            {mastered} av {concepts.length} mestret
            {review > 0 ? ` · ${review} under repetisjon` : ""}
          </p>
        </div>
        <button
          onClick={onAskAI}
          className="text-sm border border-black/15 px-4 py-2 rounded hover:border-gold hover:text-dg transition-all text-muted-foreground"
        >
          Spør AI-en
        </button>
      </div>

      <div className="grid gap-3">
        {concepts.map((concept, i) => (
          <ConceptCard key={concept.id} concept={concept} index={i} />
        ))}
      </div>
    </div>
  );
}

function ConceptCard({ concept, index }: { concept: Concept; index: number }) {
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
              {concept.mastery_confirmations ?? 0}/2 bekreftet
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
