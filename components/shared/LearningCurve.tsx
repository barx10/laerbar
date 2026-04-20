"use client";

import { Course } from "@/lib/types";
import { computeMasteryCurve } from "@/lib/learning-curve";

interface Props {
  courses: Course[];
  weeks?: number;
}

export default function LearningCurve({ courses, weeks = 26 }: Props) {
  const series = computeMasteryCurve(courses, weeks);
  const total = series[series.length - 1]?.count ?? 0;
  const weekAgo = series[series.length - 8]?.count ?? 0;
  const deltaWeek = total - weekAgo;

  return (
    <div className="bg-white border border-black/8 rounded-md p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3 gap-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Læringskurve
        </div>
        <div className="text-[10px] text-muted-foreground hidden sm:block">
          Siste {weeks} uker
        </div>
      </div>

      {total === 0 ? (
        <div className="text-sm text-muted-foreground">
          Ingen konsepter mestret enda. Mestre ditt første i Lær-fanen.
        </div>
      ) : (
        <div className="text-sm text-dg">
          <div>
            <span className="font-heading text-lg">🌱 {total}</span>
          </div>
          <div className="text-muted-foreground text-xs mt-0.5">
            {total === 1 ? "konsept mestret" : "konsepter mestret"}
            {deltaWeek > 0 && ` · +${deltaWeek} denne uka`}
          </div>
        </div>
      )}
    </div>
  );
}
