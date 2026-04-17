"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { getCourses, saveCourse } from "@/lib/storage";
import {
  applyGrade,
  collectDueAcrossCourses,
  daysUntilNextAcrossCourses,
  DueItem,
  Grade,
  intervalFor,
  MASTERY_THRESHOLD,
} from "@/lib/srs";
import { Course } from "@/lib/types";

export default function TodayPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [queue, setQueue] = useState<DueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [justMastered, setJustMastered] = useState<string | null>(null);

  useEffect(() => {
    const all = getCourses();
    setCourses(all);
    setQueue(collectDueAcrossCourses(all));
  }, []);

  const nextDays = useMemo(
    () => (courses ? daysUntilNextAcrossCourses(courses) : null),
    [courses]
  );

  if (courses === null) {
    return (
      <div className="min-h-screen">
        <Navbar />
      </div>
    );
  }

  const current = queue[index];

  function rate(grade: Grade) {
    if (!current || !courses) return;
    const nextConcept = applyGrade(current.concept, grade);

    const courseIdx = courses.findIndex((c) => c.id === current.course.id);
    if (courseIdx >= 0) {
      const updatedCourse: Course = {
        ...courses[courseIdx],
        concepts: courses[courseIdx].concepts.map((c) =>
          c.id === nextConcept.id ? nextConcept : c
        ),
      };
      saveCourse(updatedCourse);
      const updatedAll = [...courses];
      updatedAll[courseIdx] = updatedCourse;
      setCourses(updatedAll);
    }

    if (
      grade === "kunne" &&
      (nextConcept.mastery_confirmations ?? 0) >= MASTERY_THRESHOLD &&
      (current.concept.mastery_confirmations ?? 0) < MASTERY_THRESHOLD
    ) {
      setJustMastered(nextConcept.title);
      setTimeout(() => setJustMastered(null), 1800);
    }

    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-8 pt-6 pb-2 max-w-3xl">
        <button
          onClick={() => router.push("/")}
          className="text-xs text-muted-foreground hover:text-dg transition-colors mb-3"
        >
          ← Tilbake til oversikt
        </button>
        <h1 className="font-heading text-2xl text-dg">Dagens økt</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Blandet repetisjon på tvers av alle kursene dine
        </p>
      </div>

      <div className="p-8 max-w-2xl">
        {queue.length === 0 ? (
          <EmptyState nextDays={nextDays} onBack={() => router.push("/")} />
        ) : done ? (
          <DoneState
            total={queue.length}
            nextDays={nextDays}
            onBack={() => router.push("/")}
          />
        ) : (
          <ReviewCard
            item={current}
            index={index}
            total={queue.length}
            flipped={flipped}
            onFlip={() => setFlipped((v) => !v)}
            onRate={rate}
            justMastered={justMastered}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ nextDays, onBack }: { nextDays: number | null; onBack: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-3xl mb-4 opacity-40">🌱</div>
      <h2 className="font-heading text-lg text-dg mb-2">Ingen kort klare i dag</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {nextDays === 0
          ? "Nye kort forfaller senere i dag."
          : nextDays === 1
          ? "Neste kort er klart i morgen."
          : nextDays
          ? `Neste kort er klart om ${nextDays} dager.`
          : "Mester først noen konsepter i Lær-fanen, så dukker de opp her."}
      </p>
      <button
        onClick={onBack}
        className="border border-black/15 px-5 py-2 rounded text-sm text-dg hover:border-gold transition-all"
      >
        Til oversikten
      </button>
    </div>
  );
}

function DoneState({
  total,
  nextDays,
  onBack,
}: {
  total: number;
  nextDays: number | null;
  onBack: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-3xl mb-4">✓</div>
      <h2 className="font-heading text-lg text-dg mb-2">Dagens økt fullført</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Du gikk gjennom {total} {total === 1 ? "kort" : "kort"}.{" "}
        {nextDays === 0
          ? "Flere kort forfaller senere i dag."
          : nextDays === 1
          ? "Neste kort er klart i morgen."
          : nextDays
          ? `Neste kort er klart om ${nextDays} dager.`
          : ""}
      </p>
      <button
        onClick={onBack}
        className="bg-dg text-cream px-5 py-2 rounded text-sm font-semibold hover:bg-mg transition-colors"
      >
        Ferdig
      </button>
    </div>
  );
}

function ReviewCard({
  item,
  index,
  total,
  flipped,
  onFlip,
  onRate,
  justMastered,
}: {
  item: DueItem;
  index: number;
  total: number;
  flipped: boolean;
  onFlip: () => void;
  onRate: (grade: Grade) => void;
  justMastered: string | null;
}) {
  const { concept, course } = item;
  const currentInterval = concept.srs?.interval ?? 1;
  const lapses = concept.srs?.lapses ?? 0;
  const confirmations = concept.mastery_confirmations ?? 0;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Fra kurs
          </div>
          <div className="text-sm text-dg font-medium">{course.title}</div>
        </div>
        <div className="flex gap-2 items-center">
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

      <div className="text-xs text-muted-foreground mb-4">
        {index + 1} av {total} klar i dag
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
          onClick={onFlip}
        >
          <div
            className="absolute inset-0 bg-white border border-black/8 rounded-xl flex flex-col items-center justify-center p-8 hover:border-gold/40 transition-colors"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-5">
              Spørsmål · klikk for å snu
            </p>
            <p className="font-heading text-lg text-dg text-center leading-relaxed">
              {concept.flashcard_front}
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
              {concept.flashcard_back}
            </p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onRate("igjen")}
            className="flex-1 border border-red-200 bg-red-50 text-red-700 py-2.5 rounded text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Husket ikke
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {intervalFor("igjen", currentInterval)} dag
            </span>
          </button>
          <button
            onClick={() => onRate("usikkert")}
            className="flex-1 border border-gold/40 bg-gold/8 text-dg py-2.5 rounded text-sm font-medium hover:bg-gold/15 transition-colors"
          >
            Usikkert
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {Math.round(intervalFor("usikkert", currentInterval))} dager
            </span>
          </button>
          <button
            onClick={() => onRate("kunne")}
            className="flex-1 border border-lg/30 bg-green-50 text-lg py-2.5 rounded text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Kunne det
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              om {Math.round(intervalFor("kunne", currentInterval))} dager
            </span>
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Snu kortet for å vurdere</p>
      )}

      {justMastered && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-lg text-cream px-5 py-3 rounded-lg shadow-lg text-sm font-semibold">
          ✓ «{justMastered}» er nå mestret
        </div>
      )}
    </>
  );
}
