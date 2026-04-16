"use client";

import { useState } from "react";
import { Course } from "@/lib/types";
import ConceptMap from "./ConceptMap";
import LearnTab from "./LearnTab";
import FlashcardsTab from "./FlashcardsTab";
import RepetitionTab from "./RepetitionTab";
import DownloadTab from "./DownloadTab";

const TABS = [
  { id: "oversikt", label: "Oversikt" },
  { id: "laer", label: "Lær" },
  { id: "repeter", label: "Repeter" },
  { id: "flashcards", label: "Flashcards" },
  { id: "last-ned", label: "Last ned" },
] as const;

type TabId = typeof TABS[number]["id"];

interface Props {
  course: Course;
  onUpdate: (course: Course) => void;
}

export default function CourseTabs({ course, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("oversikt");
  const [showAIChat, setShowAIChat] = useState(false);

  function markMastered(conceptId: string, firstReview: string) {
    const updated = {
      ...course,
      concepts: course.concepts.map((c) =>
        c.id === conceptId
          ? { ...c, mastered: true, srs: { next_review: firstReview, interval: 1 } }
          : c
      ),
    };
    onUpdate(updated);
  }

  return (
    <div>
      {/* Tab-navigasjon — fagdykk-stil */}
      <nav className="bg-mg flex border-b-2 border-gold overflow-x-auto">
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
          <ConceptMap
            concepts={course.concepts}
            onAskAI={() => setShowAIChat(true)}
          />
        )}
        {activeTab === "laer" && (
          <LearnTab concepts={course.concepts} onMastered={markMastered} />
        )}
        {activeTab === "repeter" && (
          <RepetitionTab
            concepts={course.concepts}
            onUpdate={(id, srs) => {
              const updated = {
                ...course,
                concepts: course.concepts.map((c) =>
                  c.id === id ? { ...c, srs } : c
                ),
              };
              onUpdate(updated);
            }}
          />
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
