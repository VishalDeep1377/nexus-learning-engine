export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer?: string; // Optional, only needed if we want to show correct answers
  }
  
  export interface UserAnswer {
    questionId: number;
    selectedOption: string | null;
  }