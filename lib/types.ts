export interface Concept {
  id: string;
  title: string;
  question: string;
  answer: string;
  hint: string;
  flashcard_front: string;
  flashcard_back: string;
  mastered: boolean;
  srs?: {
    next_review: string; // ISO date
    interval: number;    // days until next review
  };
}

export interface Course {
  id: string;
  title: string;
  created_at: string;
  concepts: Concept[];
}
