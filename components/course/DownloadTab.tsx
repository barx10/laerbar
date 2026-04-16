"use client";

import { Course } from "@/lib/types";
import { generateHtml } from "@/lib/html-export";

interface Props {
  course: Course;
}

export default function DownloadTab({ course }: Props) {
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
      <h2 className="font-heading text-xl text-dg mb-1.5">Last ned</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Last ned kurset som en selvinneholdt HTML-fil du kan åpne offline. Inneholder alle konsepter, spørsmål, svar og flashcards.
      </p>

      <button
        onClick={download}
        className="bg-dg text-cream px-7 py-3 rounded text-sm font-semibold hover:bg-mg transition-colors"
      >
        Last ned HTML
      </button>
    </div>
  );
}
