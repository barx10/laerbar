"use client";

import { Course } from "@/lib/types";
import { generateHtml } from "@/lib/html-export";
import { useLanguage } from "@/lib/language-context";

interface Props {
  course: Course;
}

export default function DownloadTab({ course }: Props) {
  const { t } = useLanguage();
  function download() {
    const html = generateHtml(course);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.title.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading text-xl text-dg mb-1.5">{t.downloadTitle}</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {t.downloadDesc}
      </p>

      <button
        onClick={download}
        className="bg-dg text-cream px-7 py-3 rounded text-sm font-semibold hover:bg-mg transition-colors"
      >
        {t.downloadBtn}
      </button>
    </div>
  );
}
