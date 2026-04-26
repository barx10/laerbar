import { Course } from "./types";
import { migrateCourse } from "./srs";
import { getStudyLog, setStudyLog, StudyLog } from "./study-log";

const COURSE_KEY_PREFIX = "laerbar_course_";
const COURSE_INDEX_KEY = "laerbar_course_index";
const LEGACY_COURSES_KEY = "laerbar_courses";

function courseKey(id: string): string {
  return COURSE_KEY_PREFIX + id;
}

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COURSE_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(COURSE_INDEX_KEY, JSON.stringify(ids));
}

function readCourse(id: string): Course | null {
  try {
    const raw = localStorage.getItem(courseKey(id));
    if (!raw) return null;
    return migrateCourse(JSON.parse(raw) as Course);
  } catch {
    return null;
  }
}

// Self-heal: if the index is missing or out of sync with the actual stored
// keys (e.g. interrupted save, manual cleanup), rebuild it from what's there.
// New ids go to the front since we don't know the original order.
function reconcileIndex(): string[] {
  const stored = readIndex();
  const present = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(COURSE_KEY_PREFIX)) {
      present.add(key.slice(COURSE_KEY_PREFIX.length));
    }
  }
  const inOrder = stored.filter((id) => present.has(id));
  const missing = [...present].filter((id) => !inOrder.includes(id));
  const reconciled = [...missing, ...inOrder];
  if (
    reconciled.length !== stored.length ||
    reconciled.some((id, i) => id !== stored[i])
  ) {
    writeIndex(reconciled);
  }
  return reconciled;
}

// One-shot migration from the old single-key layout. Idempotent: only runs
// if the legacy key still exists. Failures leave the legacy key in place so
// the user can retry on next load instead of losing data silently.
function migrateLegacyIfNeeded(): void {
  if (typeof window === "undefined") return;
  const legacy = localStorage.getItem(LEGACY_COURSES_KEY);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy) as Course[];
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(LEGACY_COURSES_KEY);
      return;
    }
    const existingIndex = new Set(readIndex());
    const order: string[] = [];
    for (const course of parsed) {
      if (!course || typeof course.id !== "string") continue;
      if (!existingIndex.has(course.id)) {
        localStorage.setItem(courseKey(course.id), JSON.stringify(course));
      }
      order.push(course.id);
    }
    const finalIndex = [...order, ...readIndex().filter((id) => !order.includes(id))];
    writeIndex(finalIndex);
    localStorage.removeItem(LEGACY_COURSES_KEY);
  } catch {
    // Leave legacy key intact; user retries on next load.
  }
}

export function getCourses(): Course[] {
  if (typeof window === "undefined") return [];
  migrateLegacyIfNeeded();
  const ids = reconcileIndex();
  const courses: Course[] = [];
  for (const id of ids) {
    const course = readCourse(id);
    if (course) courses.push(course);
  }
  return courses;
}

export function getCourse(id: string): Course | null {
  if (typeof window === "undefined") return null;
  migrateLegacyIfNeeded();
  return readCourse(id);
}

export function saveCourse(course: Course): void {
  if (typeof window === "undefined") return;
  migrateLegacyIfNeeded();
  localStorage.setItem(courseKey(course.id), JSON.stringify(course));
  const ids = readIndex();
  if (!ids.includes(course.id)) {
    writeIndex([course.id, ...ids]);
  }
}

export function deleteCourse(id: string): void {
  if (typeof window === "undefined") return;
  migrateLegacyIfNeeded();
  localStorage.removeItem(courseKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
}

export function exportBackup(): string {
  const payload = {
    version: 2,
    exported_at: new Date().toISOString(),
    courses: getCourses(),
    study_log: getStudyLog(),
  };
  return JSON.stringify(payload, null, 2);
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

function clearAllCourses(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(COURSE_KEY_PREFIX)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
  localStorage.removeItem(COURSE_INDEX_KEY);
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
  const incomingLog = (parsed?.study_log && typeof parsed.study_log === "object")
    ? (parsed.study_log as StudyLog)
    : null;

  if (mode === "replace") {
    clearAllCourses();
    const order: string[] = [];
    for (const course of migrated) {
      localStorage.setItem(courseKey(course.id), JSON.stringify(course));
      order.push(course.id);
    }
    writeIndex(order);
    if (incomingLog) setStudyLog(incomingLog);
    return { imported: migrated.length, skipped: 0 };
  }

  const existingIds = new Set(readIndex());
  const newIds: string[] = [];
  let imported = 0;
  let skipped = 0;
  for (const course of migrated) {
    if (existingIds.has(course.id)) {
      skipped++;
      continue;
    }
    localStorage.setItem(courseKey(course.id), JSON.stringify(course));
    newIds.push(course.id);
    existingIds.add(course.id);
    imported++;
  }
  if (newIds.length > 0) {
    writeIndex([...newIds, ...readIndex()]);
  }

  if (incomingLog) {
    const merged = { ...getStudyLog() };
    for (const [day, count] of Object.entries(incomingLog)) {
      merged[day] = Math.max(merged[day] ?? 0, count);
    }
    setStudyLog(merged);
  }

  return { imported, skipped };
}
