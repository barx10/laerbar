export interface Attempt {
  date: string; // ISO date YYYY-MM-DD
  confidence: 1 | 2 | 3;
  correct: boolean;
}

export interface Concept {
  id: string;
  title: string;
  question: string;
  answer: string;
  hint: string;
  flashcard_front: string;
  flashcard_back: string;
  mastered: boolean;
  mastery_confirmations?: number;
  attempts?: Attempt[];
  srs?: {
    next_review: string; // ISO date
    interval: number;    // days until next review
    lapses?: number;
  };
}

export interface Course {
  id: string;
  title: string;
  created_at: string;
  concepts: Concept[];
}
