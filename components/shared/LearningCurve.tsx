"use client";

import { Course } from "@/lib/types";
import { computeMasteryCurve } from "@/lib/learning-curve";

interface Props {
  courses: Course[];
  weeks?: number;
}

function buildSparklinePaths(series: { date: string; count: number }[], width: number, height: number) {
  const max = Math.max(1, series[series.length - 1]?.count ?? 0);
  const step = width / Math.max(1, series.length - 1);
  const points = series.map((p, i) => {
    const x = i * step;
    const y = height - (p.count / max) * height;
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${width.toFixed(1)},${height} L0,${height} Z`;

  return { line, area };
}

export default function LearningCurve({ courses, weeks = 26 }: Props) {
  const series = computeMasteryCurve(courses, weeks);
  const total = series[series.length - 1]?.count ?? 0;
  const weekAgo = series[series.length - 8]?.count ?? 0;
  const deltaWeek = total - weekAgo;
  const SPARK_W = 560;
  const SPARK_H = 60;
  const paths = total > 0 ? buildSparklinePaths(series, SPARK_W, SPARK_H) : null;

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
        <>
          <div className="text-sm text-dg">
            <div>
              <span className="font-heading text-lg">🌱 {total}</span>
            </div>
            <div className="text-muted-foreground text-xs mt-0.5">
              {total === 1 ? "konsept mestret" : "konsepter mestret"}
              {deltaWeek > 0 && ` · +${deltaWeek} denne uka`}
            </div>
          </div>
          {paths && (
            <svg
              className="w-full mt-4 block"
              viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={paths.area} className="fill-gold/25" />
              <path d={paths.line} className="stroke-gold fill-none" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          )}
        </>
      )}
    </div>
  );
}
