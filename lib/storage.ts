import { z } from "zod";
import { Course } from "./types";
import { migrateCourse } from "./srs";
import { getStudyLog, setStudyLog, StudyLog } from "./study-log";

const COURSE_KEY_PREFIX = "laerbar_course_";
const COURSE_INDEX_KEY = "laerbar_course_index";
const LEGACY_COURSES_KEY = "laerbar_courses";

// Permissive schemas: optional everything that migrateCourse fills in, so
// older backup shapes still pass validation and get repaired on the way in.
const AttemptSchema = z.object({
  date: z.string(),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  correct: z.boolean(),
});

const SrsSchema = z.object({
  next_review: z.string(),
  interval: z.number(),
  lapses: z.number().optional(),
  ease_factor: z.number().optional(),
  repetitions: z.number().optional(),
});

const ConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  question: z.string(),
  answer: z.string(),
  hint: z.string(),
  flashcard_front: z.string(),
  flashcard_back: z.string(),
  question_variants: z.array(z.string()).optional(),
  mastered: z.boolean().optional(),
  mastery_confirmations: z.number().optional(),
  attempts: z.array(AttemptSchema).optional(),
  srs: SrsSchema.optional(),
});

const CourseSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  created_at: z.string(),
  concepts: z.array(ConceptSchema).min(1),
  source_text: z.string().optional(),
  summary: z.string().optional(),
});

const StudyLogSchema = z.record(z.string(), z.number());

const BackupEnvelopeSchema = z.union([
  z.array(z.unknown()),
  z.object({
    version: z.number().optional(),
    exported_at: z.string().optional(),
    courses: z.array(z.unknown()),
    study_log: z.unknown().optional(),
  }),
]);

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
  invalid: number;
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

interface ParsedBackup {
  validCourses: Course[];
  invalidCount: number;
  studyLog: StudyLog | null;
}

function parseBackup(raw: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Backup-fil er ikke gyldig JSON.");
  }

  const envelope = BackupEnvelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    throw new Error("Backup-fil mangler 'courses'.");
  }

  const rawCourses = Array.isArray(envelope.data) ? envelope.data : envelope.data.courses;
  const studyLogCandidate =
    !Array.isArray(envelope.data) && envelope.data.study_log !== undefined
      ? envelope.data.study_log
      : undefined;

  const validCourses: Course[] = [];
  let invalidCount = 0;
  const seenIds = new Set<string>();

  for (const candidate of rawCourses) {
    const result = CourseSchema.safeParse(candidate);
    if (!result.success) {
      invalidCount++;
      continue;
    }
    if (seenIds.has(result.data.id)) {
      invalidCount++;
      continue;
    }
    seenIds.add(result.data.id);
    validCourses.push(migrateCourse(result.data as Course));
  }

  let studyLog: StudyLog | null = null;
  if (studyLogCandidate !== undefined) {
    const logResult = StudyLogSchema.safeParse(studyLogCandidate);
    if (logResult.success) studyLog = logResult.data;
  }

  return { validCourses, invalidCount, studyLog };
}

export function importBackup(raw: string, mode: "merge" | "replace" = "merge"): ImportResult {
  const { validCourses, invalidCount, studyLog } = parseBackup(raw);

  if (mode === "replace") {
    clearAllCourses();
    const order: string[] = [];
    for (const course of validCourses) {
      localStorage.setItem(courseKey(course.id), JSON.stringify(course));
      order.push(course.id);
    }
    writeIndex(order);
    if (studyLog) setStudyLog(studyLog);
    return { imported: validCourses.length, skipped: 0, invalid: invalidCount };
  }

  const existingIds = new Set(readIndex());
  const newIds: string[] = [];
  let imported = 0;
  let skipped = 0;
  for (const course of validCourses) {
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

  if (studyLog) {
    const merged = { ...getStudyLog() };
    for (const [day, count] of Object.entries(studyLog)) {
      merged[day] = Math.max(merged[day] ?? 0, count);
    }
    setStudyLog(merged);
  }

  return { imported, skipped, invalid: invalidCount };
}
