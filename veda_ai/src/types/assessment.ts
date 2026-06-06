export type QuestionType = "mcq" | "short" | "long" | "boolean";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  options?: string[]; // Used for MCQ options
  correctAnswer?: string | string[]; // Answer key / rubrics
  rubrics?: string[]; // Evaluation criteria
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  questions: Question[];
  totalPoints: number;
  timeLimit: number; // in minutes
  createdAt: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  status: "not-started" | "in-progress" | "submitted" | "graded";
  submittedAt?: string;
}
