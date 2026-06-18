export interface Question {
  id: string;
  text: string;
  type: "mcq" | "short" | "long" | "boolean";
  points: number;
  options?: string[];
}

export interface Assignment {
  id: string | null;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
  totalPoints: number;
  timeLimit: number; // in minutes
}

export const initialAssignment: Assignment = {
  id: null,
  title: "",
  difficulty: "medium",
  questions: [],
  totalPoints: 0,
  timeLimit: 60,
};

// Vanilla state holder that can be easily plugged into context or Zustand later
export class AssignmentStore {
  private listeners: Set<() => void> = new Set();
  private state: Assignment = { ...initialAssignment };

  getState() {
    return this.state;
  }

  setState(newState: Partial<Assignment>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Common operations
  updateTitle(title: string) {
    this.setState({ title });
  }

  setDifficulty(difficulty: "easy" | "medium" | "hard") {
    this.setState({ difficulty });
  }

  addQuestion(question: Question) {
    const questions = [...this.state.questions, question];
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    this.setState({ questions, totalPoints });
  }

  removeQuestion(questionId: string) {
    const questions = this.state.questions.filter((q) => q.id !== questionId);
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    this.setState({ questions, totalPoints });
  }

  reset() {
    this.state = { ...initialAssignment };
    this.notify();
  }
}

export const assignmentStore = new AssignmentStore();
