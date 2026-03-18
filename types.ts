
export interface LocationData {
  lat: number;
  lon: number;
  displayName: string;
  type?: string;
  name?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  rating?: string;
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

export enum AppErrorType {
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  GEOLOCATION_DENIED = 'GEOLOCATION_DENIED',
  GEOLOCATION_UNAVAILABLE = 'GEOLOCATION_UNAVAILABLE',
  GEOLOCATION_TIMEOUT = 'GEOLOCATION_TIMEOUT',
  NOT_FOUND = 'NOT_FOUND',
  AI_FAILURE = 'AI_FAILURE',
  UNKNOWN = 'UNKNOWN'
}

export class AppError extends Error {
  constructor(public type: AppErrorType, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
