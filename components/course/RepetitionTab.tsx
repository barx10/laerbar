"use client";

import { useState } from "react";
import { Concept } from "@/lib/types";
import {
  applyGrade,
  daysUntilNext,
  Grade,
  previewInterval,
  isDue,
  MASTERY_THRESHOLD,
  sortDueQueue,
} from "@/lib/srs";

interface Props {
  concepts: Concept[];
  onGrade: (concept: Concept) => void;
}

export default function RepetitionTab({ concepts, onGrade }: Props) {
  const queue = sortDueQueue(concepts.filter(isDue).map((concept) => ({ concept })));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const inReviewCount = concepts.filter((c) => c.srs).length;
  const nextDays = daysUntilNext(concepts);

  function rate(grade: Grade) {
    const concept = queue[index].concept;
    const next = applyGrade(concept, grade);
    onGrade(next);

    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }

  if (inReviewCount === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-3xl mb-4 opacity-40">🔁</div>
        <h2 className="font-heading text-lg text-dg mb-2">Ingenting å repetere ennå</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bevis først at du kan konseptene i Lær-fanen. Derfra legger de seg inn til repetisjon.
        </p>
      </div>
    );
  }

  if (done || queue.length === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-3xl mb-4">✓</div>
        <h2 className="font-heading text-lg text-dg mb-2">
          {done ? "Dagens repetisjon fullført!" : "Ingen kort klar i dag"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {nextDays === 0
            ? "Neste kort blir klart senere i dag."
            : nextDays === 1
            ? "Neste kort er klart i morgen."
            : nextDays
            ? `Neste kort er klart om ${nextDays} dager.`
            : "Alle kort er repetert."}
        </p>
      </div>
    );
  }

  const current = queue[index].concept;
  const lapses = current.srs?.lapses ?? 0;
  const confirmations = current.mastery_confirmations ?? 0;

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading text-xl text-dg mb-1">Repetisjon</h2>
          <p className="text-sm text-muted-foreground">
            {index + 1} av {queue.length} klar i dag
          </p>
        </div>
        <div className="flex gap-2">
          {lapses > 0 && (
            <div className="text-xs text-red-700 border border-red-200 bg-red-50 rounded px-3 py-1.5">
              {lapses} {lapses === 1 ? "bom" : "bommer"}
            </div>
          )}
          <div className="text-xs text-muted-foreground border border-black/10 rounded px-3 py-1.5">
            {confirmations < MASTERY_THRESHOLD
              ? `${confirmations}/${MASTERY_THRESHOLD} bekreftet`
              : "Mestret"}
          </div>
        </div>
      </div>

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
          <div
            className="absolute inset-0 bg-white border border-black/8 rounded-xl flex flex-col items-center justify-center p-8 hover:border-gold/40 transition-colors"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">
              Spørsmål · klikk for å snu
            </p>
            <p className="font-heading text-lg text-dg text-center leading-relaxed">
              {current.flashcard_front}
            </p>
          </div>

          <div
            className="absolute inset-0 bg-gold/8 border border-gold/30 rounded-xl flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">
              Svar · klikk for å snu
            </p>
            <p className="font-heading text-lg text-dg text-center leading-relaxed">
              {current.flashcard_back}
            </p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => rate("igjen")}
            className="flex-1 border border-red-200 bg-red-50 text-red-700 py-2.5 rounded text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Husket ikke
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {previewInterval("igjen", current)} dag
            </span>
          </button>
          <button
            onClick={() => rate("usikkert")}
            className="flex-1 border border-gold/40 bg-gold/8 text-dg py-2.5 rounded text-sm font-medium hover:bg-gold/15 transition-colors"
          >
            Usikkert
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {previewInterval("usikkert", current)} dager
            </span>
          </button>
          <button
            onClick={() => rate("kunne")}
            className="flex-1 border border-lg/30 bg-green-50 text-lg py-2.5 rounded text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Kunne det
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {previewInterval("kunne", current)} dager
            </span>
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Snu kortet for å vurdere</p>
      )}
    </div>
  );
}
