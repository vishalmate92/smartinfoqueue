
export interface LocationData {
  lat: number;
  lon: number;
  displayName: string;
  type?: string;
  name?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: 'multiple-choice' | 'true-false';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export enum AppScreen {
  HOME = 'HOME',
  QUIZ = 'QUIZ',
  INFO = 'INFO',
  CHAT = 'CHAT',
  MAP = 'MAP'
}
