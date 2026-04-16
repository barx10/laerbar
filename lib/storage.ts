import { Course } from "./types";

const STORAGE_KEY = "laerbar_courses";

export function getCourses(): Course[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
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
