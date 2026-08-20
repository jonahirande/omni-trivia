export type InputMode = 'multiple_choice' | 'direct_input';

export interface ScoreCalculationParams {
  basePoints: number;
  timeLimitSec: number;
  remainingTimeSec: number;
  isCorrect: boolean;
  inputMode: InputMode;
}

export interface AnswerSubmitPayload {
  roomId: string;
  questionId: string;
  userId: string;
  selectedOptionId?: string;
  typedAnswer?: string;
  inputMode: InputMode;
}