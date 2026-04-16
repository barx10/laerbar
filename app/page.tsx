"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { getCourses, deleteCourse } from "@/lib/storage";
import { Course } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  function handleDelete(id: string) {
    deleteCourse(id);
    setCourses(getCourses());
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-heading text-2xl text-dg mb-1">Dine kurs</h2>
            <p className="text-sm text-muted-foreground">
              {courses.length === 0 ? "Ingen kurs ennå" : `${courses.length} kurs lagret`}
            </p>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="bg-dg text-cream px-6 py-2.5 rounded text-sm font-semibold hover:bg-mg transition-colors"
          >
            + Nytt kurs
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white border border-black/8 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4 opacity-40">📚</div>
            <h3 className="font-heading text-lg text-dg mb-2">Last opp ditt første fagstoff</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Last opp en PDF, og AI trekker ut kjernekonseptene du må bevise at du kan.
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-dg text-cream px-7 py-3 rounded text-sm font-semibold hover:bg-mg transition-colors"
            >
              Start læringsløp
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const mastered = course.concepts.filter((c) => c.mastered).length;
              const total = course.concepts.length;
              const pct = total > 0 ? (mastered / total) * 100 : 0;

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
                        {new Date(course.created_at).toLocaleDateString("nb-NO")} · {mastered}/{total} konsepter mestret
                      </p>
                      <div className="w-full bg-black/8 rounded-full h-1">
                        <div
                          className="bg-gold h-1 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                      className="text-muted-foreground hover:text-red-500 transition-colors text-lg leading-none opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Slett kurs"
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
