import { Concept, Course } from "./types";

export const MASTERY_THRESHOLD = 2;

// SM-2 constants
const EF_DEFAULT = 2.5;
const EF_MIN = 1.3;

export type Grade = "igjen" | "usikkert" | "kunne";

// Ease-factor delta per grade, derived from classic SM-2 quality mapping
// (igjen=q1 → -0.54, usikkert=q3 → -0.14, kunne=q5 → +0.10).
function adjustEaseFactor(ef: number, grade: Grade): number {
  const delta = grade === "kunne" ? 0.1 : grade === "usikkert" ? -0.14 : -0.54;
  return Math.max(EF_MIN, ef + delta);
}

// Next interval in days. Reps is the count of successful reviews *before* this one.
function nextInterval(grade: Grade, currentInterval: number, reps: number, newEf: number): number {
  if (grade === "igjen") return 1;
  if (reps === 0) return grade === "usikkert" ? 2 : 3;
  if (reps === 1) return grade === "usikkert" ? 4 : 6;
  return Math.max(currentInterval + 1, Math.round(currentInterval * newEf));
}

function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toLocalIso(new Date());
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + Math.round(delta));
  return toLocalIso(d);
}

export function isDue(concept: Concept): boolean {
  return !!concept.srs && concept.srs.next_review <= today();
}

export function isInReview(concept: Concept): boolean {
  return !!concept.srs;
}

export function isUnseen(concept: Concept): boolean {
  return !concept.srs;
}

export function isMastered(concept: Concept): boolean {
  return (concept.mastery_confirmations ?? (concept.mastered ? MASTERY_THRESHOLD : 0)) >= MASTERY_THRESHOLD;
}

export function daysUntilNext(concepts: Concept[]): number | null {
  const future = concepts
    .filter((c) => c.srs && !isDue(c))
    .map((c) =>
      Math.ceil((new Date(c.srs!.next_review).getTime() - Date.now()) / 86400000)
    );
  if (future.length === 0) return null;
  return Math.min(...future);
}

// Velg hvilken formulering av spørsmålet som vises i denne repetisjonen.
// Bruker repetitions som deterministisk rotator: runde 0 → original flashcard_front,
// runde 1 → variant[0], osv. Modulo total antall formuleringer. Faller tilbake til
// flashcard_front hvis varianter ikke er generert enda (legacy / cold-start).
export function pickQuestionVariant(concept: Concept): string {
  const variants = concept.question_variants ?? [];
  if (variants.length === 0) return concept.flashcard_front;
  const reps = concept.srs?.repetitions ?? 0;
  const pool = [concept.flashcard_front, ...variants];
  return pool[reps % pool.length];
}

// Preview the next interval for a given grade without mutating state.
// Used by RepetitionTab to label the "om N dager" hint on each button.
export function previewInterval(grade: Grade, concept: Concept): number {
  const srs = concept.srs;
  if (!srs) return 1;
  const ef = srs.ease_factor ?? EF_DEFAULT;
  const reps = srs.repetitions ?? 0;
  const newEf = adjustEaseFactor(ef, grade);
  return nextInterval(grade, srs.interval, reps, newEf);
}

// Pure: compute next state of a concept given a review grade (SM-2).
export function applyGrade(concept: Concept, grade: Grade): Concept {
  const current = concept.srs ?? {
    next_review: today(),
    interval: 1,
    lapses: 0,
    ease_factor: EF_DEFAULT,
    repetitions: 0,
  };
  const lapses = current.lapses ?? 0;
  const ef = current.ease_factor ?? EF_DEFAULT;
  const reps = current.repetitions ?? 0;
  const confirmations = concept.mastery_confirmations ?? 0;

  const newEf = adjustEaseFactor(ef, grade);
  const newInterval = nextInterval(grade, current.interval, reps, newEf);
  const newReps = grade === "igjen" ? 0 : reps + 1;
  const newLapses = grade === "igjen" ? lapses + 1 : lapses;
  const newConfirmations =
    grade === "kunne" ? confirmations + 1 : grade === "igjen" ? 0 : confirmations;

  return {
    ...concept,
    mastery_confirmations: newConfirmations,
    mastered: newConfirmations >= MASTERY_THRESHOLD,
    srs: {
      next_review: addDays(today(), newInterval),
      interval: newInterval,
      lapses: newLapses,
      ease_factor: newEf,
      repetitions: newReps,
    },
  };
}

// Called when a concept passes its first free-recall test in Lær.
// Gives it one confirmation but keeps mastered=false — the learner must prove
// retention at least one more time (on a later day) before it counts as mastered.
export function applyFirstPass(concept: Concept): Concept {
  return {
    ...concept,
    mastery_confirmations: 1,
    mastered: false,
    srs: {
      next_review: today(),
      interval: 1,
      lapses: 0,
      ease_factor: EF_DEFAULT,
      repetitions: 0,
    },
  };
}

// Queue sort: highest lapses first (struggling cards), then oldest next_review.
export function sortDueQueue<T extends { concept: Concept }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const la = a.concept.srs?.lapses ?? 0;
    const lb = b.concept.srs?.lapses ?? 0;
    if (lb !== la) return lb - la;
    const ra = a.concept.srs?.next_review ?? "";
    const rb = b.concept.srs?.next_review ?? "";
    return ra.localeCompare(rb);
  });
}

export interface DueItem {
  course: Course;
  concept: Concept;
}

export function collectDueAcrossCourses(courses: Course[]): DueItem[] {
  const items: DueItem[] = [];
  for (const course of courses) {
    for (const concept of course.concepts) {
      if (isDue(concept)) items.push({ course, concept });
    }
  }
  return sortDueQueue(items);
}

export function dueCountAcrossCourses(courses: Course[]): number {
  return collectDueAcrossCourses(courses).length;
}

export function daysUntilNextAcrossCourses(courses: Course[]): number | null {
  const all = courses.flatMap((c) => c.concepts);
  return daysUntilNext(all);
}

// Migrate a concept from older shapes. Safe to run on every load — idempotent.
export function migrateConcept(concept: Concept): Concept {
  const legacyMastered = !!concept.mastered;
  const confirmations =
    concept.mastery_confirmations ?? (legacyMastered ? MASTERY_THRESHOLD : 0);

  let srs = concept.srs;
  if (srs) {
    // Estimate repetitions from existing interval so SM-2 picks up a sensible curve:
    // interval ≤ 1 → 0 reps, < 6 → 1 rep, ≥ 6 → 2 reps (third review onward uses ef * interval).
    const inferredReps = srs.interval <= 1 ? 0 : srs.interval < 6 ? 1 : 2;
    srs = {
      ...srs,
      lapses: srs.lapses ?? 0,
      ease_factor: srs.ease_factor ?? EF_DEFAULT,
      repetitions: srs.repetitions ?? inferredReps,
    };
  }

  return {
    ...concept,
    mastered: confirmations >= MASTERY_THRESHOLD,
    mastery_confirmations: confirmations,
    attempts: concept.attempts ?? [],
    srs,
  };
}

export function migrateCourse(course: Course): Course {
  return {
    ...course,
    concepts: course.concepts.map(migrateConcept),
  };
}
