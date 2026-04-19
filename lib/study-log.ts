import { today } from "./srs";

const KEY = "laerbar_study_log";

export type StudyLog = Record<string, number>;

export function getStudyLog(): StudyLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return typeof raw === "object" && raw !== null ? (raw as StudyLog) : {};
  } catch {
    return {};
  }
}

export function logStudyToday(): void {
  if (typeof window === "undefined") return;
  const log = getStudyLog();
  const day = today();
  log[day] = (log[day] ?? 0) + 1;
  localStorage.setItem(KEY, JSON.stringify(log));
}

export function setStudyLog(log: StudyLog): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(log));
}

export function getStreak(reference: string = today()): number {
  const log = getStudyLog();
  const days = new Set(Object.keys(log).filter((d) => log[d] > 0));

  let cursor = reference;
  if (!days.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!days.has(cursor)) return 0;
  }

  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function getLastStudied(): string | null {
  const log = getStudyLog();
  const days = Object.keys(log).filter((d) => log[d] > 0).sort();
  return days.length > 0 ? days[days.length - 1] : null;
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
