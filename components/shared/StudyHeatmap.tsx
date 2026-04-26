"use client";

import { getStreak, StudyLog } from "@/lib/study-log";
import { addDays, today } from "@/lib/srs";
import { useLanguage } from "@/lib/language-context";

interface Props {
  log: StudyLog;
  weeks?: number;
}

const CELL_PX = 12;
const GAP_PX = 3;

function intensityClass(count: number): string {
  if (count === 0) return "bg-black/8";
  if (count <= 1) return "bg-gold/50";
  if (count <= 3) return "bg-gold/75";
  return "bg-gold";
}

function isoWeekdayIndex(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

export default function StudyHeatmap({ log, weeks = 26 }: Props) {
  const { t } = useLanguage();
  const todayStr = today();
  const streak = getStreak(todayStr);
  const totalDays = weeks * 7;

  const todayWeekdayIdx = isoWeekdayIndex(todayStr);
  const startOffset = -(weeks - 1) * 7 - todayWeekdayIdx;

  const cells: { date: string; count: number; future: boolean }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(todayStr, startOffset + i);
    cells.push({
      date,
      count: log[date] ?? 0,
      future: date > todayStr,
    });
  }

  const studiedToday = (log[todayStr] ?? 0) > 0;

  return (
    <div className="bg-white border border-black/8 rounded-md p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">{t.studyActivityLabel}</div>
          {streak > 0 ? (
            <div className="text-sm text-dg">
              <span className="font-heading text-lg">🔥 {t.streakDays(streak)}</span>
              {!studiedToday && (
                <span className="text-muted-foreground text-xs">{t.streakKeepGoing}</span>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t.noStreak}
            </div>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground hidden sm:block">
          {t.lastWeeks(weeks)}
        </div>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 min-w-min">
          <div className="flex flex-col" style={{ gap: GAP_PX }}>
            {t.weekdayLabels.map((d, i) => (
              <div
                key={i}
                className="text-[9px] text-muted-foreground text-right w-3"
                style={{ height: CELL_PX, lineHeight: `${CELL_PX}px` }}
              >
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${weeks}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
              gridAutoFlow: "column",
              gap: GAP_PX,
            }}
          >
            {cells.map((cell, i) => (
              <div
                key={i}
                className={`rounded-sm ${cell.future ? "bg-transparent" : intensityClass(cell.count)}`}
                style={{ width: CELL_PX, height: CELL_PX }}
                title={cell.future ? "" : `${cell.date}: ${t.heatmapRegistrations(cell.count)}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
