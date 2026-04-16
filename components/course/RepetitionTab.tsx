"use client";

import { useState } from "react";
import { Concept } from "@/lib/types";

interface Props {
  concepts: Concept[];
  onUpdate: (id: string, srs: { next_review: string; interval: number }) => void;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split("T")[0];
}

function isDue(concept: Concept): boolean {
  if (!concept.mastered || !concept.srs) return false;
  return concept.srs.next_review <= new Date().toISOString().split("T")[0];
}

function daysUntilNext(concepts: Concept[]): number | null {
  const future = concepts
    .filter((c) => c.mastered && c.srs && !isDue(c))
    .map((c) => {
      const diff = Math.ceil(
        (new Date(c.srs!.next_review).getTime() - Date.now()) / 86400000
      );
      return diff;
    });
  if (future.length === 0) return null;
  return Math.min(...future);
}

export default function RepetitionTab({ concepts, onUpdate }: Props) {
  const due = concepts.filter(isDue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const unmastered = concepts.filter((c) => !c.mastered).length;
  const nextDays = daysUntilNext(concepts);

  function rate(grade: "igjen" | "usikkert" | "kunne") {
    const concept = due[index];
    const current = concept.srs!;

    let newInterval: number;
    if (grade === "igjen") {
      newInterval = 1;
    } else if (grade === "usikkert") {
      newInterval = Math.max(2, current.interval * 1.5);
    } else {
      newInterval = Math.max(3, current.interval * 2.5);
    }

    onUpdate(concept.id, {
      next_review: addDays(newInterval),
      interval: newInterval,
    });

    if (index + 1 >= due.length) {
      setDone(true);
    } else {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }

  // Ingen mestrende konsepter ennå
  if (concepts.filter((c) => c.mastered).length === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-3xl mb-4 opacity-40">🔁</div>
        <h2 className="font-heading text-lg text-dg mb-2">Ingenting å repetere ennå</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {unmastered > 0
            ? `Mestre konseptene i Lær-fanen først — da dukker de opp her for repetisjon.`
            : "Alle konsepter er mestret og repetert."}
        </p>
      </div>
    );
  }

  // Ferdig med dagens kort
  if (done || due.length === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-3xl mb-4">✓</div>
        <h2 className="font-heading text-lg text-dg mb-2">
          {done ? "Dagens repetisjon fullført!" : "Ingen kort klar i dag"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {nextDays === 1
            ? "Neste kort er klart i morgen."
            : nextDays
            ? `Neste kort er klart om ${nextDays} dager.`
            : "Alle kort er repetert."}
        </p>
      </div>
    );
  }

  const current = due[index];

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading text-xl text-dg mb-1">Repetisjon</h2>
          <p className="text-sm text-muted-foreground">
            {index + 1} av {due.length} klar i dag
          </p>
        </div>
        <div className="text-xs text-muted-foreground border border-black/10 rounded px-3 py-1.5">
          Intervall: {current.srs?.interval ?? 1} {current.srs?.interval === 1 ? "dag" : "dager"}
        </div>
      </div>

      {/* Kort med 3D-flip */}
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

      {/* Vurderingsknapper — vises kun etter flip */}
      {flipped ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => rate("igjen")}
            className="flex-1 border border-red-200 bg-red-50 text-red-700 py-2.5 rounded text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Husket ikke
            <span className="block text-xs font-normal opacity-70 mt-0.5">om 1 dag</span>
          </button>
          <button
            onClick={() => rate("usikkert")}
            className="flex-1 border border-gold/40 bg-gold/8 text-dg py-2.5 rounded text-sm font-medium hover:bg-gold/15 transition-colors"
          >
            Usikkert
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {Math.round(Math.max(2, (current.srs?.interval ?? 1) * 1.5))} dager
            </span>
          </button>
          <button
            onClick={() => rate("kunne")}
            className="flex-1 border border-lg/30 bg-green-50 text-lg py-2.5 rounded text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Kunne det
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {Math.round(Math.max(3, (current.srs?.interval ?? 1) * 2.5))} dager
            </span>
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Snu kortet for å vurdere</p>
      )}
    </div>
  );
}
