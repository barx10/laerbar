"use client";

import { useState } from "react";
import { Concept } from "@/lib/types";

interface Props {
  concepts: Concept[];
  onAskAI: () => void;
}

export default function ConceptMap({ concepts, onAskAI }: Props) {
  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="font-heading text-xl text-dg mb-1">Kjernekonsepter</h2>
          <p className="text-sm text-muted-foreground">
            {concepts.filter((c) => c.mastered).length} av {concepts.length} mestret
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

  return (
    <div
      className={`bg-white rounded-md border px-5 py-4 transition-all ${
        concept.mastered
          ? "border-lg/30 bg-green-50/50"
          : "border-black/8"
      }`}
    >
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              concept.mastered
                ? "bg-lg text-cream"
                : "bg-black/8 text-muted-foreground"
            }`}
          >
            {concept.mastered ? "✓" : index + 1}
          </span>
          <span className="font-heading text-base text-dg">{concept.title}</span>
        </div>
        <span className="text-muted-foreground text-xs transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : undefined }}>▼</span>
      </div>

      {expanded && (
        <div className="mt-3 pl-9 text-sm leading-relaxed border-t border-black/6 pt-3">
          {concept.mastered ? (
            <span className="text-gray-700">{concept.answer}</span>
          ) : (
            <span className="text-muted-foreground">{concept.question}</span>
          )}
        </div>
      )}
    </div>
  );
}
