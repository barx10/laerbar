"use client";

import { useState } from "react";
import { Concept } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

interface Props {
  concepts: Concept[];
}

export default function FlashcardsTab({ concepts }: Props) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = concepts.filter((c) => !c.mastered).length > 0
    ? concepts.filter((c) => !c.mastered)
    : concepts;

  const current = cards[index];

  function next() { setFlipped(false); setTimeout(() => setIndex((i) => (i + 1) % cards.length), 50); }
  function prev() { setFlipped(false); setTimeout(() => setIndex((i) => (i - 1 + cards.length) % cards.length), 50); }

  if (cards.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.noCards}</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading text-xl text-dg mb-1">{t.flashcardsTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {t.flashcardsOf(index + 1, cards.length)} · {concepts.filter((c) => !c.mastered).length > 0 ? t.focusUnmastered : t.allConcepts}
          </p>
        </div>
      </div>

      {/* 3D flip-kort */}
      <div style={{ perspective: "1200px" }} className="mb-6">
        <div
          className="relative cursor-pointer select-none"
          style={{
            height: "220px",
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={() => setFlipped((v) => !v)}
        >
          {/* Forside */}
          <div
            className="absolute inset-0 bg-white border border-black/8 rounded-xl flex flex-col items-center justify-center p-8 hover:border-gold/40 transition-colors"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">{t.cardQuestion}</p>
            <p className="font-heading text-lg text-dg text-center leading-relaxed">{current.flashcard_front}</p>
          </div>

          {/* Bakside */}
          <div
            className="absolute inset-0 bg-gold/8 border border-gold/30 rounded-xl flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">{t.cardAnswer}</p>
            <p className="font-heading text-lg text-dg text-center leading-relaxed">{current.flashcard_back}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={prev}
          disabled={cards.length <= 1}
          className="border border-black/15 px-6 py-2.5 rounded text-sm text-muted-foreground hover:border-gold hover:text-dg transition-all disabled:opacity-30"
        >
          {t.prevCard}
        </button>
        <button
          onClick={next}
          disabled={cards.length <= 1}
          className="border border-black/15 px-6 py-2.5 rounded text-sm text-muted-foreground hover:border-gold hover:text-dg transition-all disabled:opacity-30"
        >
          {t.nextCard}
        </button>
      </div>
    </div>
  );
}
