"use client";

import { useState } from "react";
import { Concept, Course } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";
import OverviewTab from "./OverviewTab";
import LearnTab from "./LearnTab";
import FlashcardsTab from "./FlashcardsTab";
import RepetitionTab from "./RepetitionTab";
import DownloadTab from "./DownloadTab";

type TabId = "oversikt" | "laer" | "repeter" | "flashcards" | "last-ned";

interface Props {
  course: Course;
  onUpdate: (course: Course) => void;
}

export default function CourseTabs({ course, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("oversikt");
  const { t } = useLanguage();
  const TABS = [
    { id: "oversikt" as const, label: t.tabOversikt },
    { id: "laer" as const, label: t.tabLaer },
    { id: "repeter" as const, label: t.tabRepeter },
    { id: "flashcards" as const, label: t.tabFlashcards },
    { id: "last-ned" as const, label: t.tabLastNed },
  ];

  function updateConcept(next: Concept) {
    onUpdate({
      ...course,
      concepts: course.concepts.map((c) => (c.id === next.id ? next : c)),
    });
  }

  return (
    <div>
      <nav className="bg-mg flex border-b-2 border-gold overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-sans text-xs font-medium tracking-widest uppercase text-cream px-5 py-3.5 border-none transition-all whitespace-nowrap border-b-[3px] -mb-0.5 ${
              activeTab === tab.id
                ? "opacity-100 border-b-gold bg-gold/10"
                : "opacity-60 border-b-transparent hover:opacity-90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-8">
        {activeTab === "oversikt" && (
          <OverviewTab course={course} onUpdate={onUpdate} />
        )}
        {activeTab === "laer" && (
          <LearnTab
            concepts={course.concepts}
            sourceText={course.source_text}
            onConceptUpdate={updateConcept}
          />
        )}
        {activeTab === "repeter" && (
          <RepetitionTab concepts={course.concepts} onGrade={updateConcept} />
        )}
        {activeTab === "flashcards" && (
          <FlashcardsTab concepts={course.concepts} />
        )}
        {activeTab === "last-ned" && (
          <DownloadTab course={course} />
        )}
      </main>
    </div>
  );
}
