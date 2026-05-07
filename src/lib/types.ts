export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  source_filename?: string;
  created_at: number;
}

export interface TestSession {
  id: string;
  test_id: string;
  answers: Record<string, number | null>;
  score: number;
  max_score: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  completed_at: number;
}

export interface ScoringConfig {
  correct_pts: number;
  wrong_pts: number;
  unanswered_pts: number;
}
