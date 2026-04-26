"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import CourseTabs from "@/components/course/CourseTabs";
import { getCourse, saveCourse } from "@/lib/storage";
import { isInReview, isMastered } from "@/lib/srs";
import { Course } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const found = getCourse(id);
    if (!found) router.push("/");
    else setCourse(found);
  }, [id, router]);

  function handleUpdate(updated: Course) {
    saveCourse(updated);
    setCourse(updated);
  }

  if (!course) return null;

  const mastered = course.concepts.filter(isMastered).length;
  const inReview = course.concepts.filter(
    (c) => isInReview(c) && !isMastered(c)
  ).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-8 pt-6 pb-2 max-w-3xl">
        <button
          onClick={() => router.push("/")}
          className="text-xs text-muted-foreground hover:text-dg transition-colors mb-3"
        >
          {t.backHome}
        </button>
        <h1 className="font-heading text-2xl text-dg">{course.title}</h1>
        <p className="text-xs text-muted-foreground mt-1 mb-0">
          {new Date(course.created_at).toLocaleDateString(lang === "en" ? "en-GB" : "nb-NO")} · {t.masteredLabel(mastered, course.concepts.length)}
          {inReview > 0 ? t.underReviewShort(inReview) : ""}
        </p>
      </div>
      <CourseTabs course={course} onUpdate={handleUpdate} />
    </div>
  );
}
