import { Concept, Course } from "./types";
import { isMastered, today } from "./srs";
import { addDays } from "./study-log";

/**
 * Returnerer datoen (ISO YYYY-MM-DD) konseptet passerte mestringsterskelen,
 * eller null hvis det ikke er mestret. Utledes fra attempts-loggen:
 * den 2. bestått-attempt markerer terskelen. For eldre mestrede konsepter
 * uten attempts-log, fallback til today().
 */
export function masteredAt(concept: Concept): string | null {
  if (!isMastered(concept)) return null;
  const correctDates = (concept.attempts ?? [])
    .filter((a) => a.correct)
    .map((a) => a.date)
    .sort();
  if (correctDates.length >= 2) return correctDates[1];
  if (correctDates.length === 1) return correctDates[0];
  return today();
}

export interface CurvePoint {
  date: string;
  count: number;
}

/**
 * Bygger en daglig cumulative-serie av antall mestrede konsepter
 * på tvers av alle kurs, over de siste `weeks*7` dagene (siste punkt = i dag).
 */
export function computeMasteryCurve(courses: Course[], weeks: number = 26): CurvePoint[] {
  const masteredDates = courses
    .flatMap((c) => c.concepts.map(masteredAt))
    .filter((d): d is string => d !== null)
    .sort();

  const totalDays = weeks * 7;
  const end = today();
  const series: CurvePoint[] = [];
  let cursor = addDays(end, -(totalDays - 1));
  let idx = 0;

  for (let i = 0; i < totalDays; i++) {
    while (idx < masteredDates.length && masteredDates[idx] <= cursor) idx++;
    series.push({ date: cursor, count: idx });
    cursor = addDays(cursor, 1);
  }

  return series;
}
