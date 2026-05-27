"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import StudyHeatmap from "@/components/shared/StudyHeatmap";
import LearningCurve from "@/components/shared/LearningCurve";
import { getCourses, deleteCourse } from "@/lib/storage";
import { useLanguage } from "@/lib/language-context";
import {
  dueCountAcrossCourses,
  daysUntilNextAcrossCourses,
  isInReview,
  isMastered,
} from "@/lib/srs";
import { getStudyLog, StudyLog } from "@/lib/study-log";
import { Course } from "@/lib/types";

export default function Home() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyLog, setStudyLog] = useState<StudyLog>({});

  useEffect(() => {
    setCourses(getCourses());
    setStudyLog(getStudyLog());
  }, []);

  function handleDelete(id: string) {
    deleteCourse(id);
    setCourses(getCourses());
  }

  const dueToday = dueCountAcrossCourses(courses);
  const nextDays = daysUntilNextAcrossCourses(courses);
  const anyInReview = courses.some((c) => c.concepts.some(isInReview));

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 py-12">
        {courses.length > 0 && <StudyHeatmap log={studyLog} />}
        {courses.length > 0 && <LearningCurve courses={courses} />}

        {courses.length > 0 && (dueToday > 0 || anyInReview) && (
          <DailyQueue
            dueToday={dueToday}
            nextDays={nextDays}
            onStart={() => router.push("/today")}
          />
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-heading text-2xl text-dg mb-1">{t.yourCourses}</h2>
            <p className="text-sm text-muted-foreground">
              {courses.length === 0 ? t.noCourses : t.courseCount(courses.length)}
            </p>
          </div>
          {courses.length > 0 && (
            <button
              onClick={() => router.push("/upload")}
              className="bg-dg text-cream px-6 py-2.5 rounded text-sm font-semibold hover:bg-mg transition-colors"
            >
              {t.newCourse}
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white border border-black/8 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4 opacity-40">📚</div>
            <h3 className="font-heading text-lg text-dg mb-2">{t.uploadFirst}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t.uploadFirstDesc}
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-dg text-cream px-7 py-3 rounded text-sm font-semibold hover:bg-mg transition-colors"
            >
              {t.startLearning}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const mastered = course.concepts.filter(isMastered).length;
              const review = course.concepts.filter(
                (c) => isInReview(c) && !isMastered(c)
              ).length;
              const total = course.concepts.length;
              const masteredPct = total > 0 ? (mastered / total) * 100 : 0;
              const reviewPct = total > 0 ? (review / total) * 100 : 0;

              return (
                <div
                  key={course.id}
                  className="bg-white border border-black/8 rounded-md p-5 hover:border-gold/40 transition-all cursor-pointer group"
                  onClick={() => router.push(`/course/${course.id}`)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-base text-dg mb-1 truncate">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {new Date(course.created_at).toLocaleDateString(lang === "en" ? "en-GB" : "nb-NO")} ·{" "}
                        {t.masteredLabel(mastered, total)}
                        {review > 0 ? t.underReviewShort(review) : ""}
                      </p>
                      <div className="relative w-full bg-black/8 rounded-full h-1 overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bg-gold/60 h-1 transition-all"
                          style={{ width: `${masteredPct + reviewPct}%` }}
                        />
                        <div
                          className="absolute left-0 top-0 bg-lg h-1 rounded-l-full transition-all"
                          style={{ width: `${masteredPct}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                      className="text-muted-foreground hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
                      title={t.deleteCourse}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DailyQueue({
  dueToday,
  nextDays,
  onStart,
}: {
  dueToday: number;
  nextDays: number | null;
  onStart: () => void;
}) {
  const { t } = useLanguage();
  if (dueToday > 0) {
    return (
      <div className="bg-dg text-cream rounded-lg p-6 mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gl opacity-80 mb-1">{t.dailySession}</div>
          <div className="font-heading text-xl mb-1">
            {t.dueCount(dueToday)}
          </div>
          <p className="text-xs text-gl opacity-80 leading-relaxed">
            {t.mixedSession}
          </p>
        </div>
        <button
          onClick={onStart}
          className="bg-gold text-dg px-6 py-3 rounded font-semibold text-sm hover:brightness-95 transition-all whitespace-nowrap"
        >
          {t.startSession}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-cream border border-black/8 rounded-lg p-5 mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.dailySession}</div>
        <div className="text-sm text-dg">
          {nextDays === 0
            ? t.newCardsDueLater
            : nextDays === 1
            ? t.nextTomorrow
            : nextDays
            ? t.nextInDays(nextDays)
            : t.allReviewed}
        </div>
      </div>
    </div>
  );
}
