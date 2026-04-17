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
    ease_factor?: number; // SM-2 ease factor, clamped to [1.3, ~2.7]
    repetitions?: number; // successful reviews in a row (reset by "igjen")
  };
}

export interface Course {
  id: string;
  title: string;
  created_at: string;
  concepts: Concept[];
}
