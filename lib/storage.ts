import { Course } from "./types";
import { migrateCourse } from "./srs";

const STORAGE_KEY = "laerbar_courses";

export function getCourses(): Course[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Course[];
    return raw.map(migrateCourse);
  } catch {
    return [];
  }
}

export function saveCourse(course: Course): void {
  const courses = getCourses();
  const existing = courses.findIndex((c) => c.id === course.id);
  if (existing >= 0) {
    courses[existing] = course;
  } else {
    courses.unshift(course);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function getCourse(id: string): Course | null {
  return getCourses().find((c) => c.id === id) ?? null;
}

export function deleteCourse(id: string): void {
  const courses = getCourses().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function exportBackup(): string {
  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    courses: getCourses(),
  };
  return JSON.stringify(payload, null, 2);
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

export function importBackup(raw: string, mode: "merge" | "replace" = "merge"): ImportResult {
  const parsed = JSON.parse(raw);
  const incoming = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.courses)
    ? parsed.courses
    : null;
  if (!incoming) throw new Error("Backup-fil mangler 'courses'.");

  const migrated = (incoming as Course[]).map(migrateCourse);

  if (mode === "replace") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return { imported: migrated.length, skipped: 0 };
  }

  const existing = getCourses();
  const byId = new Map(existing.map((c) => [c.id, c]));
  let imported = 0;
  let skipped = 0;
  for (const course of migrated) {
    if (byId.has(course.id)) {
      skipped++;
      continue;
    }
    byId.set(course.id, course);
    imported++;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(byId.values())));
  return { imported, skipped };
}
