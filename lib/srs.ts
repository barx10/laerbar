import { Concept, Course } from "./types";

export const MASTERY_THRESHOLD = 2;

export type Grade = "igjen" | "usikkert" | "kunne";

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split("T")[0];
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

export function intervalFor(grade: Grade, current: number): number {
  if (grade === "igjen") return 1;
  if (grade === "usikkert") return Math.max(2, current * 1.5);
  return Math.max(3, current * 2.5);
}

// Pure: compute next state of a concept given a review grade.
export function applyGrade(concept: Concept, grade: Grade): Concept {
  const current = concept.srs ?? { next_review: today(), interval: 1, lapses: 0 };
  const lapses = current.lapses ?? 0;
  const confirmations = concept.mastery_confirmations ?? 0;

  const newInterval = intervalFor(grade, current.interval);
  let newLapses = lapses;
  let newConfirmations = confirmations;

  if (grade === "igjen") {
    newLapses = lapses + 1;
    newConfirmations = 0;
  } else if (grade === "kunne") {
    newConfirmations = confirmations + 1;
  }

  return {
    ...concept,
    mastery_confirmations: newConfirmations,
    mastered: newConfirmations >= MASTERY_THRESHOLD,
    srs: {
      next_review: addDays(newInterval),
      interval: newInterval,
      lapses: newLapses,
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
  const srs = concept.srs
    ? { ...concept.srs, lapses: concept.srs.lapses ?? 0 }
    : concept.srs;
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
